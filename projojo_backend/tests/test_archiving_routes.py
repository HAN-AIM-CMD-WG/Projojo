import pytest
from fastapi import HTTPException

from domain.models.archive import (
    ArchiveActionResponse,
    ArchivePreviewResponse,
    RestoreCandidate,
    RestoreCandidates,
    RestorePreviewResponse,
    RestoreRequest,
    RestoreRoot,
    RestoreSelection,
)
from routes import business_router, project_router, task_router


def make_restore_preview(entity_type: str, entity_id: str, *, blocked: bool = False, with_candidates: bool = True):
    return RestorePreviewResponse(
        entity_type=entity_type,
        entity_id=entity_id,
        root=RestoreRoot(
            id=entity_id,
            name=f"{entity_type}-{entity_id}",
            archived_at="2026-01-01T00:00:00+00:00",
            archived_by="teacher-1",
            archived_reason="Omdat",
        ),
        blocked=blocked,
        blocked_reason="Bovenliggend item is nog gearchiveerd" if blocked else None,
        candidates=RestoreCandidates(
            tasks=[
                RestoreCandidate(
                    id="task-1",
                    name="Task 1",
                    archived_at="2026-01-01T00:00:00+00:00",
                    preselected=True,
                )
            ] if with_candidates else [],
            registrations=[
                RestoreCandidate(
                    id="task-1:student-1",
                    name="Student 1",
                    student_name="Student 1",
                    archived_at="2026-01-01T00:00:00+00:00",
                    preselected=True,
                )
            ] if with_candidates else [],
        ),
    )


@pytest.mark.asyncio
async def test_archive_project_preview_returns_preview(monkeypatch):
    preview = ArchivePreviewResponse(entity_type="project", entity_id="project-1")

    monkeypatch.setattr(project_router.project_repo, "get_by_id", lambda project_id: {"id": project_id})
    monkeypatch.setattr(project_router.archive_repo, "preview_project_archive", lambda project_id: preview)

    result = await project_router.archive_project(
        project_id="project-1",
        archive_request=project_router.ArchiveRequest(confirm=False, archived_reason="Omdat"),
        payload={"role": "teacher", "sub": "teacher-1"},
    )

    assert result is preview


@pytest.mark.asyncio
async def test_restore_project_preview_returns_preview(monkeypatch):
    preview = make_restore_preview("project", "project-1", with_candidates=False)
    monkeypatch.setattr(project_router.archive_repo, "preview_project_restore", lambda project_id: preview)

    result = await project_router.restore_project(
        project_id="project-1",
        restore_request=None,
        payload={"role": "teacher"},
    )

    assert result is preview


@pytest.mark.asyncio
async def test_restore_project_blocks_when_parent_archived(monkeypatch):
    preview = make_restore_preview("project", "project-1", blocked=True)
    monkeypatch.setattr(project_router.archive_repo, "preview_project_restore", lambda project_id: preview)

    with pytest.raises(HTTPException) as exc:
        await project_router.restore_project(
            project_id="project-1",
            restore_request=RestoreRequest(confirm=True, selected=RestoreSelection()),
            payload={"role": "teacher"},
        )

    assert exc.value.status_code == 409


@pytest.mark.asyncio
async def test_restore_task_requires_selection_when_candidates_exist(monkeypatch):
    preview = make_restore_preview("task", "task-1")
    monkeypatch.setattr(task_router.archive_repo, "preview_task_restore", lambda task_id: preview)

    with pytest.raises(HTTPException) as exc:
        await task_router.restore_task(
            task_id="task-1",
            restore_request=RestoreRequest(confirm=True, selected=None),
            payload={"role": "teacher"},
        )

    assert exc.value.status_code == 422


@pytest.mark.asyncio
async def test_restore_task_execute_returns_action_response(monkeypatch):
    preview = make_restore_preview("task", "task-1")
    monkeypatch.setattr(task_router.archive_repo, "preview_task_restore", lambda task_id: preview)
    monkeypatch.setattr(task_router.archive_repo, "restore_task", lambda task_id, selected: "restored")

    result = await task_router.restore_task(
        task_id="task-1",
        restore_request=RestoreRequest(confirm=True, selected=RestoreSelection(registrations=["task-1:student-1"])),
        payload={"role": "teacher"},
    )

    assert isinstance(result, ArchiveActionResponse)
    assert result.message == "Taak succesvol hersteld"


@pytest.mark.asyncio
async def test_archive_business_forbidden_for_non_teacher():
    with pytest.raises(HTTPException) as exc:
        await business_router.archive_business(
            business_id="business-1",
            archive_request=business_router.ArchiveRequest(confirm=False, archived_reason="Omdat"),
            payload={"role": "supervisor", "sub": "sup-1"},
        )

    assert exc.value.status_code == 403
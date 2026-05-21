from __future__ import annotations

from datetime import datetime, timezone

from typedb.driver import TransactionType

from db.initDatabase import Db, build_query
from domain.models.archive import (
    AffectedProject,
    AffectedRegistration,
    AffectedSupervisor,
    AffectedTask,
    ArchiveAffectedEntities,
    ArchivePreviewResponse,
    RestoreCandidate,
    RestoreCandidates,
    RestorePreviewResponse,
    RestoreRoot,
    RestoreSelection,
)


class ArchiveRepository:
    ARCHIVE_ATTRS = ("archivedAt", "archivedBy", "archivedReason")

    def _now(self) -> datetime:
        return datetime.now(timezone.utc)

    def _registration_id(self, task_id: str, student_id: str) -> str:
        return f"{task_id}:{student_id}"

    def _split_registration_id(self, registration_id: str) -> tuple[str, str]:
        return registration_id.split(":", 1)

    def _normalize_archive_fetch(self, result: dict) -> dict:
        normalized = dict(result)
        for field in ("archived_at", "archived_by", "archived_reason"):
            value = normalized.get(field, [])
            if isinstance(value, list):
                normalized[field] = value[0] if value else None
        return normalized

    def _metadata_tuple(self, item: dict) -> tuple:
        return (
            item.get("archived_at"),
            item.get("archived_by"),
            item.get("archived_reason"),
        )

    def _matches_root_metadata(self, root: dict, candidate: dict) -> bool:
        return self._metadata_tuple(root) == self._metadata_tuple(candidate)

    def _write_batch(self, operations: list[tuple[str, dict | None]]) -> None:
        if not operations:
            return

        Db.ensure_connection()
        assert Db.driver is not None
        with Db.driver.transaction(Db.name, TransactionType.WRITE) as tx:
            for query, params in operations:
                tx.query(build_query(query, params, allow_none=True) if params else query).resolve()
            tx.commit()

    def _archive_entity_operation(
        self,
        entity_type: str,
        entity_id: str,
        archived_at: datetime,
        archived_by: str,
        archived_reason: str,
    ) -> tuple[str, dict]:
        return (
            f"""
            match
                $entity isa {entity_type}, has id ~entity_id;
                not {{ $entity has archivedAt $already_archived; }};
            insert
                $entity has archivedAt ~archived_at;
                $entity has archivedBy ~archived_by;
                $entity has archivedReason ~archived_reason;
            """,
            {
                "entity_id": entity_id,
                "archived_at": archived_at,
                "archived_by": archived_by,
                "archived_reason": archived_reason,
            },
        )

    def _archive_registration_operation(
        self,
        task_id: str,
        student_id: str,
        archived_at: datetime,
        archived_by: str,
        archived_reason: str,
    ) -> tuple[str, dict]:
        return (
            """
            match
                $task isa task, has id ~task_id;
                $student isa student, has id ~student_id;
                $registration isa registersForTask (task: $task, student: $student);
                not { $registration has archivedAt $already_archived; };
            insert
                $registration has archivedAt ~archived_at;
                $registration has archivedBy ~archived_by;
                $registration has archivedReason ~archived_reason;
            """,
            {
                "task_id": task_id,
                "student_id": student_id,
                "archived_at": archived_at,
                "archived_by": archived_by,
                "archived_reason": archived_reason,
            },
        )

    def _restore_entity_operations(self, entity_type: str, entity_id: str) -> list[tuple[str, dict]]:
        return [
            (
                f"""
                match
                    $entity isa {entity_type}, has id ~entity_id;
                    $value isa {attr};
                    $entity has $value;
                delete
                    has $value of $entity;
                """,
                {"entity_id": entity_id},
            )
            for attr in self.ARCHIVE_ATTRS
        ]

    def _restore_registration_operations(self, task_id: str, student_id: str) -> list[tuple[str, dict]]:
        return [
            (
                f"""
                match
                    $task isa task, has id ~task_id;
                    $student isa student, has id ~student_id;
                    $registration isa registersForTask (task: $task, student: $student);
                    $value isa {attr};
                    $registration has $value;
                delete
                    has $value of $registration;
                """,
                {"task_id": task_id, "student_id": student_id},
            )
            for attr in self.ARCHIVE_ATTRS
        ]

    def _get_business_root(self, business_id: str) -> dict | None:
        results = Db.read_transact(
            """
            match
                $business isa business, has id ~business_id, has name $name;
            fetch {
                'id': $business.id,
                'name': $name,
                'archived_at': [$business.archivedAt],
                'archived_by': [$business.archivedBy],
                'archived_reason': [$business.archivedReason]
            };
            """,
            {"business_id": business_id},
        )
        if not results:
            return None
        return self._normalize_archive_fetch(results[0])

    def _get_project_root(self, project_id: str) -> dict | None:
        results = Db.read_transact(
            """
            match
                $project isa project, has id ~project_id, has name $name;
                $hasProjects isa hasProjects (business: $business, project: $project);
            fetch {
                'id': $project.id,
                'name': $name,
                'business_id': $business.id,
                'parent_business_archived': [$business.archivedAt],
                'archived_at': [$project.archivedAt],
                'archived_by': [$project.archivedBy],
                'archived_reason': [$project.archivedReason]
            };
            """,
            {"project_id": project_id},
        )
        if not results:
            return None
        result = self._normalize_archive_fetch(results[0])
        result["parent_business_archived"] = bool(results[0].get("parent_business_archived", []))
        return result

    def _get_task_root(self, task_id: str) -> dict | None:
        results = Db.read_transact(
            """
            match
                $task isa task, has id ~task_id, has name $name;
                $containsTask isa containsTask (project: $project, task: $task);
                $hasProjects isa hasProjects (business: $business, project: $project);
            fetch {
                'id': $task.id,
                'name': $name,
                'project_id': $project.id,
                'business_id': $business.id,
                'parent_project_archived': [$project.archivedAt],
                'parent_business_archived': [$business.archivedAt],
                'archived_at': [$task.archivedAt],
                'archived_by': [$task.archivedBy],
                'archived_reason': [$task.archivedReason]
            };
            """,
            {"task_id": task_id},
        )
        if not results:
            return None
        result = self._normalize_archive_fetch(results[0])
        result["parent_project_archived"] = bool(results[0].get("parent_project_archived", []))
        result["parent_business_archived"] = bool(results[0].get("parent_business_archived", []))
        return result

    def _get_business_supervisors(self, business_id: str) -> list[dict]:
        return [
            self._normalize_archive_fetch(item)
            for item in Db.read_transact(
                """
                match
                    $business isa business, has id ~business_id;
                    $manages isa manages (supervisor: $supervisor, business: $business);
                    $supervisor has id $id, has fullName $name;
                fetch {
                    'id': $id,
                    'name': $name,
                    'archived_at': [$supervisor.archivedAt],
                    'archived_by': [$supervisor.archivedBy],
                    'archived_reason': [$supervisor.archivedReason]
                };
                """,
                {"business_id": business_id},
            )
        ]

    def _supervisor_has_other_active_business(self, supervisor_id: str, excluding_business_id: str) -> bool:
        results = Db.read_transact(
            """
            match
                $supervisor isa supervisor, has id ~supervisor_id;
                $business isa business, has id $business_id;
                $manages isa manages (supervisor: $supervisor, business: $business);
                not { $business has archivedAt $archived_at; };
                not { $business has id ~excluding_business_id; };
            fetch { 'business_id': $business_id };
            """,
            {"supervisor_id": supervisor_id, "excluding_business_id": excluding_business_id},
        )
        return len(results) > 0

    def _get_active_projects_by_business(self, business_id: str) -> list[dict]:
        return Db.read_transact(
            """
            match
                $business isa business, has id ~business_id;
                $hasProjects isa hasProjects (business: $business, project: $project);
                $project has id $id, has name $name;
                not { $project has archivedAt $archived_at; };
            fetch { 'id': $id, 'name': $name };
            """,
            {"business_id": business_id},
        )

    def _get_active_tasks_by_business(self, business_id: str) -> list[dict]:
        return Db.read_transact(
            """
            match
                $business isa business, has id ~business_id;
                $hasProjects isa hasProjects (business: $business, project: $project);
                $containsTask isa containsTask (project: $project, task: $task);
                $task has id $id, has name $name;
                not { $task has archivedAt $archived_at; };
            fetch { 'id': $id, 'name': $name, 'project_id': $project.id };
            """,
            {"business_id": business_id},
        )

    def _get_active_registrations_by_business(self, business_id: str) -> list[dict]:
        results = Db.read_transact(
            """
            match
                $business isa business, has id ~business_id;
                $hasProjects isa hasProjects (business: $business, project: $project);
                $containsTask isa containsTask (project: $project, task: $task);
                $registration isa registersForTask (task: $task, student: $student);
                $student has id $student_id, has fullName $student_name;
                not { $registration has archivedAt $archived_at; };
            fetch {
                'task_id': $task.id,
                'project_id': $project.id,
                'student_id': $student_id,
                'student_name': $student_name
            };
            """,
            {"business_id": business_id},
        )
        for item in results:
            item["id"] = self._registration_id(item["task_id"], item["student_id"])
        return results

    def _get_active_tasks_by_project(self, project_id: str) -> list[dict]:
        return Db.read_transact(
            """
            match
                $project isa project, has id ~project_id;
                $containsTask isa containsTask (project: $project, task: $task);
                $task has id $id, has name $name;
                not { $task has archivedAt $archived_at; };
            fetch { 'id': $id, 'name': $name };
            """,
            {"project_id": project_id},
        )

    def _get_active_registrations_by_project(self, project_id: str) -> list[dict]:
        results = Db.read_transact(
            """
            match
                $project isa project, has id ~project_id;
                $containsTask isa containsTask (project: $project, task: $task);
                $registration isa registersForTask (task: $task, student: $student);
                $student has id $student_id, has fullName $student_name;
                not { $registration has archivedAt $archived_at; };
            fetch {
                'task_id': $task.id,
                'student_id': $student_id,
                'student_name': $student_name
            };
            """,
            {"project_id": project_id},
        )
        for item in results:
            item["id"] = self._registration_id(item["task_id"], item["student_id"])
        return results

    def _get_active_registrations_by_task(self, task_id: str) -> list[dict]:
        results = Db.read_transact(
            """
            match
                $task isa task, has id ~task_id;
                $registration isa registersForTask (task: $task, student: $student);
                $student has id $student_id, has fullName $student_name;
                not { $registration has archivedAt $archived_at; };
            fetch {
                'task_id': $task.id,
                'student_id': $student_id,
                'student_name': $student_name
            };
            """,
            {"task_id": task_id},
        )
        for item in results:
            item["id"] = self._registration_id(item["task_id"], item["student_id"])
        return results

    def _get_archived_projects_by_business(self, business_id: str) -> list[dict]:
        return [
            self._normalize_archive_fetch(item)
            for item in Db.read_transact(
                """
                match
                    $business isa business, has id ~business_id;
                    $hasProjects isa hasProjects (business: $business, project: $project);
                    $project has id $id, has name $name, has archivedAt $archived_at;
                fetch {
                    'id': $id,
                    'name': $name,
                    'archived_at': [$project.archivedAt],
                    'archived_by': [$project.archivedBy],
                    'archived_reason': [$project.archivedReason]
                };
                """,
                {"business_id": business_id},
            )
        ]

    def _get_archived_tasks_by_business(self, business_id: str) -> list[dict]:
        return [
            self._normalize_archive_fetch(item)
            for item in Db.read_transact(
                """
                match
                    $business isa business, has id ~business_id;
                    $hasProjects isa hasProjects (business: $business, project: $project);
                    $containsTask isa containsTask (project: $project, task: $task);
                    $task has id $id, has name $name, has archivedAt $archived_at;
                fetch {
                    'id': $id,
                    'name': $name,
                    'project_id': $project.id,
                    'archived_at': [$task.archivedAt],
                    'archived_by': [$task.archivedBy],
                    'archived_reason': [$task.archivedReason]
                };
                """,
                {"business_id": business_id},
            )
        ]

    def _get_archived_registrations_by_business(self, business_id: str) -> list[dict]:
        results = [
            self._normalize_archive_fetch(item)
            for item in Db.read_transact(
                """
                match
                    $business isa business, has id ~business_id;
                    $hasProjects isa hasProjects (business: $business, project: $project);
                    $containsTask isa containsTask (project: $project, task: $task);
                    $registration isa registersForTask (task: $task, student: $student), has archivedAt $archived_at;
                    $student has id $student_id, has fullName $student_name;
                fetch {
                    'task_id': $task.id,
                    'project_id': $project.id,
                    'student_id': $student_id,
                    'student_name': $student_name,
                    'archived_at': [$registration.archivedAt],
                    'archived_by': [$registration.archivedBy],
                    'archived_reason': [$registration.archivedReason]
                };
                """,
                {"business_id": business_id},
            )
        ]
        for item in results:
            item["id"] = self._registration_id(item["task_id"], item["student_id"])
        return results

    def _get_archived_supervisors_by_business(self, business_id: str) -> list[dict]:
        return [
            self._normalize_archive_fetch(item)
            for item in Db.read_transact(
                """
                match
                    $business isa business, has id ~business_id;
                    $manages isa manages (supervisor: $supervisor, business: $business);
                    $supervisor has id $id, has fullName $name, has archivedAt $archived_at;
                fetch {
                    'id': $id,
                    'name': $name,
                    'archived_at': [$supervisor.archivedAt],
                    'archived_by': [$supervisor.archivedBy],
                    'archived_reason': [$supervisor.archivedReason]
                };
                """,
                {"business_id": business_id},
            )
        ]

    def _get_archived_tasks_by_project(self, project_id: str) -> list[dict]:
        return [
            self._normalize_archive_fetch(item)
            for item in Db.read_transact(
                """
                match
                    $project isa project, has id ~project_id;
                    $containsTask isa containsTask (project: $project, task: $task);
                    $task has id $id, has name $name, has archivedAt $archived_at;
                fetch {
                    'id': $id,
                    'name': $name,
                    'project_id': $project.id,
                    'archived_at': [$task.archivedAt],
                    'archived_by': [$task.archivedBy],
                    'archived_reason': [$task.archivedReason]
                };
                """,
                {"project_id": project_id},
            )
        ]

    def _get_archived_registrations_by_project(self, project_id: str) -> list[dict]:
        results = [
            self._normalize_archive_fetch(item)
            for item in Db.read_transact(
                """
                match
                    $project isa project, has id ~project_id;
                    $containsTask isa containsTask (project: $project, task: $task);
                    $registration isa registersForTask (task: $task, student: $student), has archivedAt $archived_at;
                    $student has id $student_id, has fullName $student_name;
                fetch {
                    'task_id': $task.id,
                    'student_id': $student_id,
                    'student_name': $student_name,
                    'archived_at': [$registration.archivedAt],
                    'archived_by': [$registration.archivedBy],
                    'archived_reason': [$registration.archivedReason]
                };
                """,
                {"project_id": project_id},
            )
        ]
        for item in results:
            item["id"] = self._registration_id(item["task_id"], item["student_id"])
        return results

    def _get_archived_registrations_by_task(self, task_id: str) -> list[dict]:
        results = [
            self._normalize_archive_fetch(item)
            for item in Db.read_transact(
                """
                match
                    $task isa task, has id ~task_id;
                    $registration isa registersForTask (task: $task, student: $student), has archivedAt $archived_at;
                    $student has id $student_id, has fullName $student_name;
                fetch {
                    'task_id': $task.id,
                    'student_id': $student_id,
                    'student_name': $student_name,
                    'archived_at': [$registration.archivedAt],
                    'archived_by': [$registration.archivedBy],
                    'archived_reason': [$registration.archivedReason]
                };
                """,
                {"task_id": task_id},
            )
        ]
        for item in results:
            item["id"] = self._registration_id(item["task_id"], item["student_id"])
        return results

    def _to_restore_root(self, root: dict) -> RestoreRoot:
        return RestoreRoot(
            id=root["id"],
            name=root["name"],
            archived_at=root["archived_at"],
            archived_by=root.get("archived_by"),
            archived_reason=root.get("archived_reason"),
        )

    def preview_business_archive(self, business_id: str) -> ArchivePreviewResponse | None:
        if not self._get_business_root(business_id):
            return None

        supervisors = []
        for supervisor in self._get_business_supervisors(business_id):
            will_be_archived = not supervisor.get("archived_at") and not self._supervisor_has_other_active_business(
                supervisor["id"], business_id
            )
            if will_be_archived:
                supervisors.append(
                    AffectedSupervisor(id=supervisor["id"], name=supervisor["name"], will_be_archived=True)
                )

        return ArchivePreviewResponse(
            entity_type="business",
            entity_id=business_id,
            affected=ArchiveAffectedEntities(
                projects=[AffectedProject(id=item["id"], name=item["name"]) for item in self._get_active_projects_by_business(business_id)],
                tasks=[AffectedTask(id=item["id"], name=item["name"]) for item in self._get_active_tasks_by_business(business_id)],
                registrations=[AffectedRegistration(id=item["id"], student_name=item["student_name"]) for item in self._get_active_registrations_by_business(business_id)],
                supervisors=supervisors,
            ),
        )

    def preview_project_archive(self, project_id: str) -> ArchivePreviewResponse | None:
        if not self._get_project_root(project_id):
            return None

        return ArchivePreviewResponse(
            entity_type="project",
            entity_id=project_id,
            affected=ArchiveAffectedEntities(
                tasks=[AffectedTask(id=item["id"], name=item["name"]) for item in self._get_active_tasks_by_project(project_id)],
                registrations=[AffectedRegistration(id=item["id"], student_name=item["student_name"]) for item in self._get_active_registrations_by_project(project_id)],
            ),
        )

    def preview_task_archive(self, task_id: str) -> ArchivePreviewResponse | None:
        if not self._get_task_root(task_id):
            return None

        return ArchivePreviewResponse(
            entity_type="task",
            entity_id=task_id,
            affected=ArchiveAffectedEntities(
                registrations=[AffectedRegistration(id=item["id"], student_name=item["student_name"]) for item in self._get_active_registrations_by_task(task_id)]
            ),
        )

    def archive_business(self, business_id: str, archived_by: str, archived_reason: str) -> None:
        root = self._get_business_root(business_id)
        if not root:
            return

        archived_at = self._now()
        descendant_reason = f"Automatisch gearchiveerd via bedrijf '{root['name']}'"
        operations = [self._archive_entity_operation("business", business_id, archived_at, archived_by, archived_reason)]
        operations.extend(
            self._archive_entity_operation("project", item["id"], archived_at, archived_by, descendant_reason)
            for item in self._get_active_projects_by_business(business_id)
        )
        operations.extend(
            self._archive_entity_operation("task", item["id"], archived_at, archived_by, descendant_reason)
            for item in self._get_active_tasks_by_business(business_id)
        )
        operations.extend(
            self._archive_registration_operation(item["task_id"], item["student_id"], archived_at, archived_by, descendant_reason)
            for item in self._get_active_registrations_by_business(business_id)
        )
        for supervisor in self._get_business_supervisors(business_id):
            if not supervisor.get("archived_at") and not self._supervisor_has_other_active_business(supervisor["id"], business_id):
                operations.append(self._archive_entity_operation("supervisor", supervisor["id"], archived_at, archived_by, descendant_reason))
        self._write_batch(operations)

    def archive_project(self, project_id: str, archived_by: str, archived_reason: str) -> None:
        root = self._get_project_root(project_id)
        if not root:
            return

        archived_at = self._now()
        descendant_reason = f"Automatisch gearchiveerd via project '{root['name']}'"
        operations = [self._archive_entity_operation("project", project_id, archived_at, archived_by, archived_reason)]
        operations.extend(
            self._archive_entity_operation("task", item["id"], archived_at, archived_by, descendant_reason)
            for item in self._get_active_tasks_by_project(project_id)
        )
        operations.extend(
            self._archive_registration_operation(item["task_id"], item["student_id"], archived_at, archived_by, descendant_reason)
            for item in self._get_active_registrations_by_project(project_id)
        )
        self._write_batch(operations)

    def archive_task(self, task_id: str, archived_by: str, archived_reason: str) -> None:
        root = self._get_task_root(task_id)
        if not root:
            return

        archived_at = self._now()
        descendant_reason = f"Automatisch gearchiveerd via taak '{root['name']}'"
        operations = [self._archive_entity_operation("task", task_id, archived_at, archived_by, archived_reason)]
        operations.extend(
            self._archive_registration_operation(item["task_id"], item["student_id"], archived_at, archived_by, descendant_reason)
            for item in self._get_active_registrations_by_task(task_id)
        )
        self._write_batch(operations)

    def preview_business_restore(self, business_id: str) -> RestorePreviewResponse | None:
        root = self._get_business_root(business_id)
        if not root or not root.get("archived_at"):
            return None

        projects = self._get_archived_projects_by_business(business_id)
        preselected_projects = {item["id"] for item in projects if self._matches_root_metadata(root, item)}
        tasks = []
        for item in self._get_archived_tasks_by_business(business_id):
            preselected = self._matches_root_metadata(root, item)
            blocked = item.get("project_id") not in preselected_projects
            tasks.append(
                RestoreCandidate(
                    id=item["id"],
                    name=item["name"],
                    archived_at=item["archived_at"],
                    archived_by=item.get("archived_by"),
                    archived_reason=item.get("archived_reason"),
                    preselected=preselected,
                    blocked=blocked,
                    blocked_reason="Bovenliggend project blijft gearchiveerd" if blocked else None,
                    parent_id=item.get("project_id"),
                    project_id=item.get("project_id"),
                    business_id=business_id,
                )
            )
        preselected_tasks = {item.id for item in tasks if item.preselected and not item.blocked}
        registrations = []
        for item in self._get_archived_registrations_by_business(business_id):
            preselected = self._matches_root_metadata(root, item)
            blocked = item.get("task_id") not in preselected_tasks
            registrations.append(
                RestoreCandidate(
                    id=item["id"],
                    name=item["student_name"],
                    student_name=item["student_name"],
                    archived_at=item["archived_at"],
                    archived_by=item.get("archived_by"),
                    archived_reason=item.get("archived_reason"),
                    preselected=preselected,
                    blocked=blocked,
                    blocked_reason="Bovenliggende taak blijft gearchiveerd" if blocked else None,
                    parent_id=item.get("task_id"),
                    project_id=item.get("project_id"),
                    business_id=business_id,
                )
            )
        supervisors = [
            RestoreCandidate(
                id=item["id"],
                name=item["name"],
                archived_at=item["archived_at"],
                archived_by=item.get("archived_by"),
                archived_reason=item.get("archived_reason"),
                preselected=self._matches_root_metadata(root, item),
                business_id=business_id,
            )
            for item in self._get_archived_supervisors_by_business(business_id)
        ]
        return RestorePreviewResponse(
            entity_type="business",
            entity_id=business_id,
            root=self._to_restore_root(root),
            candidates=RestoreCandidates(
                projects=[
                    RestoreCandidate(
                        id=item["id"],
                        name=item["name"],
                        archived_at=item["archived_at"],
                        archived_by=item.get("archived_by"),
                        archived_reason=item.get("archived_reason"),
                        preselected=self._matches_root_metadata(root, item),
                        business_id=business_id,
                    )
                    for item in projects
                ],
                tasks=tasks,
                registrations=registrations,
                supervisors=supervisors,
            ),
        )

    def preview_project_restore(self, project_id: str) -> RestorePreviewResponse | None:
        root = self._get_project_root(project_id)
        if not root or not root.get("archived_at"):
            return None

        tasks = self._get_archived_tasks_by_project(project_id)
        preselected_tasks = {item["id"] for item in tasks if self._matches_root_metadata(root, item)}
        registrations = []
        for item in self._get_archived_registrations_by_project(project_id):
            preselected = self._matches_root_metadata(root, item)
            blocked = item.get("task_id") not in preselected_tasks
            registrations.append(
                RestoreCandidate(
                    id=item["id"],
                    name=item["student_name"],
                    student_name=item["student_name"],
                    archived_at=item["archived_at"],
                    archived_by=item.get("archived_by"),
                    archived_reason=item.get("archived_reason"),
                    preselected=preselected,
                    blocked=blocked,
                    blocked_reason="Bovenliggende taak blijft gearchiveerd" if blocked else None,
                    parent_id=item.get("task_id"),
                    project_id=project_id,
                    business_id=root.get("business_id"),
                )
            )
        blocked = bool(root.get("parent_business_archived"))
        return RestorePreviewResponse(
            entity_type="project",
            entity_id=project_id,
            root=self._to_restore_root(root),
            blocked=blocked,
            blocked_reason="Bovenliggend bedrijf is nog gearchiveerd" if blocked else None,
            candidates=RestoreCandidates(
                tasks=[
                    RestoreCandidate(
                        id=item["id"],
                        name=item["name"],
                        archived_at=item["archived_at"],
                        archived_by=item.get("archived_by"),
                        archived_reason=item.get("archived_reason"),
                        preselected=self._matches_root_metadata(root, item),
                        parent_id=project_id,
                        project_id=project_id,
                        business_id=root.get("business_id"),
                    )
                    for item in tasks
                ],
                registrations=registrations,
            ),
        )

    def preview_task_restore(self, task_id: str) -> RestorePreviewResponse | None:
        root = self._get_task_root(task_id)
        if not root or not root.get("archived_at"):
            return None

        blocked = bool(root.get("parent_project_archived") or root.get("parent_business_archived"))
        blocked_reason = None
        if root.get("parent_project_archived"):
            blocked_reason = "Bovenliggend project is nog gearchiveerd"
        elif root.get("parent_business_archived"):
            blocked_reason = "Bovenliggend bedrijf is nog gearchiveerd"
        return RestorePreviewResponse(
            entity_type="task",
            entity_id=task_id,
            root=self._to_restore_root(root),
            blocked=blocked,
            blocked_reason=blocked_reason,
            candidates=RestoreCandidates(
                registrations=[
                    RestoreCandidate(
                        id=item["id"],
                        name=item["student_name"],
                        student_name=item["student_name"],
                        archived_at=item["archived_at"],
                        archived_by=item.get("archived_by"),
                        archived_reason=item.get("archived_reason"),
                        preselected=self._matches_root_metadata(root, item),
                        parent_id=task_id,
                        project_id=root.get("project_id"),
                        business_id=root.get("business_id"),
                    )
                    for item in self._get_archived_registrations_by_task(task_id)
                ]
            ),
        )

    def restore_business(self, business_id: str, selected: RestoreSelection | None = None) -> str:
        root = self._get_business_root(business_id)
        if not root:
            return "missing"
        if not root.get("archived_at"):
            return "active"

        selected = selected or RestoreSelection()
        operations = self._restore_entity_operations("business", business_id)
        selected_projects = set(selected.projects)
        selected_tasks = set(selected.tasks)
        selected_registrations = set(selected.registrations)
        selected_supervisors = set(selected.supervisors)

        archived_projects = self._get_archived_projects_by_business(business_id)
        active_project_ids = {item["id"] for item in archived_projects if item["id"] in selected_projects}
        for project_id in active_project_ids:
            operations.extend(self._restore_entity_operations("project", project_id))

        archived_tasks = self._get_archived_tasks_by_business(business_id)
        active_task_ids = {item["id"] for item in archived_tasks if item["id"] in selected_tasks and item.get("project_id") in active_project_ids}
        for task_id in active_task_ids:
            operations.extend(self._restore_entity_operations("task", task_id))

        for registration in self._get_archived_registrations_by_business(business_id):
            if registration["id"] in selected_registrations and registration.get("task_id") in active_task_ids:
                task_id, student_id = self._split_registration_id(registration["id"])
                operations.extend(self._restore_registration_operations(task_id, student_id))

        for supervisor in self._get_archived_supervisors_by_business(business_id):
            if supervisor["id"] in selected_supervisors:
                operations.extend(self._restore_entity_operations("supervisor", supervisor["id"]))

        self._write_batch(operations)
        return "restored"

    def restore_project(self, project_id: str, selected: RestoreSelection | None = None) -> str:
        root = self._get_project_root(project_id)
        if not root:
            return "missing"
        if not root.get("archived_at"):
            return "active"
        if root.get("parent_business_archived"):
            return "blocked"

        selected = selected or RestoreSelection()
        operations = self._restore_entity_operations("project", project_id)
        active_task_ids = {item["id"] for item in self._get_archived_tasks_by_project(project_id) if item["id"] in set(selected.tasks)}
        for task_id in active_task_ids:
            operations.extend(self._restore_entity_operations("task", task_id))

        for registration in self._get_archived_registrations_by_project(project_id):
            if registration["id"] in set(selected.registrations) and registration.get("task_id") in active_task_ids:
                task_id, student_id = self._split_registration_id(registration["id"])
                operations.extend(self._restore_registration_operations(task_id, student_id))

        self._write_batch(operations)
        return "restored"

    def restore_task(self, task_id: str, selected: RestoreSelection | None = None) -> str:
        root = self._get_task_root(task_id)
        if not root:
            return "missing"
        if not root.get("archived_at"):
            return "active"
        if root.get("parent_project_archived") or root.get("parent_business_archived"):
            return "blocked"

        selected = selected or RestoreSelection()
        operations = self._restore_entity_operations("task", task_id)
        for registration in self._get_archived_registrations_by_task(task_id):
            if registration["id"] in set(selected.registrations):
                registration_task_id, student_id = self._split_registration_id(registration["id"])
                operations.extend(self._restore_registration_operations(registration_task_id, student_id))

        self._write_batch(operations)
        return "restored"

    def is_business_archived(self, business_id: str) -> bool:
        root = self._get_business_root(business_id)
        return bool(root and root.get("archived_at"))

    def is_project_archived(self, project_id: str) -> bool:
        root = self._get_project_root(project_id)
        return bool(root and root.get("archived_at"))

    def is_task_archived(self, task_id: str) -> bool:
        root = self._get_task_root(task_id)
        return bool(root and root.get("archived_at"))
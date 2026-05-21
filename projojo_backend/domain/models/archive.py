from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


ArchiveEntityType = Literal["business", "project", "task"]


class ArchiveMetadata(BaseModel):
    archived_at: datetime | None = None
    archived_by: str | None = None
    archived_reason: str | None = None


class ArchiveRequest(BaseModel):
    confirm: bool = False
    archived_reason: str = Field(min_length=1, max_length=1000)


class RestoreSelection(BaseModel):
    projects: list[str] = Field(default_factory=list)
    tasks: list[str] = Field(default_factory=list)
    registrations: list[str] = Field(default_factory=list)
    supervisors: list[str] = Field(default_factory=list)


class RestoreRequest(BaseModel):
    confirm: bool = False
    selected: RestoreSelection | None = None


class AffectedProject(BaseModel):
    id: str
    name: str


class AffectedTask(BaseModel):
    id: str
    name: str


class AffectedRegistration(BaseModel):
    id: str
    student_name: str


class AffectedSupervisor(BaseModel):
    id: str
    name: str
    will_be_archived: bool


class ArchiveAffectedEntities(BaseModel):
    projects: list[AffectedProject] = Field(default_factory=list)
    tasks: list[AffectedTask] = Field(default_factory=list)
    registrations: list[AffectedRegistration] = Field(default_factory=list)
    supervisors: list[AffectedSupervisor] = Field(default_factory=list)


class ArchivePreviewResponse(BaseModel):
    preview: bool = True
    operation: Literal["archive"] = "archive"
    entity_type: ArchiveEntityType
    entity_id: str
    affected: ArchiveAffectedEntities = Field(default_factory=ArchiveAffectedEntities)


class RestoreRoot(BaseModel):
    id: str
    name: str
    archived_at: datetime
    archived_by: str | None = None
    archived_reason: str | None = None


class RestoreCandidate(BaseModel):
    id: str
    name: str
    archived_at: datetime
    archived_by: str | None = None
    archived_reason: str | None = None
    preselected: bool = False
    blocked: bool = False
    blocked_reason: str | None = None
    parent_id: str | None = None
    business_id: str | None = None
    project_id: str | None = None
    student_name: str | None = None
    will_be_archived: bool | None = None


class RestoreCandidates(BaseModel):
    projects: list[RestoreCandidate] = Field(default_factory=list)
    tasks: list[RestoreCandidate] = Field(default_factory=list)
    registrations: list[RestoreCandidate] = Field(default_factory=list)
    supervisors: list[RestoreCandidate] = Field(default_factory=list)


class RestorePreviewResponse(BaseModel):
    preview: bool = True
    operation: Literal["restore"] = "restore"
    entity_type: ArchiveEntityType
    entity_id: str
    root: RestoreRoot
    candidates: RestoreCandidates = Field(default_factory=RestoreCandidates)
    blocked: bool = False
    blocked_reason: str | None = None


class ArchiveExecutionResponse(BaseModel):
    message: str


class ArchivedBusinessItem(ArchiveMetadata):
    id: str
    name: str
    location: str
    image_path: str


class ArchivedProjectItem(ArchiveMetadata):
    id: str
    name: str
    business_id: str
    business_name: str | None = None
    parent_business_archived: bool = False


class ArchivedTaskItem(ArchiveMetadata):
    id: str
    name: str
    project_id: str
    project_name: str | None = None
    business_id: str | None = None
    business_name: str | None = None
    parent_project_archived: bool = False
    parent_business_archived: bool = False


# Backward-compatible aliases while routes/repositories migrate to the final spec names.
ArchivePreviewItem = RestoreCandidate
ArchivePreview = ArchivePreviewResponse
RestorePreview = RestorePreviewResponse
ArchiveActionResponse = ArchiveExecutionResponse
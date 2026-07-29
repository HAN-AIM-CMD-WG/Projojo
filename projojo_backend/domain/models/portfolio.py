from pydantic import BaseModel, Field


class PortfolioStudentIdentity(BaseModel):
    id: str
    full_name: str
    image_path: str
    portfolio_summary: str | None = None
    portfolio_slug: str | None = None
    is_portfolio_world_public: bool = False


class PortfolioTaskDisplay(BaseModel):
    name: str
    description: str | None = None


class PortfolioProjectDisplay(BaseModel):
    name: str
    description: str | None = None


class PortfolioBusinessDisplay(BaseModel):
    name: str
    location: str | None = None


class PortfolioStudentDisplay(BaseModel):
    full_name: str
    image_path: str | None = None


class PortfolioCuration(BaseModel):
    is_retired: bool
    retired_at: str | None = None
    is_hidden: bool
    hidden_at: str | None = None
    hidden_by_role: str | None = None
    hidden_by_user_id: str | None = None
    is_student_hidden: bool = False
    display_order: int | None = None
    is_authenticated_public_retraction: bool
    is_world_visible: bool


class PortfolioArchivedSource(BaseModel):
    task: bool = False
    project: bool = False
    business: bool = False


class PortfolioSourceNavigation(BaseModel):
    # state is one of "enabled", "disabled", or "restricted". Under the current archiving model
    # only "enabled" (live source project) and "disabled" (archived source project) are emitted;
    # "restricted" is reserved for a future viewer-scoped availability rule. reason is user-facing
    # Dutch copy suitable for direct UI display.
    state: str
    reason: str


class PortfolioVisibility(BaseModel):
    viewer_can_see: bool
    reason: str


class PortfolioReviewAuthor(BaseModel):
    id: str
    role: str
    full_name: str


class PortfolioReviewCreateRequest(BaseModel):
    review_text: str = Field(max_length=2000)
    rating: int | None = Field(default=None, ge=1, le=5)
    public_review_notice_accepted: bool = False


class PortfolioReviewUpdateRequest(BaseModel):
    # Both fields are optional so an edit may change the text, the rating, or both. Only fields
    # present in the request body are applied (see model_fields_set in the route); an explicit
    # null rating removes the rating. rating bounds still apply to any provided integer value.
    review_text: str | None = Field(default=None, max_length=2000)
    rating: int | None = Field(default=None, ge=1, le=5)


class PortfolioItemCurationUpdate(BaseModel):
    # Student item curation (PF-task-011a). Every field is optional; only fields present in the
    # request body are applied (tracked via model_fields_set in the route). display_order sets the
    # owner's explicit ordering, is_student_hidden is the student's own hide flag (independent from
    # a teacher hide), is_world_visible selects the item for world-public output, and
    # is_authenticated_public_retraction remains the PF-task-007c supervisor-facing retraction.
    display_order: int | None = None
    is_student_hidden: bool | None = None
    is_world_visible: bool | None = None
    is_authenticated_public_retraction: bool | None = None


class PortfolioReviewWorldVisibleUpdate(BaseModel):
    # Student review world-public selection (PF-task-012a). The endpoint's sole purpose is to
    # select or retract a single owned review for world-public output, so is_world_visible is
    # required: true marks it eligible, false retracts it.
    is_world_visible: bool


class PortfolioSettingsResponse(BaseModel):
    # Owner-facing settings read. slug is always present: it is generated on first read when the
    # student has none yet (see repository.get_or_create_settings), so the frontend always has a
    # public URL key to show. is_world_public defaults to False (world-private by default).
    summary: str | None = None
    slug: str
    is_world_public: bool = False


class PortfolioSettingsUpdateRequest(BaseModel):
    # Every field is optional; only fields present in the request body are applied (tracked via
    # model_fields_set in the route). Validation (summary length, slug format, slug uniqueness) is
    # performed in the route so it can return Dutch user-facing messages.
    summary: str | None = None
    slug: str | None = None
    is_world_public: bool | None = None


class PortfolioReviewMutationResponse(BaseModel):
    # Explicit contract for the review create/edit endpoints: both return the affected review id.
    id: str


class PortfolioReviewResponse(BaseModel):
    id: str
    item_id: str
    review_text: str
    rating: int | None = None
    created_at: str
    updated_at: str
    is_world_visible: bool
    public_notice_accepted_at: str
    author: PortfolioReviewAuthor


class PortfolioItemResponse(BaseModel):
    id: str
    created_at: str
    completed_at: str
    source_student_id: str
    source_registration_id: str
    source_task_id: str
    source_project_id: str
    source_business_id: str
    student: PortfolioStudentDisplay
    task: PortfolioTaskDisplay
    project: PortfolioProjectDisplay
    business: PortfolioBusinessDisplay
    skills: list[str] = Field(default_factory=list)
    timeline_start_date: str | None = None
    timeline_end_date: str | None = None
    curation: PortfolioCuration
    archived_source: PortfolioArchivedSource
    source_navigation: PortfolioSourceNavigation
    visibility: PortfolioVisibility
    reviews: list[PortfolioReviewResponse] = Field(default_factory=list)


class PortfolioResponse(BaseModel):
    viewer_role: str
    student: PortfolioStudentIdentity
    items: list[PortfolioItemResponse] = Field(default_factory=list)
    reviews: list[PortfolioReviewResponse] = Field(default_factory=list)

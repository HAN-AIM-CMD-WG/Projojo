from datetime import date, datetime
import re
from typing import Any

from db.initDatabase import Db
from service.uuid_service import generate_uuid


# Shared fetch projection for a single portfolioItem row. Both the list read
# (get_visible_items) and the ownership-scoped single read (get_owned_item) return the
# identical item shape; only their match clauses differ (visibility filters vs. ownership
# scope), so the projection is defined once here. It dot-projects off $item and $student,
# which are bound by both callers' match clauses (each binds $owner_student_name and
# $owner_student_image_path on $student). No ~params appear here, so it is safe to concatenate.
_PORTFOLIO_ITEM_FETCH_PROJECTION = """
    fetch {
        'id': $item.id,
        'created_at': $item.createdAt,
        'completed_at': $item.completedAt,
        'owner_student_id': $student.id,
        'owner_student_name': $owner_student_name,
        'owner_student_image_path': $owner_student_image_path,
        'source_student_id': [ $item.sourceStudentId ],
        'source_registration_id': $item.sourceRegistrationId,
        'source_task_id': $item.sourceTaskId,
        'source_project_id': $item.sourceProjectId,
        'source_business_id': $item.sourceBusinessId,
        'student_name': [ $item.studentName ],
        'student_image_path': [ $item.studentImagePath ],
        'task_name': $item.taskName,
        'task_description': [ $item.taskDescription ],
        'project_name': $item.projectName,
        'project_description': [ $item.projectDescription ],
        'business_name': $item.businessName,
        'business_location': [ $item.businessLocation ],
        'skills': [
            match
                $item has skillName $skill_name;
            fetch { 'name': $skill_name };
        ],
        'timeline_start_date': [ $item.timelineStartDate ],
        'timeline_end_date': [ $item.timelineEndDate ],
        'is_retired': $item.isRetired,
        'retired_at': [ $item.retiredAt ],
        'is_hidden': $item.isHidden,
        'hidden_at': [ $item.hiddenAt ],
        'hidden_by_role': [ $item.hiddenByRole ],
        'hidden_by_user_id': [ $item.hiddenByUserId ],
        'display_order': [ $item.displayOrder ],
        'is_authenticated_public_retraction': $item.isAuthenticatedPublicRetraction,
        'is_world_visible': $item.isWorldVisible
    };
"""


class PortfolioRepository:
    _ROLE_TYPE_TOKENS: dict[str, str] = {
        "teacher": "teacher",
        "supervisor": "supervisor",
    }

    def create_review(
        self,
        item_id: str,
        author_id: str,
        author_role: str,
        business_id: str | None,
        review_text: str,
        public_review_notice_accepted: bool,
        rating: int | None = None,
    ) -> str:
        author_type_token = self._ROLE_TYPE_TOKENS.get(author_role)
        if author_type_token is None:
            raise PermissionError("Alleen docenten en begeleiders kunnen portfolio-reviews schrijven.")
        if public_review_notice_accepted is not True:
            raise ValueError("Je moet de publieke reviewmelding accepteren voordat je reviewtekst indient.")

        item_state = self._get_reviewable_item_state(item_id)
        if item_state is None:
            raise ValueError("Portfolio-item niet gevonden.")
        if item_state["is_retired"]:
            raise ValueError("Reviews kunnen niet worden toegevoegd aan ingetrokken portfolio-evidence.")
        item_business_id = item_state["business_id"]
        if author_role == "supervisor" and item_business_id != business_id:
            raise PermissionError("Je hebt hier geen rechten voor.")

        review_id = generate_uuid()
        now = datetime.now()
        query = f"""
            match
                $item isa portfolioItem,
                    has id ~item_id,
                    has sourceBusinessId ~item_business_id,
                    has isRetired false;
                $author isa {author_type_token}, has id ~author_id;
            insert
                $review isa portfolioReview,
                    has id ~review_id,
                    has reviewText ~review_text,
                    has rating ~rating,
                    has createdAt ~created_at,
                    has updatedAt ~updated_at,
                    has isWorldVisible false,
                    has publicNoticeAcceptedAt ~public_notice_accepted_at;
                $review_link isa hasPortfolioReview (item: $item, review: $review);
                $author_link isa portfolioReviewAuthor (review: $review, author: $author);
        """
        Db.write_transact(
            query,
            {
                "item_id": item_id,
                "item_business_id": item_business_id,
                "author_id": author_id,
                "review_id": review_id,
                "review_text": review_text,
                "rating": rating,
                "created_at": now,
                "updated_at": now,
                "public_notice_accepted_at": now,
            },
        )
        if not self._review_exists(review_id):
            raise ValueError("Portfolio-item niet gevonden of niet meer reviewbaar.")
        return review_id

    def _review_exists(self, review_id: str) -> bool:
        rows = Db.read_transact(
            """
            match
                $review isa portfolioReview, has id ~review_id;
            fetch { 'id': $review.id };
        """,
            {"review_id": review_id},
            sort_fields=False,
        )
        return bool(rows)

    def _get_reviewable_item_state(self, item_id: str) -> dict[str, Any] | None:
        rows = Db.read_transact(
            """
            match
                $item isa portfolioItem, has id ~item_id, has sourceBusinessId $business_id, has isRetired $is_retired;
            fetch { 'business_id': $business_id, 'is_retired': $is_retired };
        """,
            {"item_id": item_id},
            sort_fields=False,
        )
        if not rows:
            return None
        return {
            "business_id": self._one(rows[0].get("business_id")),
            "is_retired": bool(self._one(rows[0].get("is_retired"), False)),
        }

    def get_student_identity(self, student_id: str) -> dict[str, Any] | None:
        query = """
            match
                $student isa student, has id ~student_id;
            fetch {
                'id': $student.id,
                'full_name': $student.fullName,
                'image_path': $student.imagePath,
                'portfolio_summary': [ $student.portfolioSummary ],
                'portfolio_slug': [ $student.portfolioSlug ],
                'is_portfolio_world_public': [ $student.isPortfolioWorldPublic ]
            };
        """
        results = Db.read_transact(query, {"student_id": student_id})
        if not results:
            return None

        student = results[0]
        return {
            "id": self._one(student.get("id")),
            "full_name": self._one(student.get("full_name")),
            "image_path": self._one(student.get("image_path")),
            "portfolio_summary": self._one(student.get("portfolio_summary")),
            "portfolio_slug": self._one(student.get("portfolio_slug")),
            "is_portfolio_world_public": bool(self._one(student.get("is_portfolio_world_public"), False)),
        }

    def get_world_public_student_identity_by_slug(self, slug: str) -> dict[str, Any] | None:
        query = """
            match
                $student isa student, has portfolioSlug ~slug, has isPortfolioWorldPublic true;
            fetch {
                'id': $student.id,
                'full_name': $student.fullName,
                'image_path': $student.imagePath,
                'portfolio_summary': [ $student.portfolioSummary ],
                'portfolio_slug': $student.portfolioSlug,
                'is_portfolio_world_public': $student.isPortfolioWorldPublic
            };
        """
        results = Db.read_transact(query, {"slug": slug})
        if not results:
            return None

        student = results[0]
        return {
            "id": self._one(student.get("id")),
            "full_name": self._one(student.get("full_name")),
            "image_path": self._one(student.get("image_path")),
            "portfolio_summary": self._one(student.get("portfolio_summary")),
            "portfolio_slug": self._one(student.get("portfolio_slug")),
            "is_portfolio_world_public": bool(self._one(student.get("is_portfolio_world_public"), False)),
        }

    def has_supervisor_relationship(self, student_id: str, business_id: str) -> bool:
        # Portfolio-level gate: a supervisor's business relates to the student when the student
        # has a currently open application (no acceptance decision yet) or has ever been accepted
        # for a task in that business. A rejected-only application (isAccepted false) does not qualify.
        query = """
            match
                $student isa student, has id ~student_id;
                $business isa business, has id ~business_id;
                $project isa project;
                $task isa task;
                $hasProjects isa hasProjects(business: $business, project: $project);
                $containsTask isa containsTask(project: $project, task: $task);
                $registration isa registersForTask(student: $student, task: $task);
                { $registration has acceptedAt $accepted_at; } or { not { $registration has isAccepted $decision; }; };
            fetch { 'student_id': $student.id };
        """
        return bool(Db.read_transact(query, {"student_id": student_id, "business_id": business_id}))

    def get_visible_items(self, student_id: str, viewer_role: str) -> list[dict[str, Any]]:
        # Visibility-filtered list read: retired and hidden items are excluded in the match. The
        # shared projection still requires every canonical attribute to exist, so the returned
        # shape is identical to get_owned_item.
        query = (
            """
            match
                $student isa student, has id ~student_id, has fullName $owner_student_name, has imagePath $owner_student_image_path;
                $item isa portfolioItem, has isRetired false, has isHidden false;
                $ownership isa hasPortfolio(student: $student, item: $item);
            """
            + _PORTFOLIO_ITEM_FETCH_PROJECTION
        )
        rows = Db.read_transact(query, {"student_id": student_id})
        archived_projects, archived_businesses = self._archived_source_sets(rows)
        items = [self._map_item(row, viewer_role, archived_projects, archived_businesses) for row in rows]
        return sorted(
            items,
            key=lambda item: (
                item["curation"]["display_order"] is None,
                item["curation"]["display_order"] or 0,
                item["id"],
            ),
        )

    def get_world_public_items(self, student_id: str) -> list[dict[str, Any]]:
        return [item for item in self.get_visible_items(student_id, "public") if item["curation"]["is_world_visible"]]

    def get_owned_item(self, item_id: str, owner_student_id: str) -> dict[str, Any] | None:
        # Ownership-scoped single-item read for the student's own curation endpoint. Unlike
        # get_visible_items it does not filter retired/hidden items, so the owner always gets the
        # canonical post-mutation state back. Returns None when the item does not belong to the caller.
        query = (
            """
            match
                $student isa student, has id ~owner_student_id, has fullName $owner_student_name, has imagePath $owner_student_image_path;
                $item isa portfolioItem, has id ~item_id;
                $ownership isa hasPortfolio(student: $student, item: $item);
            """
            + _PORTFOLIO_ITEM_FETCH_PROJECTION
        )
        rows = Db.read_transact(query, {"item_id": item_id, "owner_student_id": owner_student_id})
        if not rows:
            return None
        archived_projects, archived_businesses = self._archived_source_sets(rows)
        return self._map_item(rows[0], "student", archived_projects, archived_businesses)

    def set_authenticated_public_retraction(self, item_id: str, owner_student_id: str, retracted: bool) -> None:
        # Owner-scoped write (defense in depth): the match requires the caller to own the item via
        # hasPortfolio, so the flag can never be flipped on an item the student does not own even if
        # the route-level ownership guard were ever bypassed. Only the authenticated-public retraction
        # flag is touched; world-public selection and every other curation attribute are left
        # untouched (PF-task-007c is independent from world-public).
        query = """
            match
                $student isa student, has id ~owner_student_id;
                $item isa portfolioItem, has id ~item_id;
                $ownership isa hasPortfolio(student: $student, item: $item);
            update
                $item has isAuthenticatedPublicRetraction ~retracted;
        """
        Db.write_transact(query, {"item_id": item_id, "owner_student_id": owner_student_id, "retracted": retracted})

    def get_reviews_for_items(self, item_ids: list[str]) -> list[dict[str, Any]]:
        if not item_ids:
            return []

        query = """
            match
                $item isa portfolioItem, has id $item_id;
                $item_id like ~item_id_pattern;
                $review isa portfolioReview,
                    has id $id,
                    has reviewText $review_text,
                    has createdAt $created_at,
                    has updatedAt $updated_at,
                    has isWorldVisible $is_world_visible,
                    has publicNoticeAcceptedAt $public_notice_accepted_at;
                $review_link isa hasPortfolioReview(item: $item, review: $review);
                $author isa user, has id $author_id, has fullName $author_full_name;
                $author_link isa portfolioReviewAuthor(review: $review, author: $author);
            fetch {
                'id': $id,
                'item_id': $item_id,
                'review_text': $review_text,
                'rating': [ $review.rating ],
                'created_at': $created_at,
                'updated_at': $updated_at,
                'is_world_visible': $is_world_visible,
                'public_notice_accepted_at': $public_notice_accepted_at,
                'author_id': $author_id,
                'author_full_name': $author_full_name
            };
        """
        item_id_pattern = self._id_pattern(item_ids)
        rows = Db.read_transact(query, {"item_id_pattern": item_id_pattern})
        author_roles = self._get_author_roles([self._one(row.get("author_id")) for row in rows])
        return sorted(
            [self._map_review(row, author_roles) for row in rows], key=lambda review: (review["item_id"], review["id"])
        )

    def filter_items_for_viewer(
        self,
        items: list[dict[str, Any]],
        reviews: list[dict[str, Any]],
        viewer_role: str,
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        if viewer_role != "supervisor":
            return items, reviews

        ratings_by_item: dict[str, list[int]] = {}
        for review in reviews:
            if review["rating"] is not None:
                ratings_by_item.setdefault(review["item_id"], []).append(review["rating"])

        visible_items = []
        for item in items:
            ratings = ratings_by_item.get(item["id"], [])
            if item["curation"]["is_authenticated_public_retraction"]:
                continue
            if ratings and not all(rating >= 3 for rating in ratings):
                continue
            visible_items.append(item)

        visible_item_ids = {item["id"] for item in visible_items}
        visible_reviews = [review for review in reviews if review["item_id"] in visible_item_ids]
        return visible_items, visible_reviews

    def attach_reviews(self, items: list[dict[str, Any]], reviews: list[dict[str, Any]]) -> list[dict[str, Any]]:
        reviews_by_item: dict[str, list[dict[str, Any]]] = {}
        for review in reviews:
            reviews_by_item.setdefault(review["item_id"], []).append(review)
        return [{**item, "reviews": reviews_by_item.get(item["id"], [])} for item in items]

    def _map_item(
        self,
        row: dict[str, Any],
        viewer_role: str,
        archived_projects: frozenset[str],
        archived_businesses: frozenset[str],
    ) -> dict[str, Any]:
        retracted = bool(self._one(row.get("is_authenticated_public_retraction"), False))
        visibility_reason = "visible_to_authenticated_viewer"
        if viewer_role == "public":
            visibility_reason = "visible_to_world_public"
        if viewer_role == "supervisor" and retracted:
            visibility_reason = "hidden_by_authenticated_public_retraction"

        source_project_id = self._one(row.get("source_project_id"))
        source_business_id = self._one(row.get("source_business_id"))
        # Archived-source state is derived live from the current archive state of the source
        # records, not from a stored snapshot, so it stays correct after archive and restore.
        # Tasks have no archive state in the schema, so task is always False.
        project_archived = source_project_id in archived_projects
        business_archived = source_business_id in archived_businesses

        # Source navigation targets the source project. An archived source project is not
        # navigable for normal portfolio viewers; the reason is user-facing Dutch copy that
        # states the source is archived while the completed work stays visible.
        if project_archived:
            navigation_state = "disabled"
            navigation_reason = "Het bronproject is gearchiveerd. Je voltooide werk blijft zichtbaar."
        else:
            navigation_state = "enabled"
            navigation_reason = "De bron is beschikbaar."

        return {
            "id": self._one(row.get("id")),
            "created_at": self._date(row.get("created_at")),
            "completed_at": self._date(row.get("completed_at")),
            "source_student_id": self._one(row.get("source_student_id"), self._one(row.get("owner_student_id"))),
            "source_registration_id": self._one(row.get("source_registration_id")),
            "source_task_id": self._one(row.get("source_task_id")),
            "source_project_id": source_project_id,
            "source_business_id": source_business_id,
            "student": {
                "full_name": self._one(row.get("student_name"), self._one(row.get("owner_student_name"))),
                "image_path": self._one(row.get("student_image_path"), self._one(row.get("owner_student_image_path"))),
            },
            "task": {
                "name": self._one(row.get("task_name")),
                "description": self._one(row.get("task_description")),
            },
            "project": {
                "name": self._one(row.get("project_name")),
                "description": self._one(row.get("project_description")),
            },
            "business": {
                "name": self._one(row.get("business_name")),
                "location": self._one(row.get("business_location")),
            },
            "skills": [self._one(skill.get("name")) for skill in row.get("skills", [])],
            "timeline_start_date": self._date(row.get("timeline_start_date")),
            "timeline_end_date": self._date(row.get("timeline_end_date")),
            "curation": {
                "is_retired": bool(self._one(row.get("is_retired"), False)),
                "retired_at": self._date(row.get("retired_at")),
                "is_hidden": bool(self._one(row.get("is_hidden"), False)),
                "hidden_at": self._date(row.get("hidden_at")),
                "hidden_by_role": self._one(row.get("hidden_by_role")),
                "hidden_by_user_id": self._one(row.get("hidden_by_user_id")),
                "display_order": self._one(row.get("display_order")),
                "is_authenticated_public_retraction": retracted,
                "is_world_visible": bool(self._one(row.get("is_world_visible"), False)),
            },
            "archived_source": {
                "task": False,
                "project": project_archived,
                "business": business_archived,
            },
            "source_navigation": {
                "state": navigation_state,
                "reason": navigation_reason,
            },
            "visibility": {
                "viewer_can_see": visibility_reason in {"visible_to_authenticated_viewer", "visible_to_world_public"},
                "reason": visibility_reason,
            },
            "reviews": [],
        }

    def _map_review(self, row: dict[str, Any], author_roles: dict[str, str]) -> dict[str, Any]:
        author_id = self._one(row.get("author_id"))
        return {
            "id": self._one(row.get("id")),
            "item_id": self._one(row.get("item_id")),
            "review_text": self._one(row.get("review_text")),
            "rating": self._one(row.get("rating")),
            "created_at": self._date(row.get("created_at")),
            "updated_at": self._date(row.get("updated_at")),
            "is_world_visible": bool(self._one(row.get("is_world_visible"), False)),
            "public_notice_accepted_at": self._date(row.get("public_notice_accepted_at")),
            "author": {
                "id": author_id,
                "role": author_roles.get(author_id, "unknown"),
                "full_name": self._one(row.get("author_full_name")),
            },
        }

    def _get_author_roles(self, user_ids: list[str]) -> dict[str, str]:
        roles: dict[str, str] = {}
        user_ids = [user_id for user_id in dict.fromkeys(user_ids) if user_id]
        if not user_ids:
            return roles

        user_id_pattern = self._id_pattern(user_ids)
        for role, role_type_token in self._ROLE_TYPE_TOKENS.items():
            query = f"""
                match
                    $user isa {role_type_token}, has id $user_id;
                    $user_id like ~user_id_pattern;
                fetch {{ 'id': $user_id }};
            """
            for row in Db.read_transact(query, {"user_id_pattern": user_id_pattern}):
                roles[self._one(row.get("id"))] = role
        return roles

    def _archived_source_sets(self, rows: list[dict[str, Any]]) -> tuple[frozenset[str], frozenset[str]]:
        # Resolve, in one query per entity type, which source projects and businesses referenced by
        # these portfolio items are currently archived. Returned as sets so _map_item can flag each
        # item's archived-source state without re-querying per row.
        project_ids = {self._one(row.get("source_project_id")) for row in rows}
        business_ids = {self._one(row.get("source_business_id")) for row in rows}
        return self._archived_ids("project", project_ids), self._archived_ids("business", business_ids)

    def _archived_ids(self, entity_type: str, ids: set[str]) -> frozenset[str]:
        # entity_type is a fixed internal literal ("project"/"business"), never user input. The
        # literal `has isArchived true` keeps this a valid READ query (no None params).
        filtered = [id_value for id_value in ids if id_value]
        if not filtered:
            return frozenset()
        query = f"""
            match
                $entity isa {entity_type}, has id $id, has isArchived true;
                $id like ~id_pattern;
            fetch {{ 'id': $id }};
        """
        rows = Db.read_transact(query, {"id_pattern": self._id_pattern(filtered)}, sort_fields=False)
        return frozenset(self._one(row.get("id")) for row in rows)

    def _id_pattern(self, ids: list[str]) -> str:
        for id_value in ids:
            if not re.fullmatch(r"[A-Za-z0-9_-]+", id_value):
                raise ValueError(f"Unsupported id value for TypeDB regex filter: {id_value}")
        return "^(" + "|".join(ids) + ")$"

    def _date(self, value: Any) -> str | None:
        value = self._one(value)
        if isinstance(value, datetime):
            return value.isoformat()
        if isinstance(value, date):
            return value.isoformat()
        return str(value) if value is not None else None

    def _one(self, value: Any, default: Any = None) -> Any:
        if isinstance(value, list):
            return value[0] if value else default
        return default if value is None else value

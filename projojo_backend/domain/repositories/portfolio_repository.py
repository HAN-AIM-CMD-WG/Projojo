from datetime import date, datetime
import re
from typing import Any

from db.initDatabase import Db
from service.uuid_service import generate_uuid


class PortfolioRepository:
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
        if author_role not in {"teacher", "supervisor"}:
            raise PermissionError("Alleen docenten en begeleiders kunnen portfolio-reviews schrijven.")
        if public_review_notice_accepted is not True:
            raise ValueError("Je moet de publieke reviewmelding accepteren voordat je reviewtekst indient.")

        item_business_id = self._get_item_business_id(item_id)
        if item_business_id is None:
            raise ValueError("Portfolio-item niet gevonden.")
        if author_role == "supervisor" and item_business_id != business_id:
            raise PermissionError("Je hebt hier geen rechten voor.")

        review_id = generate_uuid()
        now = datetime.now()
        query = f"""
            match
                $item isa portfolioItem, has id ~item_id;
                $author isa {author_role}, has id ~author_id;
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
        Db.write_transact(query, {
            "item_id": item_id,
            "author_id": author_id,
            "review_id": review_id,
            "review_text": review_text,
            "rating": rating,
            "created_at": now,
            "updated_at": now,
            "public_notice_accepted_at": now,
        })
        return review_id

    def _get_item_business_id(self, item_id: str) -> str | None:
        rows = Db.read_transact("""
            match
                $item isa portfolioItem, has id ~item_id, has sourceBusinessId $business_id;
            fetch { 'business_id': $business_id };
        """, {"item_id": item_id}, sort_fields=False)
        return self._one(rows[0].get("business_id")) if rows else None

    def get_student_identity(self, student_id: str) -> dict[str, Any] | None:
        query = """
            match
                $student isa student, has id ~student_id;
            fetch {
                'id': $student.id,
                'full_name': $student.fullName,
                'image_path': $student.imagePath,
                'portfolio_summary': $student.portfolioSummary,
                'portfolio_slug': $student.portfolioSlug,
                'is_portfolio_world_public': $student.isPortfolioWorldPublic
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
                'portfolio_summary': $student.portfolioSummary,
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
        query = """
            match
                $student isa student, has id ~student_id;
                $business isa business, has id ~business_id;
                $project isa project;
                $task isa task;
                $hasProjects isa hasProjects(business: $business, project: $project);
                $containsTask isa containsTask(project: $project, task: $task);
                $registration isa registersForTask(student: $student, task: $task), has isAccepted true;
            fetch { 'student_id': $student.id };
        """
        return bool(Db.read_transact(query, {"student_id": student_id, "business_id": business_id}))

    def get_visible_items(self, student_id: str, viewer_role: str) -> list[dict[str, Any]]:
        query = """
            match
                $student isa student, has id ~student_id;
                $item isa portfolioItem,
                    has id $id,
                    has createdAt $created_at,
                    has completedAt $completed_at,
                    has sourceRegistrationId $source_registration_id,
                    has sourceTaskId $source_task_id,
                    has sourceProjectId $source_project_id,
                    has sourceBusinessId $source_business_id,
                    has taskName $task_name,
                    has projectName $project_name,
                    has businessName $business_name,
                    has isRetired false,
                    has isHidden false,
                    has isAuthenticatedPublicRetraction $is_authenticated_public_retraction,
                    has isWorldVisible $is_world_visible;
                $ownership isa hasPortfolio(student: $student, item: $item);
            fetch {
                'id': $id,
                'created_at': $created_at,
                'completed_at': $completed_at,
                'source_registration_id': $source_registration_id,
                'source_task_id': $source_task_id,
                'source_project_id': $source_project_id,
                'source_business_id': $source_business_id,
                'task_name': $task_name,
                'task_description': $item.taskDescription,
                'project_name': $project_name,
                'project_description': $item.projectDescription,
                'business_name': $business_name,
                'business_location': $item.businessLocation,
                'skills': [
                    match
                        $item has skillName $skill_name;
                    fetch { 'name': $skill_name };
                ],
                'timeline_start_date': $item.timelineStartDate,
                'timeline_end_date': $item.timelineEndDate,
                'retired_at': $item.retiredAt,
                'hidden_at': $item.hiddenAt,
                'hidden_by_role': $item.hiddenByRole,
                'hidden_by_user_id': $item.hiddenByUserId,
                'display_order': $item.displayOrder,
                'is_authenticated_public_retraction': $is_authenticated_public_retraction,
                'is_world_visible': $is_world_visible,
                'source_task_archived': [$item.sourceTaskArchived],
                'source_project_archived': [$item.sourceProjectArchived],
                'source_business_archived': [$item.sourceBusinessArchived]
            };
        """
        rows = Db.read_transact(query, {"student_id": student_id})
        items = [self._map_item(row, viewer_role) for row in rows]
        return sorted(items, key=lambda item: (item["curation"]["display_order"] is None, item["curation"]["display_order"] or 0, item["id"]))

    def get_world_public_items(self, student_id: str) -> list[dict[str, Any]]:
        return [item for item in self.get_visible_items(student_id, "public") if item["curation"]["is_world_visible"]]

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
                'rating': $review.rating,
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
        return sorted([self._map_review(row, author_roles) for row in rows], key=lambda review: (review["item_id"], review["id"]))

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

    def _map_item(self, row: dict[str, Any], viewer_role: str) -> dict[str, Any]:
        retracted = bool(self._one(row.get("is_authenticated_public_retraction"), False))
        visibility_reason = "visible_to_authenticated_viewer"
        if viewer_role == "public":
            visibility_reason = "visible_to_world_public"
        if viewer_role == "supervisor" and retracted:
            visibility_reason = "hidden_by_authenticated_public_retraction"

        return {
            "id": self._one(row.get("id")),
            "created_at": self._date(row.get("created_at")),
            "completed_at": self._date(row.get("completed_at")),
            "source_registration_id": self._one(row.get("source_registration_id")),
            "source_task_id": self._one(row.get("source_task_id")),
            "source_project_id": self._one(row.get("source_project_id")),
            "source_business_id": self._one(row.get("source_business_id")),
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
                "is_retired": False,
                "retired_at": self._date(row.get("retired_at")),
                "is_hidden": False,
                "hidden_at": self._date(row.get("hidden_at")),
                "hidden_by_role": self._one(row.get("hidden_by_role")),
                "hidden_by_user_id": self._one(row.get("hidden_by_user_id")),
                "display_order": self._one(row.get("display_order")),
                "is_authenticated_public_retraction": retracted,
                "is_world_visible": bool(self._one(row.get("is_world_visible"), False)),
            },
            "archived_source": {
                "task": bool(self._one(row.get("source_task_archived"), False)),
                "project": bool(self._one(row.get("source_project_archived"), False)),
                "business": bool(self._one(row.get("source_business_archived"), False)),
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
        for role in ("teacher", "supervisor"):
            query = f"""
                match
                    $user isa {role}, has id $user_id;
                    $user_id like ~user_id_pattern;
                fetch {{ 'id': $user_id }};
            """
            for row in Db.read_transact(query, {"user_id_pattern": user_id_pattern}):
                roles[self._one(row.get("id"))] = role
        return roles

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

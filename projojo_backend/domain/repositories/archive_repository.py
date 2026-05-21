from datetime import datetime

from db.initDatabase import Db


class ArchiveRepository:
    ARCHIVE_ATTRS = ("archivedAt", "archivedBy", "archivedReason")

    def _clear_entity_archive(self, entity_type: str, entity_id: str) -> None:
        for attr in self.ARCHIVE_ATTRS:
            try:
                Db.write_transact(
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
            except Exception:
                pass

    def _set_entity_archive(self, entity_type: str, entity_id: str, archived_by: str, archived_reason: str) -> None:
        self._clear_entity_archive(entity_type, entity_id)
        Db.write_transact(
            f"""
            match
                $entity isa {entity_type}, has id ~entity_id;
            insert
                $entity has archivedAt ~archived_at;
                $entity has archivedBy ~archived_by;
                $entity has archivedReason ~archived_reason;
            """,
            {
                "entity_id": entity_id,
                "archived_at": datetime.now(),
                "archived_by": archived_by,
                "archived_reason": archived_reason,
            },
        )

    def archive_business(self, business_id: str, archived_by: str, archived_reason: str) -> None:
        self._set_entity_archive("business", business_id, archived_by, archived_reason)

    def restore_business(self, business_id: str) -> None:
        self._clear_entity_archive("business", business_id)

    def archive_project(self, project_id: str, archived_by: str, archived_reason: str) -> None:
        self._set_entity_archive("project", project_id, archived_by, archived_reason)

    def restore_project(self, project_id: str) -> None:
        self._clear_entity_archive("project", project_id)

    def archive_task(self, task_id: str, archived_by: str, archived_reason: str) -> None:
        self._set_entity_archive("task", task_id, archived_by, archived_reason)

    def restore_task(self, task_id: str) -> None:
        self._clear_entity_archive("task", task_id)

    def is_business_archived(self, business_id: str) -> bool:
        results = Db.read_transact(
            """
            match
                $entity isa business, has id ~entity_id, has archivedAt $archived_at;
            fetch { 'archived_at': $archived_at };
            """,
            {"entity_id": business_id},
        )
        return len(results) > 0

    def is_project_archived(self, project_id: str) -> bool:
        results = Db.read_transact(
            """
            match
                $entity isa project, has id ~entity_id, has archivedAt $archived_at;
            fetch { 'archived_at': $archived_at };
            """,
            {"entity_id": project_id},
        )
        return len(results) > 0

    def is_task_archived(self, task_id: str) -> bool:
        results = Db.read_transact(
            """
            match
                $entity isa task, has id ~entity_id, has archivedAt $archived_at;
            fetch { 'archived_at': $archived_at };
            """,
            {"entity_id": task_id},
        )
        return len(results) > 0
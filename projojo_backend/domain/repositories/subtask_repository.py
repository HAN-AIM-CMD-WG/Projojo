"""
Repository voor deeltaken (subtasks) en templates.
UI toont dit als "Deeltaken" - toegankelijk voor alle disciplines.
"""
from db.initDatabase import Db
from exceptions import ItemRetrievalException
from domain.models import Subtask, SubtaskTemplate
from datetime import datetime
from service.uuid_service import generate_uuid


class SubtaskRepository:
    """Repository voor CRUD operaties op deeltaken en templates."""

    # ========================================
    # SUBTASK (Deeltaak) OPERATIONS
    # ========================================

    def get_subtasks_by_task(self, task_id: str) -> list[Subtask]:
        """Haal alle deeltaken op voor een taak."""
        query = """
            match
                $task isa task, has id ~task_id;
                $subtask isa subtask, has id $id, has title $title, has subtaskStatus $status, has createdAt $created_at;
                $belongsTo isa belongsToTask (task: $task, subtask: $subtask);
            fetch {
                'id': $id,
                'title': $title,
                'what': [$subtask.subtaskWhat],
                'why': [$subtask.subtaskWhy],
                'how': [$subtask.subtaskHow],
                'criteria': [$subtask.subtaskCriteria],
                'status': $status,
                'created_at': $created_at,
                'completed_at': [$subtask.completedAt],
                'task_id': ~task_id,
                'claimed_by': [
                    match
                        $claim isa claimedBy (subtask: $subtask, student: $student);
                    fetch {
                        'id': $student.id,
                        'name': $student.fullName
                    };
                ]
            };
        """
        results = Db.read_transact(query, {"task_id": task_id})
        
        # Process results to flatten claimed_by info
        subtasks = []
        for r in results:
            claimed_by = r.get('claimed_by', [])
            subtask_data = {
                'id': r['id'],
                'title': r['title'],
                'what': r.get('what'),
                'why': r.get('why'),
                'how': r.get('how'),
                'criteria': r.get('criteria'),
                'status': r['status'],
                'created_at': r['created_at'],
                'completed_at': r.get('completed_at'),
                'task_id': r['task_id'],
                'claimed_by_id': claimed_by[0]['id'] if claimed_by else None,
                'claimed_by_name': claimed_by[0]['name'] if claimed_by else None,
            }
            subtasks.append(Subtask.model_validate(subtask_data))
        
        return subtasks

    def get_subtask_by_id(self, subtask_id: str) -> Subtask | None:
        """Haal een specifieke deeltaak op."""
        query = """
            match
                $subtask isa subtask, has id ~subtask_id, has title $title, has subtaskStatus $status, has createdAt $created_at;
                $belongsTo isa belongsToTask (task: $task, subtask: $subtask);
                $task has id $task_id;
            fetch {
                'id': ~subtask_id,
                'title': $title,
                'what': [$subtask.subtaskWhat],
                'why': [$subtask.subtaskWhy],
                'how': [$subtask.subtaskHow],
                'criteria': [$subtask.subtaskCriteria],
                'status': $status,
                'created_at': $created_at,
                'completed_at': [$subtask.completedAt],
                'task_id': $task_id,
                'claimed_by': [
                    match
                        $claim isa claimedBy (subtask: $subtask, student: $student);
                    fetch {
                        'id': $student.id,
                        'name': $student.fullName
                    };
                ]
            };
        """
        results = Db.read_transact(query, {"subtask_id": subtask_id})
        
        if not results:
            return None
        
        r = results[0]
        claimed_by = r.get('claimed_by', [])
        subtask_data = {
            'id': r['id'],
            'title': r['title'],
            'what': r.get('what'),
            'why': r.get('why'),
            'how': r.get('how'),
            'criteria': r.get('criteria'),
            'status': r['status'],
            'created_at': r['created_at'],
            'completed_at': r.get('completed_at'),
            'task_id': r['task_id'],
            'claimed_by_id': claimed_by[0]['id'] if claimed_by else None,
            'claimed_by_name': claimed_by[0]['name'] if claimed_by else None,
        }
        return Subtask.model_validate(subtask_data)

    def create_subtask(self, task_id: str, title: str, what: str | None = None, 
                       why: str | None = None, how: str | None = None, 
                       criteria: str | None = None) -> Subtask:
        """Maak een nieuwe deeltaak aan (supervisor actie)."""
        subtask_id = generate_uuid()
        created_at = datetime.now()
        
        # Build optional field clauses
        optional_clauses = ""
        params = {
            "task_id": task_id,
            "subtask_id": subtask_id,
            "title": title,
            "status": "open",
            "created_at": created_at
        }
        
        if what:
            optional_clauses += ", has subtaskWhat ~what"
            params["what"] = what
        if why:
            optional_clauses += ", has subtaskWhy ~why"
            params["why"] = why
        if how:
            optional_clauses += ", has subtaskHow ~how"
            params["how"] = how
        if criteria:
            optional_clauses += ", has subtaskCriteria ~criteria"
            params["criteria"] = criteria
        
        query = f"""
            match
                $task isa task, has id ~task_id;
            insert
                $subtask isa subtask,
                    has id ~subtask_id,
                    has title ~title,
                    has subtaskStatus ~status,
                    has createdAt ~created_at{optional_clauses};
                $belongsTo isa belongsToTask (task: $task, subtask: $subtask);
        """
        
        Db.write_transact(query, params)
        
        return Subtask(
            id=subtask_id,
            title=title,
            what=what,
            why=why,
            how=how,
            criteria=criteria,
            status="open",
            created_at=created_at,
            task_id=task_id
        )

    def claim_subtask(self, subtask_id: str, student_id: str) -> bool:
        """
        Student claimt een deeltaak ("ik pak dit").
        Returnt True bij succes, False als al geclaimd of niet gevonden.
        """
        # Check if subtask exists and is not already claimed
        check_query = """
            match
                $subtask isa subtask, has id ~subtask_id, has subtaskStatus "open";
                not {
                    $existing isa claimedBy (subtask: $subtask, student: $any_student);
                };
            fetch {
                'id': $subtask.id
            };
        """
        check_results = Db.read_transact(check_query, {"subtask_id": subtask_id})
        
        if not check_results:
            return False  # Already claimed or doesn't exist
        
        # Create claim and update status
        claim_query = """
            match
                $subtask isa subtask, has id ~subtask_id;
                $student isa student, has id ~student_id;
            insert
                $claim isa claimedBy (subtask: $subtask, student: $student);
        """
        Db.write_transact(claim_query, {"subtask_id": subtask_id, "student_id": student_id})
        
        # Update status to in_progress
        status_query = """
            match
                $subtask isa subtask, has id ~subtask_id;
            update
                $subtask has subtaskStatus "in_progress";
        """
        Db.write_transact(status_query, {"subtask_id": subtask_id})
        
        return True

    def unclaim_subtask(self, subtask_id: str, student_id: str) -> bool:
        """
        Student geeft deeltaak vrij.
        Kan alleen door de student die het geclaimd heeft.
        """
        # Check if this student has claimed it
        check_query = """
            match
                $subtask isa subtask, has id ~subtask_id;
                $student isa student, has id ~student_id;
                $claim isa claimedBy (subtask: $subtask, student: $student);
            fetch {
                'id': $subtask.id
            };
        """
        check_results = Db.read_transact(check_query, {"subtask_id": subtask_id, "student_id": student_id})
        
        if not check_results:
            return False  # Not claimed by this student
        
        # Delete claim
        delete_query = """
            match
                $subtask isa subtask, has id ~subtask_id;
                $student isa student, has id ~student_id;
                $claim isa claimedBy (subtask: $subtask, student: $student);
            delete
                $claim;
        """
        Db.write_transact(delete_query, {"subtask_id": subtask_id, "student_id": student_id})
        
        # Update status back to open
        status_query = """
            match
                $subtask isa subtask, has id ~subtask_id;
            update
                $subtask has subtaskStatus "open";
        """
        Db.write_transact(status_query, {"subtask_id": subtask_id})
        
        return True

    def complete_subtask(self, subtask_id: str, student_id: str) -> bool:
        """
        Student voltooit een deeltaak.
        Kan alleen door de student die het geclaimd heeft.
        """
        # Check if this student has claimed it
        check_query = """
            match
                $subtask isa subtask, has id ~subtask_id, has subtaskStatus "in_progress";
                $student isa student, has id ~student_id;
                $claim isa claimedBy (subtask: $subtask, student: $student);
            fetch {
                'id': $subtask.id
            };
        """
        check_results = Db.read_transact(check_query, {"subtask_id": subtask_id, "student_id": student_id})
        
        if not check_results:
            return False  # Not claimed by this student or not in_progress
        
        # Update status to done and set completed_at
        completed_at = datetime.now()
        complete_query = """
            match
                $subtask isa subtask, has id ~subtask_id;
            update
                $subtask has subtaskStatus "done";
                $subtask has completedAt ~completed_at;
        """
        Db.write_transact(complete_query, {"subtask_id": subtask_id, "completed_at": completed_at})
        
        return True

    def delete_subtask(self, subtask_id: str) -> bool:
        """
        Verwijder een deeltaak (supervisor actie).
        Kan alleen als de deeltaak niet geclaimd is.
        """
        # Check if subtask exists and is not claimed
        check_query = """
            match
                $subtask isa subtask, has id ~subtask_id;
                not {
                    $claim isa claimedBy (subtask: $subtask, student: $any);
                };
            fetch {
                'id': $subtask.id
            };
        """
        check_results = Db.read_transact(check_query, {"subtask_id": subtask_id})
        
        if not check_results:
            return False  # Claimed or doesn't exist
        
        # Delete the belongsToTask relation first
        delete_relation_query = """
            match
                $subtask isa subtask, has id ~subtask_id;
                $belongsTo isa belongsToTask (subtask: $subtask);
            delete
                $belongsTo;
        """
        Db.write_transact(delete_relation_query, {"subtask_id": subtask_id})
        
        # Delete the subtask
        delete_query = """
            match
                $subtask isa subtask, has id ~subtask_id;
            delete
                $subtask;
        """
        Db.write_transact(delete_query, {"subtask_id": subtask_id})
        
        return True

    # ========================================
    # TEMPLATE OPERATIONS
    # ========================================

    def get_templates_by_business(self, business_id: str) -> list[SubtaskTemplate]:
        """Haal alle templates op voor een bedrijf."""
        query = """
            match
                $business isa business, has id ~business_id;
                $template isa subtaskTemplate, has id $id, has templateName $name, has createdAt $created_at;
                $belongsTo isa belongsToBusiness (business: $business, template: $template);
            fetch {
                'id': $id,
                'template_name': $name,
                'title': [$template.title],
                'what': [$template.subtaskWhat],
                'why': [$template.subtaskWhy],
                'how': [$template.subtaskHow],
                'criteria': [$template.subtaskCriteria],
                'created_at': $created_at,
                'business_id': ~business_id
            };
        """
        results = Db.read_transact(query, {"business_id": business_id})
        return [SubtaskTemplate.model_validate(r) for r in results]

    def create_template(self, business_id: str, template_name: str, 
                        title: str | None = None, what: str | None = None,
                        why: str | None = None, how: str | None = None,
                        criteria: str | None = None) -> SubtaskTemplate:
        """Maak een nieuwe template aan voor een bedrijf."""
        template_id = generate_uuid()
        created_at = datetime.now()
        
        # Build optional field clauses
        optional_clauses = ""
        params = {
            "business_id": business_id,
            "template_id": template_id,
            "template_name": template_name,
            "created_at": created_at
        }
        
        if title:
            optional_clauses += ", has title ~title"
            params["title"] = title
        if what:
            optional_clauses += ", has subtaskWhat ~what"
            params["what"] = what
        if why:
            optional_clauses += ", has subtaskWhy ~why"
            params["why"] = why
        if how:
            optional_clauses += ", has subtaskHow ~how"
            params["how"] = how
        if criteria:
            optional_clauses += ", has subtaskCriteria ~criteria"
            params["criteria"] = criteria
        
        query = f"""
            match
                $business isa business, has id ~business_id;
            insert
                $template isa subtaskTemplate,
                    has id ~template_id,
                    has templateName ~template_name,
                    has createdAt ~created_at{optional_clauses};
                $belongsTo isa belongsToBusiness (business: $business, template: $template);
        """
        
        Db.write_transact(query, params)
        
        return SubtaskTemplate(
            id=template_id,
            template_name=template_name,
            title=title,
            what=what,
            why=why,
            how=how,
            criteria=criteria,
            created_at=created_at,
            business_id=business_id
        )

    def update_template(self, template_id: str, template_name: str,
                        title: str | None = None, what: str | None = None,
                        why: str | None = None, how: str | None = None,
                        criteria: str | None = None) -> bool:
        """Update een template."""
        # Build update clauses
        update_clauses = ["$template has templateName ~template_name;"]
        params = {"template_id": template_id, "template_name": template_name}
        
        if title is not None:
            update_clauses.append("$template has title ~title;")
            params["title"] = title
        if what is not None:
            update_clauses.append("$template has subtaskWhat ~what;")
            params["what"] = what
        if why is not None:
            update_clauses.append("$template has subtaskWhy ~why;")
            params["why"] = why
        if how is not None:
            update_clauses.append("$template has subtaskHow ~how;")
            params["how"] = how
        if criteria is not None:
            update_clauses.append("$template has subtaskCriteria ~criteria;")
            params["criteria"] = criteria
        
        query = f"""
            match
                $template isa subtaskTemplate, has id ~template_id;
            update
                {' '.join(update_clauses)}
        """
        
        try:
            Db.write_transact(query, params)
            return True
        except Exception:
            return False

    def delete_template(self, template_id: str) -> bool:
        """Verwijder een template."""
        # Delete the belongsToBusiness relation first
        delete_relation_query = """
            match
                $template isa subtaskTemplate, has id ~template_id;
                $belongsTo isa belongsToBusiness (template: $template);
            delete
                $belongsTo;
        """
        
        try:
            Db.write_transact(delete_relation_query, {"template_id": template_id})
        except Exception:
            pass  # Relation might not exist
        
        # Delete the template
        delete_query = """
            match
                $template isa subtaskTemplate, has id ~template_id;
            delete
                $template;
        """
        
        try:
            Db.write_transact(delete_query, {"template_id": template_id})
            return True
        except Exception:
            return False

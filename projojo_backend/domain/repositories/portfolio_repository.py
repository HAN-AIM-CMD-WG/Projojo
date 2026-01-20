import json
from datetime import datetime
from db.initDatabase import Db
from service.uuid_service import generate_uuid


class PortfolioRepository:
    """Repository for managing portfolio snapshots."""

    def create_snapshot(
        self,
        student_id: str,
        project_data: dict,
        task_data: dict,
        skills: list[str],
        timeline: dict
    ) -> str:
        """
        Create a portfolio snapshot before project deletion.
        
        Args:
            student_id: The student's ID
            project_data: Dict with project_name, project_description, business_name, 
                         business_description, business_location
            task_data: Dict with task_name, task_description
            skills: List of skill names
            timeline: Dict with requested_at, accepted_at, started_at, completed_at
        
        Returns:
            The created portfolio item ID
        """
        portfolio_id = generate_uuid()
        
        # Create JSON snapshots
        project_snapshot = json.dumps({
            "project_name": project_data.get("project_name", ""),
            "project_description": project_data.get("project_description", ""),
            "business_name": project_data.get("business_name", ""),
            "business_description": project_data.get("business_description", ""),
            "business_location": project_data.get("business_location", ""),
            "business_id": project_data.get("business_id", ""),
            "project_id": project_data.get("project_id", ""),
        })
        
        task_snapshot = json.dumps({
            "task_name": task_data.get("task_name", ""),
            "task_description": task_data.get("task_description", ""),
            "task_id": task_data.get("task_id", ""),
        })
        
        skills_snapshot = json.dumps(skills)
        
        timeline_snapshot = json.dumps({
            "requested_at": timeline.get("requested_at"),
            "accepted_at": timeline.get("accepted_at"),
            "started_at": timeline.get("started_at"),
            "completed_at": timeline.get("completed_at"),
        })
        
        # Insert portfolio item and relation
        query = """
            match
                $student isa student, has id ~student_id;
            insert
                $item isa portfolioItem,
                    has id ~portfolio_id,
                    has projectSnapshot ~project_snapshot,
                    has taskSnapshot ~task_snapshot,
                    has skillsSnapshot ~skills_snapshot,
                    has timelineSnapshot ~timeline_snapshot;
                $hasPortfolio isa hasPortfolio(student: $student, item: $item);
        """
        Db.write_transact(query, {
            "student_id": student_id,
            "portfolio_id": portfolio_id,
            "project_snapshot": project_snapshot,
            "task_snapshot": task_snapshot,
            "skills_snapshot": skills_snapshot,
            "timeline_snapshot": timeline_snapshot,
        })
        
        return portfolio_id

    def get_snapshots_by_student(self, student_id: str) -> list[dict]:
        """Get all portfolio snapshots for a student."""
        query = """
            match
                $student isa student, has id ~student_id;
                $hasPortfolio isa hasPortfolio(student: $student, item: $item);
                $item has id $item_id,
                    has projectSnapshot $project_snapshot,
                    has taskSnapshot $task_snapshot,
                    has skillsSnapshot $skills_snapshot,
                    has timelineSnapshot $timeline_snapshot;
            fetch {
                'id': $item_id,
                'project_snapshot': $project_snapshot,
                'task_snapshot': $task_snapshot,
                'skills_snapshot': $skills_snapshot,
                'timeline_snapshot': $timeline_snapshot
            };
        """
        results = Db.read_transact(query, {"student_id": student_id})
        
        snapshots = []
        for r in results:
            try:
                project_data = json.loads(r.get("project_snapshot", "{}"))
                task_data = json.loads(r.get("task_snapshot", "{}"))
                skills = json.loads(r.get("skills_snapshot", "[]"))
                timeline = json.loads(r.get("timeline_snapshot", "{}"))
                
                snapshots.append({
                    "id": r.get("id", ""),
                    "source_type": "snapshot",
                    "is_archived": False,  # Snapshots don't have archived state
                    "project_name": project_data.get("project_name", ""),
                    "project_description": project_data.get("project_description", ""),
                    "business_name": project_data.get("business_name", ""),
                    "business_description": project_data.get("business_description", ""),
                    "business_location": project_data.get("business_location", ""),
                    "task_name": task_data.get("task_name", ""),
                    "task_description": task_data.get("task_description", ""),
                    "skills": skills,
                    "timeline": timeline,
                    "source_project_id": project_data.get("project_id"),
                })
            except json.JSONDecodeError:
                continue  # Skip malformed snapshots
        
        return snapshots

    def get_live_portfolio_items(self, student_id: str) -> list[dict]:
        """
        Get live portfolio items (completed tasks from existing projects).
        These come from registrations with completedAt set.
        """
        query = """
            match
                $student isa student, has id ~student_id;
                $registration isa registersForTask(student: $student, task: $task),
                    has completedAt $completed_at;
                $task has id $task_id,
                    has name $task_name,
                    has description $task_description;
                $containsTask isa containsTask(project: $project, task: $task);
                $project has id $project_id,
                    has name $project_name,
                    has description $project_description;
                $hasProjects isa hasProjects(business: $business, project: $project);
                $business has id $business_id,
                    has name $business_name,
                    has description $business_description,
                    has location $business_location;
            fetch {
                'task_id': $task_id,
                'task_name': $task_name,
                'task_description': $task_description,
                'project_id': $project_id,
                'project_name': $project_name,
                'project_description': $project_description,
                'project_archived': [$project.isArchived],
                'business_id': $business_id,
                'business_name': $business_name,
                'business_description': $business_description,
                'business_location': $business_location,
                'completed_at': $completed_at,
                'requested_at': [$registration.requestedAt],
                'accepted_at': [$registration.acceptedAt],
                'started_at': [$registration.startedAt],
                'skills': [
                    match
                        $requiresSkill isa requiresSkill(task: $task, skill: $skill);
                        $skill has name $skill_name;
                    fetch {
                        'name': $skill_name
                    };
                ]
            };
        """
        results = Db.read_transact(query, {"student_id": student_id})
        
        items = []
        for r in results:
            skills = [s.get("name", "") for s in r.get("skills", [])]
            project_archived = r.get("project_archived", [])
            requested_at = r.get("requested_at", [])
            accepted_at = r.get("accepted_at", [])
            started_at = r.get("started_at", [])
            
            items.append({
                "id": f"live-{r.get('task_id', '')}",
                "source_type": "live",
                "is_archived": project_archived[0] if project_archived else False,
                "project_name": r.get("project_name", ""),
                "project_description": r.get("project_description", ""),
                "business_name": r.get("business_name", ""),
                "business_description": r.get("business_description", ""),
                "business_location": r.get("business_location", ""),
                "task_name": r.get("task_name", ""),
                "task_description": r.get("task_description", ""),
                "skills": skills,
                "timeline": {
                    "requested_at": requested_at[0] if requested_at else None,
                    "accepted_at": accepted_at[0] if accepted_at else None,
                    "started_at": started_at[0] if started_at else None,
                    "completed_at": r.get("completed_at", ""),
                },
                "source_project_id": r.get("project_id", ""),
            })
        
        return items

    def get_student_portfolio(self, student_id: str) -> list[dict]:
        """
        Get unified portfolio combining live items and snapshots.
        
        Returns a list of portfolio items with:
        - source_type: "live" | "snapshot"
        - is_archived: bool (for live items)
        - All project, task, business, and skills data
        """
        # Get both live and snapshot items
        live_items = self.get_live_portfolio_items(student_id)
        snapshot_items = self.get_snapshots_by_student(student_id)
        
        # Combine and sort by completion date (most recent first)
        all_items = live_items + snapshot_items
        
        # Sort by completed_at (handle different formats)
        def get_completion_date(item):
            timeline = item.get("timeline", {})
            completed_at = timeline.get("completed_at", "")
            if isinstance(completed_at, str) and completed_at:
                try:
                    return datetime.fromisoformat(completed_at.replace("Z", "+00:00"))
                except ValueError:
                    return datetime.min
            return datetime.min
        
        all_items.sort(key=get_completion_date, reverse=True)
        
        return all_items

    def delete_snapshot(self, portfolio_id: str) -> bool:
        """Delete a single portfolio snapshot (for GDPR requests)."""
        # First delete the relation
        delete_relation = """
            match
                $item isa portfolioItem, has id ~portfolio_id;
                $hasPortfolio isa hasPortfolio(item: $item);
            delete
                $hasPortfolio isa hasPortfolio;
        """
        try:
            Db.write_transact(delete_relation, {"portfolio_id": portfolio_id})
        except Exception:
            pass

        # Then delete the item
        delete_item = """
            match
                $item isa portfolioItem, has id ~portfolio_id;
            delete
                $item isa portfolioItem;
        """
        try:
            Db.write_transact(delete_item, {"portfolio_id": portfolio_id})
            return True
        except Exception:
            return False

    def delete_snapshots_by_student(self, student_id: str) -> int:
        """Delete all portfolio snapshots for a student (for GDPR requests)."""
        # First get all snapshot IDs
        query = """
            match
                $student isa student, has id ~student_id;
                $hasPortfolio isa hasPortfolio(student: $student, item: $item);
                $item has id $item_id;
            fetch {
                'id': $item_id
            };
        """
        results = Db.read_transact(query, {"student_id": student_id})
        
        deleted_count = 0
        for r in results:
            portfolio_id = r.get("id", "")
            if portfolio_id and self.delete_snapshot(portfolio_id):
                deleted_count += 1
        
        return deleted_count

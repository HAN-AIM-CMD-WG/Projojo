"""
Repository for managing status change requests (consensus mechanism).

Each registersForTask (student-task pair) can have a statusChangeRequest
for completion, cancellation, or end-of-term review.
"""
from datetime import datetime, timedelta
from db.initDatabase import Db
from service.uuid_service import generate_uuid


class StatusChangeRepository:
    """Repository for status change request CRUD operations."""

    # Auto-approve after 14 days
    AUTO_APPROVE_DAYS = 14

    def create_request(
        self,
        task_id: str,
        student_id: str,
        requester_id: str,
        request_type: str,  # "completion" | "cancellation"
        reason: str,
    ) -> dict:
        """
        Create a manual status change request (student or supervisor initiates).
        Returns the created request data.
        """
        request_id = generate_uuid()
        now = datetime.now()

        query = """
            match
                $task isa task, has id ~task_id;
                $student isa student, has id ~student_id;
                $registration isa registersForTask (student: $student, task: $task);
                $requester isa user, has id ~requester_id;
            insert
                $scr isa statusChangeRequest (
                    registration: $registration,
                    requester: $requester
                ),
                has id ~request_id,
                has requestType ~request_type,
                has reason ~reason,
                has requestStatus "pending",
                has createdAt ~created_at;
        """
        Db.write_transact(query, {
            "task_id": task_id,
            "student_id": student_id,
            "requester_id": requester_id,
            "request_id": request_id,
            "request_type": request_type,
            "reason": reason,
            "created_at": now,
        })

        return {
            "id": request_id,
            "request_type": request_type,
            "reason": reason,
            "request_status": "pending",
            "created_at": now.isoformat(),
        }

    def create_end_review(self, task_id: str, student_id: str) -> dict:
        """
        Create an automatic end_review request when a task's endDate passes.
        No requester (system-triggered). Sets autoApproveAt = now + 14 days.
        """
        request_id = generate_uuid()
        now = datetime.now()
        auto_approve_at = now + timedelta(days=self.AUTO_APPROVE_DAYS)

        query = """
            match
                $task isa task, has id ~task_id;
                $student isa student, has id ~student_id;
                $registration isa registersForTask (student: $student, task: $task);
            insert
                $scr isa statusChangeRequest (
                    registration: $registration
                ),
                has id ~request_id,
                has requestType "end_review",
                has reason "Taakperiode is verstreken. Beoordeel of de taak is afgerond of afgebroken.",
                has requestStatus "pending",
                has createdAt ~created_at,
                has autoApproveAt ~auto_approve_at;
        """
        Db.write_transact(query, {
            "task_id": task_id,
            "student_id": student_id,
            "request_id": request_id,
            "created_at": now,
            "auto_approve_at": auto_approve_at,
        })

        return {
            "id": request_id,
            "request_type": "end_review",
            "request_status": "pending",
            "auto_approve_at": auto_approve_at.isoformat(),
        }

    def get_pending_request(self, task_id: str, student_id: str) -> dict | None:
        """
        Get the current pending status change request for a registration.
        Returns None if no pending request exists.
        """
        query = """
            match
                $task isa task, has id ~task_id;
                $student isa student, has id ~student_id;
                $registration isa registersForTask (student: $student, task: $task);
                $scr isa statusChangeRequest (registration: $registration),
                    has id $scr_id,
                    has requestType $req_type,
                    has reason $reason,
                    has requestStatus "pending",
                    has createdAt $created_at;
            fetch {
                'id': $scr_id,
                'request_type': $req_type,
                'reason': $reason,
                'created_at': $created_at,
                'auto_approve_at': [$scr.autoApproveAt],
                'requester': [
                    match
                        $scr_inner isa statusChangeRequest (
                            registration: $registration,
                            requester: $req_user
                        ), has id $scr_id;
                        $req_user has id $req_user_id,
                            has fullName $req_user_name;
                    fetch {
                        'id': $req_user_id,
                        'full_name': $req_user_name
                    };
                ]
            };
        """
        results = Db.read_transact(query, {
            "task_id": task_id,
            "student_id": student_id,
        })

        if not results:
            return None

        r = results[0]
        auto_approve = r.get("auto_approve_at", [])
        requester_list = r.get("requester", [])
        requester = requester_list[0] if requester_list else None

        return {
            "id": r.get("id"),
            "request_type": r.get("request_type"),
            "reason": r.get("reason"),
            "request_status": "pending",
            "created_at": r.get("created_at"),
            "auto_approve_at": auto_approve[0] if auto_approve else None,
            "requester": requester,
        }

    def respond_to_request(
        self,
        request_id: str,
        responder_id: str,
        approved: bool,
        response_message: str = "",
    ) -> dict:
        """
        Respond to a pending status change request (approve or deny).
        If approved:
          - completion/end_review -> set registrationStatus = "afgerond"
          - cancellation -> set registrationStatus = "afgebroken"
        If denied: request is closed, no status change.
        """
        now = datetime.now()
        new_status = "approved" if approved else "denied"

        # First update the request status and add responder
        update_query = """
            match
                $scr isa statusChangeRequest, has id ~request_id, has requestStatus "pending";
                $responder isa user, has id ~responder_id;
            update
                $scr has requestStatus ~new_status;
                $scr has respondedAt ~responded_at;
                $scr has responseMessage ~response_message;
        """
        Db.write_transact(update_query, {
            "request_id": request_id,
            "responder_id": responder_id,
            "new_status": new_status,
            "responded_at": now,
            "response_message": response_message,
        })

        # Add responder role to the relation
        try:
            responder_query = """
                match
                    $scr isa statusChangeRequest, has id ~request_id;
                    $responder isa user, has id ~responder_id;
                insert
                    $scr (responder: $responder);
            """
            Db.write_transact(responder_query, {
                "request_id": request_id,
                "responder_id": responder_id,
            })
        except Exception:
            pass  # Non-critical if adding responder role fails

        # If approved, update the registration status
        if approved:
            # Determine the new registration status based on request type
            type_query = """
                match
                    $scr isa statusChangeRequest, has id ~request_id,
                        has requestType $req_type;
                fetch {
                    'request_type': $req_type
                };
            """
            type_results = Db.read_transact(type_query, {"request_id": request_id})
            if type_results:
                request_type = type_results[0].get("request_type")
                if request_type == "cancellation":
                    reg_status = "afgebroken"
                else:
                    reg_status = "afgerond"

                # Update the registration status
                status_query = """
                    match
                        $scr isa statusChangeRequest (registration: $registration),
                            has id ~request_id;
                    update
                        $registration has registrationStatus ~reg_status;
                """
                Db.write_transact(status_query, {
                    "request_id": request_id,
                    "reg_status": reg_status,
                })

        return {
            "id": request_id,
            "request_status": new_status,
            "responded_at": now.isoformat(),
        }

    def get_pending_requests_for_user(self, user_id: str) -> list[dict]:
        """
        Get all pending status change requests where this user needs to respond.
        
        Logic:
        - If requester is a student -> the supervisor of the project's business must respond
        - If requester is a supervisor -> the student must respond
        - For end_review (no requester) -> both student and supervisor can respond
        
        This returns ALL pending requests related to this user's registrations or tasks.
        """
        # Pending requests for a student (requests where they are the registration student)
        student_query = """
            match
                $user isa student, has id ~user_id;
                $registration isa registersForTask (student: $user, task: $task);
                $scr isa statusChangeRequest (registration: $registration),
                    has id $scr_id,
                    has requestType $req_type,
                    has reason $reason,
                    has requestStatus "pending",
                    has createdAt $created_at;
                $task has id $task_id, has name $task_name;
                $ct isa containsTask (project: $project, task: $task);
                $project has id $project_id, has name $project_name;
            fetch {
                'id': $scr_id,
                'request_type': $req_type,
                'reason': $reason,
                'created_at': $created_at,
                'auto_approve_at': [$scr.autoApproveAt],
                'task_id': $task_id,
                'task_name': $task_name,
                'project_id': $project_id,
                'project_name': $project_name,
                'requester': [
                    match
                        $scr_inner isa statusChangeRequest (
                            registration: $registration,
                            requester: $req_user
                        ), has id $scr_id;
                        $req_user has id $req_uid, has fullName $req_uname;
                    fetch {
                        'id': $req_uid,
                        'full_name': $req_uname
                    };
                ]
            };
        """

        # Pending requests for a supervisor (requests on tasks in their business projects)
        supervisor_query = """
            match
                $user isa supervisor, has id ~user_id;
                $manages isa manages (supervisor: $user, business: $business);
                $hasProjects isa hasProjects (business: $business, project: $project);
                $project has id $project_id, has name $project_name;
                $ct isa containsTask (project: $project, task: $task);
                $task has id $task_id, has name $task_name;
                $student isa student, has id $student_id, has fullName $student_name;
                $registration isa registersForTask (student: $student, task: $task);
                $scr isa statusChangeRequest (registration: $registration),
                    has id $scr_id,
                    has requestType $req_type,
                    has reason $reason,
                    has requestStatus "pending",
                    has createdAt $created_at;
            fetch {
                'id': $scr_id,
                'request_type': $req_type,
                'reason': $reason,
                'created_at': $created_at,
                'auto_approve_at': [$scr.autoApproveAt],
                'task_id': $task_id,
                'task_name': $task_name,
                'project_id': $project_id,
                'project_name': $project_name,
                'student_id': $student_id,
                'student_name': $student_name,
                'requester': [
                    match
                        $scr_inner isa statusChangeRequest (
                            registration: $registration,
                            requester: $req_user
                        ), has id $scr_id;
                        $req_user has id $req_uid, has fullName $req_uname;
                    fetch {
                        'id': $req_uid,
                        'full_name': $req_uname
                    };
                ]
            };
        """

        # Try student query first, then supervisor query
        results = []
        try:
            student_results = Db.read_transact(student_query, {"user_id": user_id})
            if student_results:
                for r in student_results:
                    requester_list = r.get("requester", [])
                    requester = requester_list[0] if requester_list else None
                    # Only show requests that the student didn't initiate themselves
                    if requester and requester.get("id") == user_id:
                        continue
                    auto_approve = r.get("auto_approve_at", [])
                    results.append({
                        "id": r.get("id"),
                        "request_type": r.get("request_type"),
                        "reason": r.get("reason"),
                        "created_at": r.get("created_at"),
                        "auto_approve_at": auto_approve[0] if auto_approve else None,
                        "task_id": r.get("task_id"),
                        "task_name": r.get("task_name"),
                        "project_id": r.get("project_id"),
                        "project_name": r.get("project_name"),
                        "requester": requester,
                    })
        except Exception:
            pass

        try:
            supervisor_results = Db.read_transact(supervisor_query, {"user_id": user_id})
            if supervisor_results:
                for r in supervisor_results:
                    requester_list = r.get("requester", [])
                    requester = requester_list[0] if requester_list else None
                    # Only show requests that the supervisor didn't initiate themselves
                    if requester and requester.get("id") == user_id:
                        continue
                    auto_approve = r.get("auto_approve_at", [])
                    results.append({
                        "id": r.get("id"),
                        "request_type": r.get("request_type"),
                        "reason": r.get("reason"),
                        "created_at": r.get("created_at"),
                        "auto_approve_at": auto_approve[0] if auto_approve else None,
                        "task_id": r.get("task_id"),
                        "task_name": r.get("task_name"),
                        "project_id": r.get("project_id"),
                        "project_name": r.get("project_name"),
                        "student_id": r.get("student_id"),
                        "student_name": r.get("student_name"),
                        "requester": requester,
                    })
        except Exception:
            pass

        return results

    def check_and_create_end_reviews(self) -> int:
        """
        Lazy check: Find all accepted registrations where:
        - Task endDate has passed
        - registrationStatus is NOT set (still "lopend")
        - No pending statusChangeRequest exists
        
        Creates end_review requests for these.
        Returns count of created reviews.
        """
        now = datetime.now()

        query = """
            match
                $student isa student, has id $student_id;
                $task isa task, has id $task_id, has endDate $end_date;
                $registration isa registersForTask (student: $student, task: $task),
                    has isAccepted true;
                not { $registration has registrationStatus $any_status; };
                not { $registration has completedAt $any_completed; };
                not {
                    $existing_scr isa statusChangeRequest (registration: $registration),
                        has requestStatus "pending";
                };
            fetch {
                'student_id': $student_id,
                'task_id': $task_id,
                'end_date': $end_date
            };
        """
        results = Db.read_transact(query)
        
        created = 0
        for r in results:
            end_date = r.get("end_date")
            if not end_date:
                continue
            
            # Check if end_date is in the past
            try:
                if isinstance(end_date, str):
                    dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
                elif isinstance(end_date, datetime):
                    dt = end_date
                else:
                    continue
                
                # Remove timezone for comparison
                if hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
                    dt = dt.replace(tzinfo=None)
                
                if dt.date() < now.date():
                    self.create_end_review(
                        task_id=r.get("task_id"),
                        student_id=r.get("student_id"),
                    )
                    created += 1
            except (ValueError, TypeError):
                continue

        return created

    def auto_approve_expired(self) -> int:
        """
        Lazy check: Auto-approve end_review requests where autoApproveAt has passed.
        Sets registrationStatus to "afgerond" (default outcome).
        Returns count of auto-approved requests.
        """
        now = datetime.now()

        query = """
            match
                $scr isa statusChangeRequest,
                    has id $scr_id,
                    has requestType "end_review",
                    has requestStatus "pending",
                    has autoApproveAt $auto_date;
            fetch {
                'id': $scr_id,
                'auto_approve_at': $auto_date
            };
        """
        results = Db.read_transact(query)
        
        approved = 0
        for r in results:
            auto_date = r.get("auto_approve_at")
            if not auto_date:
                continue
            
            try:
                if isinstance(auto_date, str):
                    dt = datetime.fromisoformat(auto_date.replace("Z", "+00:00"))
                elif isinstance(auto_date, datetime):
                    dt = auto_date
                else:
                    continue
                
                if hasattr(dt, 'tzinfo') and dt.tzinfo is not None:
                    dt = dt.replace(tzinfo=None)
                
                if dt < now:
                    request_id = r.get("id")
                    # Update request status to auto_approved
                    update_query = """
                        match
                            $scr isa statusChangeRequest, has id ~request_id;
                        update
                            $scr has requestStatus "auto_approved";
                            $scr has respondedAt ~responded_at;
                            $scr has responseMessage "Automatisch goedgekeurd na 14 dagen zonder reactie.";
                    """
                    Db.write_transact(update_query, {
                        "request_id": request_id,
                        "responded_at": now,
                    })
                    
                    # Set registration status to afgerond (default)
                    status_query = """
                        match
                            $scr isa statusChangeRequest (registration: $registration),
                                has id ~request_id;
                        update
                            $registration has registrationStatus "afgerond";
                    """
                    Db.write_transact(status_query, {
                        "request_id": request_id,
                    })
                    
                    approved += 1
            except (ValueError, TypeError):
                continue

        return approved

    def get_registration_status(self, task_id: str, student_id: str) -> str:
        """
        Get the current registration status for a student-task pair.
        Returns "lopend", "afgerond", or "afgebroken".
        Defaults to "lopend" if no explicit status is set.
        """
        query = """
            match
                $task isa task, has id ~task_id;
                $student isa student, has id ~student_id;
                $registration isa registersForTask (student: $student, task: $task);
            fetch {
                'registration_status': [$registration.registrationStatus],
                'is_accepted': [$registration.isAccepted]
            };
        """
        results = Db.read_transact(query, {
            "task_id": task_id,
            "student_id": student_id,
        })
        
        if not results:
            return "lopend"
        
        r = results[0]
        status_list = r.get("registration_status", [])
        if status_list:
            return status_list[0]
        return "lopend"

"""
Notification service for sending emails to students and teachers.

This service provides email notifications for:
- Project archiving and deletion
- Task status change requests (consensus mechanism)
- Status change responses and auto-approvals
"""

from typing import Optional
from datetime import datetime
import asyncio
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for handling email notifications."""
    
    def __init__(self):
        # Email configuration would go here
        # e.g., SMTP settings, API keys, etc.
        self.email_enabled = True  # Enabled for status change notifications
    
    def notify_project_archived(
        self,
        project_name: str,
        affected_students: list[dict],
        supervisor_email: str,
        teacher_email: Optional[str] = None,
        reason: Optional[str] = None
    ) -> dict:
        """
        Send notifications when a project is archived.
        
        Args:
            project_name: Name of the archived project
            affected_students: List of dicts with student_name, student_email, task_name
            supervisor_email: Email of the supervisor who archived the project
            teacher_email: Optional email of the teacher to notify
            reason: Optional reason for archiving
        
        Returns:
            Dict with notification status and counts
        """
        notified = []
        failed = []
        
        # Notify each affected student
        for student in affected_students:
            success = self._send_student_archive_notification(
                student_email=student.get("student_email", ""),
                student_name=student.get("student_name", ""),
                project_name=project_name,
                task_name=student.get("task_name", ""),
                reason=reason
            )
            if success:
                notified.append(student.get("student_email"))
            else:
                failed.append(student.get("student_email"))
        
        # Notify teacher if provided
        if teacher_email:
            self._send_teacher_notification(
                teacher_email=teacher_email,
                project_name=project_name,
                action="archived",
                affected_count=len(affected_students),
                supervisor_email=supervisor_email
            )
        
        return {
            "notified_count": len(notified),
            "failed_count": len(failed),
            "notified_emails": notified,
            "failed_emails": failed
        }
    
    def notify_project_deleted(
        self,
        project_name: str,
        affected_students: list[dict],
        teacher_email: str,
        snapshots_created: int,
        reason: Optional[str] = None
    ) -> dict:
        """
        Send notifications when a project is permanently deleted.
        
        Args:
            project_name: Name of the deleted project
            affected_students: List of dicts with student_name, student_email, task_name
            teacher_email: Email of the teacher who deleted the project
            snapshots_created: Number of portfolio snapshots created
            reason: Optional reason for deletion
        
        Returns:
            Dict with notification status and counts
        """
        notified = []
        failed = []
        
        # Notify each affected student
        for student in affected_students:
            success = self._send_student_delete_notification(
                student_email=student.get("student_email", ""),
                student_name=student.get("student_name", ""),
                project_name=project_name,
                task_name=student.get("task_name", ""),
                has_portfolio_snapshot=student.get("is_completed", False),
                reason=reason
            )
            if success:
                notified.append(student.get("student_email"))
            else:
                failed.append(student.get("student_email"))
        
        return {
            "notified_count": len(notified),
            "failed_count": len(failed),
            "notified_emails": notified,
            "failed_emails": failed,
            "snapshots_created": snapshots_created
        }
    
    def _send_student_archive_notification(
        self,
        student_email: str,
        student_name: str,
        project_name: str,
        task_name: str,
        reason: Optional[str] = None
    ) -> bool:
        """Send archive notification to a student."""
        if not self.email_enabled:
            # Log the notification for debugging
            print(f"[NOTIFICATION] Would send archive notification to {student_email}")
            print(f"  Student: {student_name}")
            print(f"  Project: {project_name}")
            print(f"  Task: {task_name}")
            if reason:
                print(f"  Reason: {reason}")
            return True
        
        # TODO: Implement actual email sending
        subject = f"Project '{project_name}' is gearchiveerd"
        body = f"""
Beste {student_name},

Het project '{project_name}' waar je aan werkte is gearchiveerd.

Taak: {task_name}
{f'Reden: {reason}' if reason else ''}

Je werk blijft zichtbaar in je portfolio, maar het project is niet meer actief.
Neem contact op met je docent als je vragen hebt.

Met vriendelijke groet,
Projojo
        """
        
        return self._send_email(student_email, subject, body)
    
    def _send_student_delete_notification(
        self,
        student_email: str,
        student_name: str,
        project_name: str,
        task_name: str,
        has_portfolio_snapshot: bool,
        reason: Optional[str] = None
    ) -> bool:
        """Send deletion notification to a student."""
        if not self.email_enabled:
            # Log the notification for debugging
            print(f"[NOTIFICATION] Would send delete notification to {student_email}")
            print(f"  Student: {student_name}")
            print(f"  Project: {project_name}")
            print(f"  Task: {task_name}")
            print(f"  Has portfolio snapshot: {has_portfolio_snapshot}")
            if reason:
                print(f"  Reason: {reason}")
            return True
        
        # TODO: Implement actual email sending
        portfolio_message = (
            "Je voltooide werk is opgeslagen in je portfolio."
            if has_portfolio_snapshot else
            "Dit project is verwijderd voordat je de taak had voltooid."
        )
        
        subject = f"Project '{project_name}' is verwijderd"
        body = f"""
Beste {student_name},

Het project '{project_name}' waar je aan werkte is permanent verwijderd.

Taak: {task_name}
{f'Reden: {reason}' if reason else ''}

{portfolio_message}

Neem contact op met je docent als je vragen hebt.

Met vriendelijke groet,
Projojo
        """
        
        return self._send_email(student_email, subject, body)
    
    def _send_teacher_notification(
        self,
        teacher_email: str,
        project_name: str,
        action: str,
        affected_count: int,
        supervisor_email: str
    ) -> bool:
        """Send notification to a teacher about project changes."""
        if not self.email_enabled:
            print(f"[NOTIFICATION] Would notify teacher at {teacher_email}")
            print(f"  Project: {project_name}")
            print(f"  Action: {action}")
            print(f"  Affected students: {affected_count}")
            print(f"  By supervisor: {supervisor_email}")
            return True
        
        subject = f"Project '{project_name}' is {action}"
        body = f"""
Beste docent,

Het project '{project_name}' is {action} door {supervisor_email}.

Aantal getroffen studenten: {affected_count}

Met vriendelijke groet,
Projojo
        """
        
        return self._send_email(teacher_email, subject, body)
    
    def _send_email(self, to: str, subject: str, body: str) -> bool:
        """
        Send an email. Override this method with actual email implementation.
        
        Currently returns True without sending (for development).
        """
        if not self.email_enabled:
            return True
        
        # TODO: Implement actual email sending using:
        # - SMTP (smtplib)
        # - SendGrid
        # - AWS SES
        # - Or another email provider
        
        try:
            # Example SMTP implementation:
            # import smtplib
            # from email.mime.text import MIMEText
            # 
            # msg = MIMEText(body)
            # msg['Subject'] = subject
            # msg['From'] = 'noreply@projojo.nl'
            # msg['To'] = to
            # 
            # with smtplib.SMTP('smtp.example.com', 587) as server:
            #     server.starttls()
            #     server.login('username', 'password')
            #     server.send_message(msg)
            
            return True
        except Exception as e:
            print(f"Failed to send email to {to}: {e}")
            return False


    # ================================================================
    # Status Change Consensus Notifications
    # ================================================================

    async def notify_status_request(
        self,
        recipient_email: str,
        recipient_name: str,
        requester_name: str,
        request_type: str,
        reason: str,
        task_name: str,
        project_name: str,
        student_name: str = "",
        auto_approve_date: str = "",
        action_url: str = "",
    ) -> bool:
        """Send notification about a new status change request."""
        try:
            from service.email_service import send_templated_email
            
            subject_map = {
                "completion": f"Afrondverzoek: {task_name}",
                "cancellation": f"Afbreekverzoek: {task_name}",
                "end_review": f"Taakperiode verstreken: {task_name}",
            }
            subject = subject_map.get(request_type, f"Statusverzoek: {task_name}")
            
            result = await send_templated_email(
                recipient=recipient_email,
                subject=subject,
                template_name="status_request.html",
                context={
                    "recipient_name": recipient_name,
                    "requester_name": requester_name,
                    "request_type": request_type,
                    "reason": reason,
                    "task_name": task_name,
                    "project_name": project_name,
                    "student_name": student_name,
                    "auto_approve_date": auto_approve_date,
                    "action_url": action_url,
                },
            )
            
            if not result.success:
                logger.warning(f"Failed to send status request email to {recipient_email}: {result.error}")
            return result.success
        except Exception as e:
            logger.warning(f"Error sending status request notification to {recipient_email}: {e}")
            return False

    async def notify_status_response(
        self,
        recipient_email: str,
        recipient_name: str,
        responder_name: str,
        approved: bool,
        task_name: str,
        project_name: str,
        new_status: str = "",
        response_message: str = "",
        auto_approved: bool = False,
        action_url: str = "",
    ) -> bool:
        """Send notification about a status change response."""
        try:
            from service.email_service import send_templated_email
            
            if auto_approved:
                subject = f"Automatisch goedgekeurd: {task_name}"
            elif approved:
                subject = f"Verzoek goedgekeurd: {task_name}"
            else:
                subject = f"Verzoek afgewezen: {task_name}"
            
            result = await send_templated_email(
                recipient=recipient_email,
                subject=subject,
                template_name="status_response.html",
                context={
                    "recipient_name": recipient_name,
                    "responder_name": responder_name,
                    "approved": approved,
                    "auto_approved": auto_approved,
                    "task_name": task_name,
                    "project_name": project_name,
                    "new_status": new_status,
                    "response_message": response_message,
                    "action_url": action_url,
                },
            )
            
            if not result.success:
                logger.warning(f"Failed to send status response email to {recipient_email}: {result.error}")
            return result.success
        except Exception as e:
            logger.warning(f"Error sending status response notification to {recipient_email}: {e}")
            return False

    def notify_status_request_sync(self, **kwargs) -> bool:
        """Synchronous wrapper for notify_status_request (for use in non-async contexts)."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # Schedule as a task if we're already in an event loop
                asyncio.ensure_future(self.notify_status_request(**kwargs))
                return True
            else:
                return loop.run_until_complete(self.notify_status_request(**kwargs))
        except RuntimeError:
            # No event loop, create one
            return asyncio.run(self.notify_status_request(**kwargs))

    def notify_status_response_sync(self, **kwargs) -> bool:
        """Synchronous wrapper for notify_status_response (for use in non-async contexts)."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(self.notify_status_response(**kwargs))
                return True
            else:
                return loop.run_until_complete(self.notify_status_response(**kwargs))
        except RuntimeError:
            return asyncio.run(self.notify_status_response(**kwargs))


# Singleton instance
notification_service = NotificationService()

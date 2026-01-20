"""
Notification service for sending emails to students and teachers.

This service provides a foundation for email notifications when projects
are archived or deleted. The actual email sending implementation can be
added later based on the chosen email provider (SMTP, SendGrid, etc.).
"""

from typing import Optional
from datetime import datetime


class NotificationService:
    """Service for handling email notifications."""
    
    def __init__(self):
        # Email configuration would go here
        # e.g., SMTP settings, API keys, etc.
        self.email_enabled = False  # Set to True when email is configured
    
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


# Singleton instance
notification_service = NotificationService()

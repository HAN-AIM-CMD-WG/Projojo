"""
Email service module for sending emails via SMTP.

This module provides two main async functions:
- send_email(): Send an email with plain text and/or HTML body
- send_templated_email(): Send an email using a Jinja2 template

The SMTP server is configured via environment variables, allowing easy switching
between MailHog (development) and SMTP2GO (production) without code changes.

Environment Variables:
    EMAIL_SMTP_HOST: SMTP server hostname (default: localhost)
    EMAIL_SMTP_PORT: SMTP server port (default: 1025)
    EMAIL_SMTP_USERNAME: SMTP username (empty = no auth)
    EMAIL_SMTP_PASSWORD: SMTP password (empty = no auth)
    EMAIL_DEFAULT_SENDER: Default sender email address

Note:
    TLS/STARTTLS is auto-negotiated by aiosmtplib - no manual configuration needed.

Example:
    >>> from service.email_service import send_email, send_templated_email
    >>>
    >>> # Simple email (must be awaited)
    >>> result = await send_email(
    ...     recipient="user@example.com",
    ...     subject="Hello!",
    ...     body_text="Welcome to Projojo!"
    ... )
    >>>
    >>> # Template-based email (must be awaited)
    >>> result = await send_templated_email(
    ...     recipient="user@example.com",
    ...     subject="Project Invitation",
    ...     template_name="invitation.html",
    ...     context={"user_name": "John", "project_name": "Smart Farm"}
    ... )
"""

import logging
import os
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any

import aiosmtplib
from jinja2 import Environment, FileSystemLoader, TemplateNotFound, select_autoescape
from pydantic import BaseModel, ConfigDict


logger = logging.getLogger(__name__)


# ============================================================================
# Pydantic Models
# ============================================================================


class EmailAttachment(BaseModel):
    """
    Represents an email attachment.
    
    Attributes:
        filename: Name of the file as it will appear in the email
        content: Raw bytes of the file content
        mime_type: MIME type of the file (e.g., "application/pdf")
    """
    model_config = ConfigDict(arbitrary_types_allowed=True)
    
    filename: str
    content: bytes
    mime_type: str = "application/octet-stream"


class EmailResult(BaseModel):
    """
    Result of an email send operation.
    
    Attributes:
        success: Whether the email was sent successfully
        error: Error message if sending failed
    """
    success: bool
    error: str | None = None


# ============================================================================
# Template Engine Setup
# ============================================================================

# Template directory path (relative to backend root)
_TEMPLATE_DIR = Path(__file__).parent.parent / "templates" / "email"

# Jinja2 environment (lazy-loaded)
_jinja_env: Environment | None = None


def _get_template_env() -> Environment:
    """
    Get or create the Jinja2 template environment.
    
    The environment is lazily loaded and cached for reuse.
    Templates are loaded from: projojo_backend/templates/email/
    
    Returns:
        Configured Jinja2 Environment instance
    """
    global _jinja_env
    if _jinja_env is None:
        _jinja_env = Environment(
            loader=FileSystemLoader(_TEMPLATE_DIR),
            autoescape=select_autoescape(["html", "xml"]),
            trim_blocks=True,
            lstrip_blocks=True,
        )
    return _jinja_env


def _render_template(template_name: str, context: dict[str, Any]) -> str:
    """
    Render a Jinja2 template with the given context.
    
    Args:
        template_name: Name of the template file (e.g., "invitation.html")
        context: Dictionary of variables to pass to the template
        
    Returns:
        Rendered template as a string
        
    Raises:
        TemplateNotFound: If the template file doesn't exist
    """
    env = _get_template_env()
    template = env.get_template(template_name)
    return template.render(**context)


# ============================================================================
# Configuration
# ============================================================================

def _get_smtp_config() -> dict:
    """
    Load SMTP configuration from environment variables.
    
    Returns:
        Dictionary with SMTP configuration:
        - host: SMTP server hostname
        - port: SMTP server port
        - username: SMTP authentication username (None if empty)
        - password: SMTP authentication password (None if empty)
        - default_sender: Default sender email address
        
    Note:
        - Port is safely parsed with a default of 1025 if invalid.
        - TLS is auto-negotiated by aiosmtplib (STARTTLS if server supports it).
        - Authentication is skipped if username/password are None.
    """
    port_str = os.getenv("EMAIL_SMTP_PORT", "1025")
    try:
        port = int(port_str.strip())
    except (ValueError, AttributeError):
        logger.warning(f"Invalid EMAIL_SMTP_PORT value '{port_str}', using default 1025")
        port = 1025
    
    # Convert empty strings to None so aiosmtplib skips authentication
    username = os.getenv("EMAIL_SMTP_USERNAME", "") or None
    password = os.getenv("EMAIL_SMTP_PASSWORD", "") or None
    
    return {
        "host": os.getenv("EMAIL_SMTP_HOST", "localhost"),
        "port": port,
        "username": username,
        "password": password,
        "default_sender": os.getenv("EMAIL_DEFAULT_SENDER", "noreply@projojo.nl"),
    }


# ============================================================================
# Email Sending Functions
# ============================================================================

async def send_email(
    recipient: str | list[str],
    subject: str,
    body_text: str | None = None,
    body_html: str | None = None,
    sender: str | None = None,
    cc: list[str] | None = None,
    bcc: list[str] | None = None,
    reply_to: str | None = None,
    attachments: list[EmailAttachment] | None = None,
) -> EmailResult:
    """
    Send an email via SMTP asynchronously.
    
    SMTP server is configured via environment variables:
    - EMAIL_SMTP_HOST: SMTP server hostname (default: localhost)
    - EMAIL_SMTP_PORT: SMTP server port (default: 1025)
    - EMAIL_SMTP_USERNAME: SMTP username (empty = no auth)
    - EMAIL_SMTP_PASSWORD: SMTP password (empty = no auth)
    - EMAIL_DEFAULT_SENDER: Default sender email address
    
    Note: TLS/STARTTLS is auto-negotiated by aiosmtplib.
    
    Args:
        recipient: Email address or list of addresses to send to
        subject: Email subject line
        body_text: Plain text body (optional if body_html provided)
        body_html: HTML body (optional if body_text provided)
        sender: Sender email address (uses default if not provided)
        cc: List of CC recipients
        bcc: List of BCC recipients
        reply_to: Reply-to email address
        attachments: List of EmailAttachment objects
        
    Returns:
        EmailResult with success status and optional error message
        
    Example:
        >>> result = await send_email(
        ...     recipient="user@example.com",
        ...     subject="Welcome to Projojo!",
        ...     body_text="Hello and welcome!",
        ...     body_html="<h1>Hello and welcome!</h1>"
        ... )
        >>> if result.success:
        ...     print("Email sent!")
    """
    config = _get_smtp_config()
    from_addr = sender or config["default_sender"]
    
    # Normalize recipient to list for the To header
    to_list = [recipient] if isinstance(recipient, str) else list(recipient)
    
    # Build the email message with headers
    # aiosmtplib extracts recipients from To, Cc, Bcc headers and strips Bcc before sending
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_addr
    msg["To"] = ", ".join(to_list)
    
    if cc:
        msg["Cc"] = ", ".join(cc)
    
    if bcc:
        msg["Bcc"] = ", ".join(bcc)  # aiosmtplib will strip this before sending
    
    if reply_to:
        msg["Reply-To"] = reply_to
    
    # Add body parts (text first, then HTML for proper email client rendering)
    if body_text:
        msg.attach(MIMEText(body_text, "plain", "utf-8"))
    
    if body_html:
        msg.attach(MIMEText(body_html, "html", "utf-8"))
    
    # Add attachments
    if attachments:
        for attachment in attachments:
            try:
                maintype, subtype = attachment.mime_type.split("/", 1)
            except ValueError:
                maintype, subtype = "application", "octet-stream"
            
            part = MIMEBase(maintype, subtype)
            part.set_payload(attachment.content)
            encoders.encode_base64(part)
            part.add_header(
                "Content-Disposition",
                f'attachment; filename="{attachment.filename}"'
            )
            msg.attach(part)
    
    # Send via async SMTP
    # aiosmtplib auto-negotiates STARTTLS if server supports it
    # Authentication is skipped if username/password are None
    try:
        await aiosmtplib.send(
            msg,
            hostname=config["host"],
            port=config["port"],
            username=config["username"],
            password=config["password"],
            timeout=30,
        )
        return EmailResult(success=True)
        
    except aiosmtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP authentication failed: {e}")
        return EmailResult(success=False, error=f"SMTP authentication failed: {str(e)}")
    except aiosmtplib.SMTPRecipientsRefused as e:
        logger.error(f"Recipients refused: {e}")
        return EmailResult(success=False, error=f"Recipients refused: {str(e)}")
    except aiosmtplib.SMTPSenderRefused as e:
        logger.error(f"Sender refused: {e}")
        return EmailResult(success=False, error=f"Sender refused: {str(e)}")
    except aiosmtplib.SMTPException as e:
        logger.error(f"SMTP error: {e}")
        return EmailResult(success=False, error=f"SMTP error: {str(e)}")
    except OSError as e:
        # Covers ConnectionRefusedError, socket errors, etc.
        logger.error(f"Connection error to {config['host']}:{config['port']}: {e}")
        return EmailResult(
            success=False, 
            error=f"Connection error to {config['host']}:{config['port']}: {str(e)}"
        )
    except Exception as e:
        # Catch any other unexpected errors, but log them for debugging
        logger.exception(f"Unexpected error sending email: {e}")
        return EmailResult(success=False, error=f"Failed to send email: {str(e)}")


async def send_templated_email(
    recipient: str | list[str],
    subject: str,
    template_name: str,
    context: dict[str, Any],
    text_template_name: str | None = None,
    sender: str | None = None,
    cc: list[str] | None = None,
    bcc: list[str] | None = None,
    reply_to: str | None = None,
    attachments: list[EmailAttachment] | None = None,
) -> EmailResult:
    """
    Send an email using a Jinja2 template asynchronously.
    
    Templates are loaded from: projojo_backend/templates/email/
    
    Args:
        recipient: Email address or list of addresses
        subject: Email subject line
        template_name: Name of the HTML template file (e.g., "invitation.html")
        context: Dictionary of variables to pass to the template
        text_template_name: Optional plain text template (e.g., "invitation.txt")
        sender: Sender email address (uses default if not provided)
        cc: List of CC recipients
        bcc: List of BCC recipients
        reply_to: Reply-to email address
        attachments: List of EmailAttachment objects
        
    Returns:
        EmailResult with success status and optional error message
        
    Example:
        >>> result = await send_templated_email(
        ...     recipient="user@example.com",
        ...     subject="You are invited!",
        ...     template_name="invitation.html",
        ...     context={
        ...         "user_name": "John",
        ...         "project_name": "Smart Farm",
        ...         "invite_link": "https://projojo.nl/invite/abc123"
        ...     }
        ... )
        >>> if result.success:
        ...     print("Invitation sent!")
    """
    body_html: str | None = None
    body_text: str | None = None
    
    try:
        body_html = _render_template(template_name, context)
    except TemplateNotFound as e:
        logger.error(f"HTML template not found: {e.name}")
        return EmailResult(
            success=False,
            error=f"Template not found: {e.name}. Check that it exists in templates/email/"
        )
    except Exception as e:
        logger.exception(f"Error rendering HTML template '{template_name}': {e}")
        return EmailResult(
            success=False,
            error=f"Template rendering error for '{template_name}': {str(e)}"
        )
    
    # Render text template if provided
    if text_template_name:
        try:
            body_text = _render_template(text_template_name, context)
        except TemplateNotFound as e:
            logger.warning(f"Text template not found: {e.name}, proceeding without text body")
        except Exception as e:
            logger.warning(f"Error rendering text template '{text_template_name}': {e}")
    
    return await send_email(
        recipient=recipient,
        subject=subject,
        body_text=body_text,
        body_html=body_html,
        sender=sender,
        cc=cc,
        bcc=bcc,
        reply_to=reply_to,
        attachments=attachments,
    )

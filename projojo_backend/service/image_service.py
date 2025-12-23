import os
import shutil
import uuid
from fastapi import UploadFile, HTTPException
import requests
from urllib.parse import urlparse
import mimetypes


# Whitelist of allowed domains for image downloads
ALLOWED_IMAGE_DOMAINS = [
    "avatars.githubusercontent.com",
    "lh3.googleusercontent.com",
]

# Allowed MIME types for images with their corresponding extensions
ALLOWED_IMAGE_MIMETYPES = {
    "image/jpeg": ".jpg",
    "image/jpg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

# Allowed MIME types for PDFs with their corresponding extensions
ALLOWED_PDF_MIMETYPES = {
    "application/pdf": ".pdf",
}


def validate_file_type(file_extension: str, content_type: str, directory: str) -> None:
    """
    Validate that the file type is allowed for the specified directory.

    Args:
        file_extension (str): The file extension (e.g., '.jpg', '.pdf')
        content_type (str): The MIME type of the file
        directory (str): The target directory path

    Raises:
        HTTPException: If the file type is not allowed for the directory
    """
    is_images_dir = "images" in directory.lower()
    is_pdf_dir = "pdf" in directory.lower()

    if is_images_dir:
        if not (content_type in ALLOWED_IMAGE_MIMETYPES and file_extension.lower() in ALLOWED_IMAGE_MIMETYPES.values()):
            raise HTTPException(
                status_code=400,
                detail="Het geüploade bestand is geen geldige afbeelding. Alleen PNG, JPG, JPEG en WebP zijn toegestaan."
            )
    elif is_pdf_dir:
        if not (content_type in ALLOWED_PDF_MIMETYPES and file_extension.lower() in ALLOWED_PDF_MIMETYPES.values()):
            raise HTTPException(
                status_code=400,
                detail="Het geüploade bestand is geen geldig PDF-bestand. Alleen PDF-bestanden zijn toegestaan."
            )


def is_safe_url(url: str) -> tuple[bool, str]:
    """
    Validate that a URL is from an allowed domain.

    Args:
        url (str): The URL to validate

    Returns:
        tuple[bool, str]: (is_safe, error_message)
    """
    try:
        parsed = urlparse(url)

        # Only allow https
        if parsed.scheme.lower() != "https":
            return False, "Er ging iets mis bij het ophalen van de afbeelding"

        # Check if hostname exists
        if not parsed.hostname:
            return False, "Er ging iets mis bij het ophalen van de afbeelding"

        hostname = parsed.hostname.lower()

        # Check if hostname is in the whitelist
        if hostname not in ALLOWED_IMAGE_DOMAINS:
            return False, "Er ging iets mis bij het ophalen van de afbeelding"

        return True, ""

    except Exception as e:
        print(f"Error validating URL {url}: {e}")
        return False, "Er ging iets mis bij het ophalen van de afbeelding"


def save_image(file: UploadFile, directory: str = "static/images") -> str:
    """
    Save an uploaded image to the specified directory with a randomly generated filename

    Args:
        file (UploadFile): The uploaded file object
        directory (str, optional): The directory to save the image to. Defaults to "static/images".

    Returns:
        str: The unique filename of the saved image

    Raises:
        HTTPException: If the file type doesn't match the expected type for the directory
    """
    # Validate file type
    content_type = file.content_type or ""
    _, file_extension = os.path.splitext(file.filename)
    validate_file_type(file_extension, content_type, directory)

    # Create the directory if it doesn't exist
    os.makedirs(directory, exist_ok=True)

    # Generate a unique filename using UUID to prevent any filename conflicts
    # This ensures multiple files with the same original name won't overwrite each other
    unique_filename = generate_unique_filename(file_extension)

    # Save the file to the specified directory with the unique filename
    file_path = os.path.join(directory, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return unique_filename


def save_image_from_url(image_url: str, directory: str = "static/images") -> str:
    """
    Download and save an image from a URL to the specified directory with a randomly generated filename

    Args:
        image_url (str): The URL of the image to download
        directory (str, optional): The directory to save the image to. Defaults to "static/images".

    Returns:
        str: The unique filename of the saved image, or empty string if failed

    Raises:
        ValueError: If the URL is not from an allowed domain or file type is invalid
    """
    if not image_url:
        return ""

    # Validate URL is from allowed domain
    is_safe, error_message = is_safe_url(image_url)
    if not is_safe:
        print(f"Security validation failed for URL {image_url}: {error_message}")
        raise ValueError(error_message)

    try:
        # Create the directory if it doesn't exist
        os.makedirs(directory, exist_ok=True)

        # Download the image
        response = requests.get(image_url, stream=True, timeout=10)
        response.raise_for_status()

        # Get Content-Type from response
        content_type = response.headers.get('Content-Type', '').split(';')[0].strip()

        # Try to determine the file extension from the URL
        parsed_url = urlparse(image_url)
        file_extension = os.path.splitext(parsed_url.path)[1]

        # Validate file type before proceeding
        validate_file_type(file_extension, content_type, directory)

        # If no extension in URL, derive it from validated content_type
        if not file_extension:
            file_extension = ALLOWED_IMAGE_MIMETYPES.get(content_type, '.jpg')

        # Generate a unique filename
        unique_filename = generate_unique_filename(file_extension)
        file_path = os.path.join(directory, unique_filename)

        # Save the image
        with open(file_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        return unique_filename

    except requests.RequestException as e:
        print(f"Failed to download image from {image_url}: {e}")
        return ""
    except Exception as e:
        print(f"Error saving image from {image_url}: {e}")
        return ""

def save_image_from_bytes(image_bytes: bytes, file_extension: str = ".jpg", directory: str = "static/images") -> str:
    """
    Save image bytes to the specified directory with a randomly generated filename

    Args:
        image_bytes (bytes): The image data as bytes
        file_extension (str, optional): The file extension for the image. Defaults to ".jpg".
        directory (str, optional): The directory to save the image to. Defaults to "static/images".

    Returns:
        str: The unique filename of the saved image, or empty string if failed

    Raises:
        ValueError: If the file type doesn't match the expected type for the directory
    """
    if not image_bytes:
        return ""

    try:
        # Guess MIME type from file extension
        content_type = mimetypes.guess_type(f"file{file_extension}")[0] or ""

        # Validate file type
        validate_file_type(file_extension, content_type, directory)

        # Create the directory if it doesn't exist
        os.makedirs(directory, exist_ok=True)

        # Generate a unique filename
        unique_filename = generate_unique_filename(file_extension)
        file_path = os.path.join(directory, unique_filename)

        # Save the image
        with open(file_path, "wb") as f:
            f.write(image_bytes)

        return unique_filename

    except Exception as e:
        print(f"Error saving image from bytes: {e}")
        return ""


def generate_unique_filename(file_extension: str) -> str:
    """
    Generate a unique filename using UUID and the given file extension.

    Args:
        file_extension (str): The file extension to use (e.g., '.jpg', '.png').

    Returns:
        str: A unique filename combining UUID and the file extension
    """
    return f"{uuid.uuid4()}{file_extension}"


def delete_image(filename: str, directory: str = "static/images") -> bool:
    """
    Delete an image file from the specified directory.

    Args:
        filename (str): The filename to delete
        directory (str, optional): The directory where the file is located. Defaults to "static/images".

    Returns:
        bool: True if the file was successfully deleted or doesn't exist, False if an error occurred
    """
    if os.getenv("ENVIRONMENT", "none").lower() == "development":
        # Don't delete files in development environment
        return True

    if not filename:
        return True

    try:
        file_path = os.path.join(directory, filename)

        # Check if file exists before attempting to delete
        if os.path.exists(file_path):
            os.remove(file_path)

        return True
    except Exception:
        return False
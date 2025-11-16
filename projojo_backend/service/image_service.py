import os
import shutil
import uuid
from fastapi import UploadFile
import requests
from urllib.parse import urlparse


# Whitelist of allowed domains for image downloads
ALLOWED_IMAGE_DOMAINS = [
    "avatars.githubusercontent.com",
    "lh3.googleusercontent.com",
]


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
            return False, "Only https URLs are allowed"

        # Check if hostname exists
        if not parsed.hostname:
            return False, "URL must have a valid hostname"

        hostname = parsed.hostname.lower()

        # Check if hostname is in the whitelist
        if hostname not in ALLOWED_IMAGE_DOMAINS:
            return False, f"Domain {hostname} is not allowed"

        return True, ""

    except Exception as e:
        return False, f"Invalid URL format: {str(e)}"


def save_image(file: UploadFile, directory: str = "static/images") -> str:
    """
    Save an uploaded image to the specified directory with a randomly generated filename

    Args:
        file (UploadFile): The uploaded file object
        directory (str, optional): The directory to save the image to. Defaults to "static/images".

    Returns:
        str: The unique filename of the saved image
    """
    # Create the directory if it doesn't exist
    os.makedirs(directory, exist_ok=True)

    # Get the file extension from the original filename
    _, file_extension = os.path.splitext(file.filename)

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
        ValueError: If the URL is not from an allowed domain
    """
    if not image_url:
        return ""

    # Validate URL is from allowed domain
    is_safe, error_message = is_safe_url(image_url)
    if not is_safe:
        print(f"Security validation failed for URL {image_url}: {error_message}")
        raise ValueError(f"Invalid or unsafe URL: {error_message}")

    try:
        # Create the directory if it doesn't exist
        os.makedirs(directory, exist_ok=True)

        # Download the image
        response = requests.get(image_url, stream=True, timeout=10)
        response.raise_for_status()

        # Try to determine the file extension from the URL or Content-Type header
        parsed_url = urlparse(image_url)
        file_extension = os.path.splitext(parsed_url.path)[1]

        if not file_extension:
            # Try to get extension from Content-Type header
            content_type = response.headers.get('Content-Type', '')
            if 'jpeg' in content_type or 'jpg' in content_type:
                file_extension = '.jpg'
            elif 'png' in content_type:
                file_extension = '.png'
            elif 'gif' in content_type:
                file_extension = '.gif'
            elif 'webp' in content_type:
                file_extension = '.webp'
            else:
                file_extension = '.jpg'  # Default fallback

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
    """
    if not image_bytes:
        return ""

    try:
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
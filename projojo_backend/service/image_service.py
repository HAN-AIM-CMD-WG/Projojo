import os
import shutil
import uuid
from fastapi import UploadFile
import requests
from urllib.parse import urlparse


def save_image(file: UploadFile, directory: str = "static/images") -> tuple[str, str]:
    """
    Save an uploaded image to the specified directory with a randomly generated filename

    Args:
        file (UploadFile): The uploaded file object
        directory (str, optional): The directory to save the image to. Defaults to "static/images".

    Returns:
        tuple[str, str]: A tuple containing (file_path, filename)
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

    return file_path, unique_filename


def save_image_from_url(image_url: str, directory: str = "static/images") -> tuple[str, str]:
    """
    Download and save an image from a URL to the specified directory with a randomly generated filename

    Args:
        image_url (str): The URL of the image to download
        directory (str, optional): The directory to save the image to. Defaults to "static/images".

    Returns:
        tuple[str, str]: A tuple containing (file_path, filename)
    """
    if not image_url:
        return "", ""

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

        return file_path, unique_filename

    except requests.RequestException as e:
        print(f"Failed to download image from {image_url}: {e}")
        return "", ""
    except Exception as e:
        print(f"Error saving image from {image_url}: {e}")
        return "", ""

def generate_unique_filename(file_extension: str) -> str:
    """
    Generate a unique filename using UUID and the given file extension.

    Args:
        file_extension (str): The file extension to use (e.g., '.jpg', '.png').
    """
    return f"{uuid.uuid4()}{file_extension}"
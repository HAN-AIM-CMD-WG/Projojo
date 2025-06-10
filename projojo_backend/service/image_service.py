import os
import shutil
import uuid
from fastapi import UploadFile


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
    unique_filename = f"{uuid.uuid4()}{file_extension}"

    # Save the file to the specified directory with the unique filename
    file_path = os.path.join(directory, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return file_path, unique_filename

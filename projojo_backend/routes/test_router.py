import os
import shutil
from fastapi import APIRouter, UploadFile, File

router = APIRouter(prefix="/test", tags=["Test Endpoints"])

@router.post("/upload", status_code=201)
async def upload_file(file: UploadFile = File(...)):
    """
    Upload a file to the server
    """
    # Create the static/images directory if it doesn't exist
    os.makedirs("static/images", exist_ok=True)

    # Save the file to the static/images directory
    file_path = os.path.join("static/images", file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return {"filename": file.filename, "path": file_path}

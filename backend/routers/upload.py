"""
File upload router for letters, voice recordings, and other documents.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import uuid
from typing import List

from database.database import get_db
from models.user import User
from services.auth_service import AuthService

router = APIRouter()
auth_service = AuthService()

ALLOWED_EXTENSIONS = {
    'audio': ['mp3', 'wav', 'ogg', 'm4a'],
    'document': ['pdf', 'txt', 'doc', 'docx'],
    'image': ['jpg', 'jpeg', 'png', 'gif']
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    file_type: str = Form(...),
    description: str = Form(None),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Upload a file (letter, voice recording, document, etc.)"""
    
    # Validate file type
    if file_type not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Invalid file type")
    
    # Check file extension
    file_extension = file.filename.split('.')[-1].lower()
    if file_extension not in ALLOWED_EXTENSIONS[file_type]:
        raise HTTPException(
            status_code=400, 
            detail=f"File extension .{file_extension} not allowed for {file_type} files"
        )
    
    # Check file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
    
    # Save file
    filename = f"{uuid.uuid4()}.{file_extension}"
    upload_dir = f"uploads/{file_type}"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = f"{upload_dir}/{filename}"
    
    with open(file_path, "wb") as buffer:
        buffer.write(content)
    
    return {
        "filename": filename,
        "file_path": file_path,
        "file_type": file_type,
        "description": description,
        "size": len(content),
        "message": "File uploaded successfully"
    }

@router.get("/files")
async def list_user_files(
    current_user: User = Depends(auth_service.get_current_user)
):
    """List all files uploaded by the user"""
    # This would typically query a file metadata table
    # For now, return a simple response
    return {"message": "File listing feature coming soon"}

@router.delete("/file/{filename}")
async def delete_file(
    filename: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Delete an uploaded file"""
    # Find and delete file
    for file_type in ALLOWED_EXTENSIONS.keys():
        file_path = f"uploads/{file_type}/{filename}"
        if os.path.exists(file_path):
            os.remove(file_path)
            return {"message": "File deleted successfully"}
    
    raise HTTPException(status_code=404, detail="File not found")
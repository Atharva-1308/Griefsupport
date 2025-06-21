"""
File upload router for letters, voice recordings, and other documents.
Enhanced with better error handling and file path management.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
import uuid
import shutil
from pathlib import Path
from typing import List
import logging

from database.database import get_db
from models.user import User
from services.auth_service import AuthService

router = APIRouter()
auth_service = AuthService()
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {
    'audio': ['mp3', 'wav', 'ogg', 'm4a', 'webm'],
    'document': ['pdf', 'txt', 'doc', 'docx'],
    'image': ['jpg', 'jpeg', 'png', 'gif', 'webp']
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

def ensure_upload_directory(directory: str) -> str:
    """Ensure upload directory exists and return absolute path"""
    try:
        # Create absolute path
        abs_path = os.path.abspath(directory)
        Path(abs_path).mkdir(parents=True, exist_ok=True)
        logger.info(f"✅ Upload directory ensured: {abs_path}")
        return abs_path
    except Exception as e:
        logger.error(f"❌ Failed to create upload directory {directory}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create upload directory: {str(e)}")

def get_safe_filename(original_filename: str) -> str:
    """Generate a safe filename with UUID"""
    if not original_filename:
        return f"{uuid.uuid4()}.bin"
    
    # Extract extension safely
    parts = original_filename.split('.')
    extension = parts[-1].lower() if len(parts) > 1 else 'bin'
    
    # Generate safe filename
    safe_name = f"{uuid.uuid4()}.{extension}"
    return safe_name

@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    file_type: str = Form(...),
    description: str = Form(None),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Upload a file (letter, voice recording, document, etc.)"""
    
    try:
        # Validate file type
        if file_type not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail=f"Invalid file type. Allowed: {list(ALLOWED_EXTENSIONS.keys())}")
        
        # Check if file was actually uploaded
        if not file.filename:
            raise HTTPException(status_code=400, detail="No file was uploaded")
        
        # Check file extension
        file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
        if file_extension not in ALLOWED_EXTENSIONS[file_type]:
            raise HTTPException(
                status_code=400, 
                detail=f"File extension .{file_extension} not allowed for {file_type} files. Allowed: {ALLOWED_EXTENSIONS[file_type]}"
            )
        
        # Read file content
        content = await file.read()
        
        # Check file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB")
        
        # Check if content is not empty
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty")
        
        # Ensure upload directory exists
        upload_dir = ensure_upload_directory(f"uploads/{file_type}")
        
        # Generate safe filename
        safe_filename = get_safe_filename(file.filename)
        file_path = os.path.join(upload_dir, safe_filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        # Get relative path for API response
        relative_path = f"uploads/{file_type}/{safe_filename}"
        
        logger.info(f"✅ File uploaded successfully: {relative_path}")
        
        return {
            "filename": safe_filename,
            "original_filename": file.filename,
            "file_path": relative_path,
            "file_type": file_type,
            "description": description,
            "size": len(content),
            "content_type": file.content_type,
            "message": "File uploaded successfully"
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"❌ File upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

@router.get("/files")
async def list_user_files(
    current_user: User = Depends(auth_service.get_current_user)
):
    """List all files uploaded by the user"""
    try:
        user_files = []
        
        # Scan all upload directories
        for file_type in ALLOWED_EXTENSIONS.keys():
            upload_dir = f"uploads/{file_type}"
            if os.path.exists(upload_dir):
                for filename in os.listdir(upload_dir):
                    file_path = os.path.join(upload_dir, filename)
                    if os.path.isfile(file_path):
                        stat = os.stat(file_path)
                        user_files.append({
                            "filename": filename,
                            "file_type": file_type,
                            "file_path": f"{upload_dir}/{filename}",
                            "size": stat.st_size,
                            "created_at": stat.st_ctime
                        })
        
        return {
            "files": user_files,
            "total_count": len(user_files),
            "message": "Files retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to list files: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")

@router.delete("/file/{filename}")
async def delete_file(
    filename: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Delete an uploaded file"""
    try:
        # Find and delete file
        file_found = False
        
        for file_type in ALLOWED_EXTENSIONS.keys():
            file_path = f"uploads/{file_type}/{filename}"
            abs_file_path = os.path.abspath(file_path)
            
            if os.path.exists(abs_file_path):
                os.remove(abs_file_path)
                file_found = True
                logger.info(f"✅ File deleted: {file_path}")
                break
        
        if not file_found:
            raise HTTPException(status_code=404, detail="File not found")
        
        return {"message": "File deleted successfully", "filename": filename}
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"❌ Failed to delete file {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

@router.get("/file/{file_type}/{filename}")
async def get_file_info(
    file_type: str,
    filename: str,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get information about a specific file"""
    try:
        if file_type not in ALLOWED_EXTENSIONS:
            raise HTTPException(status_code=400, detail="Invalid file type")
        
        file_path = f"uploads/{file_type}/{filename}"
        abs_file_path = os.path.abspath(file_path)
        
        if not os.path.exists(abs_file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        stat = os.stat(abs_file_path)
        
        return {
            "filename": filename,
            "file_type": file_type,
            "file_path": file_path,
            "size": stat.st_size,
            "created_at": stat.st_ctime,
            "modified_at": stat.st_mtime,
            "message": "File information retrieved successfully"
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logger.error(f"❌ Failed to get file info for {filename}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get file information: {str(e)}")

@router.get("/storage-info")
async def get_storage_info(
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get storage usage information"""
    try:
        total_size = 0
        file_counts = {}
        
        for file_type in ALLOWED_EXTENSIONS.keys():
            upload_dir = f"uploads/{file_type}"
            file_counts[file_type] = 0
            
            if os.path.exists(upload_dir):
                for filename in os.listdir(upload_dir):
                    file_path = os.path.join(upload_dir, filename)
                    if os.path.isfile(file_path):
                        total_size += os.path.getsize(file_path)
                        file_counts[file_type] += 1
        
        return {
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "max_size_mb": MAX_FILE_SIZE // (1024 * 1024),
            "file_counts": file_counts,
            "allowed_extensions": ALLOWED_EXTENSIONS,
            "message": "Storage information retrieved successfully"
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to get storage info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get storage information: {str(e)}")
"""
AI Chatbot router for grief counseling conversations.
Enhanced with anonymous chat support and voice message handling.
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import os
import aiofiles

from database.database import get_db
from models.user import User
from models.chat import ChatMessage
from services.auth_service import AuthService
from services.chat_service import ChatService
from services.voice_service import VoiceService

router = APIRouter()
auth_service = AuthService()
chat_service = ChatService()
voice_service = VoiceService()

# Store for anonymous sessions
anonymous_sessions = {}

@router.post("/message")
async def send_message(
    message: str,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message to the AI chatbot (authenticated users)"""
    response = await chat_service.process_message(message, current_user.id)
    
    # Save conversation to database
    chat_message = ChatMessage(
        user_id=current_user.id,
        message=message,
        response=response
    )
    db.add(chat_message)
    db.commit()
    
    return {"message": message, "response": response}

@router.post("/message/anonymous")
async def send_anonymous_message(
    message: str,
    session_id: Optional[str] = None
):
    """Send a message to the AI chatbot (anonymous users)"""
    if not session_id:
        session_id = str(uuid.uuid4())
    
    # Use negative session ID for anonymous users to avoid conflicts
    anonymous_user_id = f"anon_{session_id}"
    response = await chat_service.process_message(message, anonymous_user_id)
    
    # Store in memory for anonymous sessions (in production, use Redis)
    if session_id not in anonymous_sessions:
        anonymous_sessions[session_id] = []
    
    anonymous_sessions[session_id].append({
        "message": message,
        "response": response,
        "timestamp": "now"
    })
    
    # Keep only last 50 messages per session
    if len(anonymous_sessions[session_id]) > 50:
        anonymous_sessions[session_id] = anonymous_sessions[session_id][-50:]
    
    return {
        "message": message, 
        "response": response, 
        "session_id": session_id
    }

@router.post("/voice-message")
async def send_voice_message(
    voice_file: UploadFile = File(...),
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Send a voice message to the AI chatbot (authenticated users)"""
    if not voice_file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    try:
        # Save voice file
        file_extension = voice_file.filename.split('.')[-1] if voice_file.filename else 'wav'
        filename = f"voice_msg_{uuid.uuid4()}.{file_extension}"
        file_path = f"uploads/voice_messages/{filename}"
        
        os.makedirs("uploads/voice_messages", exist_ok=True)
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await voice_file.read()
            await f.write(content)
        
        # For now, we'll use a placeholder transcription
        # In production, you'd use speech-to-text service
        transcribed_text = "Voice message received - processing audio content for grief support."
        
        response = await chat_service.process_message(transcribed_text, current_user.id)
        
        # Save conversation to database
        chat_message = ChatMessage(
            user_id=current_user.id,
            message=transcribed_text,
            response=response,
            is_voice_message=True,
            voice_file_path=file_path
        )
        db.add(chat_message)
        db.commit()
        
        return {
            "message": transcribed_text,
            "response": response,
            "voice_file_path": file_path
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process voice message: {str(e)}")

@router.post("/voice-message/anonymous")
async def send_anonymous_voice_message(
    voice_file: UploadFile = File(...),
    session_id: Optional[str] = None
):
    """Send a voice message to the AI chatbot (anonymous users)"""
    if not voice_file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    if not session_id:
        session_id = str(uuid.uuid4())
    
    try:
        # Save voice file
        file_extension = voice_file.filename.split('.')[-1] if voice_file.filename else 'wav'
        filename = f"anon_voice_{uuid.uuid4()}.{file_extension}"
        file_path = f"uploads/voice_messages/{filename}"
        
        os.makedirs("uploads/voice_messages", exist_ok=True)
        
        async with aiofiles.open(file_path, 'wb') as f:
            content = await voice_file.read()
            await f.write(content)
        
        # Placeholder transcription
        transcribed_text = "Voice message received - providing compassionate grief support."
        
        anonymous_user_id = f"anon_{session_id}"
        response = await chat_service.process_message(transcribed_text, anonymous_user_id)
        
        # Store in memory for anonymous sessions
        if session_id not in anonymous_sessions:
            anonymous_sessions[session_id] = []
        
        anonymous_sessions[session_id].append({
            "message": transcribed_text,
            "response": response,
            "timestamp": "now",
            "is_voice": True,
            "voice_file_path": file_path
        })
        
        return {
            "message": transcribed_text,
            "response": response,
            "session_id": session_id,
            "voice_file_path": file_path
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process voice message: {str(e)}")

@router.get("/history")
async def get_chat_history(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's chat history (authenticated users)"""
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": msg.id,
            "message": msg.message,
            "response": msg.response,
            "is_voice_message": msg.is_voice_message,
            "voice_file_path": msg.voice_file_path,
            "created_at": msg.created_at
        }
        for msg in messages
    ]

@router.get("/history/anonymous/{session_id}")
async def get_anonymous_chat_history(session_id: str):
    """Get anonymous chat history"""
    if session_id not in anonymous_sessions:
        return []
    
    return anonymous_sessions[session_id]

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    """WebSocket endpoint for real-time chat (authenticated users)"""
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            response = await chat_service.process_message(data, user_id)
            
            # Save to database
            chat_message = ChatMessage(
                user_id=user_id,
                message=data,
                response=response
            )
            db.add(chat_message)
            db.commit()
            
            await websocket.send_json({
                "message": data,
                "response": response,
                "timestamp": chat_message.created_at.isoformat()
            })
            
    except WebSocketDisconnect:
        pass

@router.websocket("/ws/anonymous/{session_id}")
async def anonymous_websocket_endpoint(websocket: WebSocket, session_id: str):
    """WebSocket endpoint for real-time chat (anonymous users)"""
    await websocket.accept()
    
    try:
        while True:
            data = await websocket.receive_text()
            anonymous_user_id = f"anon_{session_id}"
            response = await chat_service.process_message(data, anonymous_user_id)
            
            # Store in memory
            if session_id not in anonymous_sessions:
                anonymous_sessions[session_id] = []
            
            anonymous_sessions[session_id].append({
                "message": data,
                "response": response,
                "timestamp": "now"
            })
            
            await websocket.send_json({
                "message": data,
                "response": response,
                "session_id": session_id,
                "timestamp": "now"
            })
            
    except WebSocketDisconnect:
        pass
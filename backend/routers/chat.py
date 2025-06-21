"""
AI Chatbot router for grief counseling conversations.
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List

from database.database import get_db
from models.user import User
from models.chat import ChatMessage
from services.auth_service import AuthService
from services.chat_service import ChatService

router = APIRouter()
auth_service = AuthService()
chat_service = ChatService()

@router.post("/message")
async def send_message(
    message: str,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Send a message to the AI chatbot"""
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

@router.get("/history")
async def get_chat_history(
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(auth_service.get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's chat history"""
    messages = db.query(ChatMessage).filter(
        ChatMessage.user_id == current_user.id
    ).order_by(ChatMessage.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": msg.id,
            "message": msg.message,
            "response": msg.response,
            "created_at": msg.created_at
        }
        for msg in messages
    ]

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: int, db: Session = Depends(get_db)):
    """WebSocket endpoint for real-time chat"""
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
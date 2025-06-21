"""
Peer support router for community chat spaces.
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import List, Dict
import json

from database.database import get_db
from models.user import User
from models.support import SupportMessage
from services.auth_service import AuthService

router = APIRouter()
auth_service = AuthService()

# Store active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str, room_id: str):
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_text(message)

manager = ConnectionManager()

@router.get("/rooms")
async def get_support_rooms():
    """Get available support chat rooms"""
    rooms = [
        {"id": "general", "name": "General Support", "description": "Open discussion for all"},
        {"id": "grief-stages", "name": "Grief Stages", "description": "Discussing different stages of grief"},
        {"id": "loss-of-parent", "name": "Loss of Parent", "description": "Support for those who lost a parent"},
        {"id": "loss-of-spouse", "name": "Loss of Spouse", "description": "Support for widows and widowers"},
        {"id": "loss-of-child", "name": "Loss of Child", "description": "Support for parents who lost a child"},
        {"id": "pet-loss", "name": "Pet Loss", "description": "Grieving the loss of beloved pets"},
    ]
    return rooms

@router.get("/rooms/{room_id}/messages")
async def get_room_messages(
    room_id: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Get recent messages from a support room"""
    messages = db.query(SupportMessage).filter(
        SupportMessage.room_id == room_id
    ).order_by(SupportMessage.created_at.desc()).offset(skip).limit(limit).all()
    
    return [
        {
            "id": msg.id,
            "username": msg.user.username,
            "message": msg.message,
            "created_at": msg.created_at
        }
        for msg in messages
    ]

@router.websocket("/ws/{room_id}/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    room_id: str, 
    user_id: int,
    db: Session = Depends(get_db)
):
    """WebSocket endpoint for peer support chat"""
    await manager.connect(websocket, room_id)
    
    # Get user info
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        await websocket.close()
        return
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Save message to database
            support_message = SupportMessage(
                user_id=user_id,
                room_id=room_id,
                message=message_data["message"]
            )
            db.add(support_message)
            db.commit()
            
            # Broadcast message to room
            broadcast_data = {
                "username": user.username,
                "message": message_data["message"],
                "timestamp": support_message.created_at.isoformat()
            }
            
            await manager.broadcast(json.dumps(broadcast_data), room_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
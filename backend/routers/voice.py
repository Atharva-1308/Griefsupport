"""
Voice features router using ElevenLabs API for voice mimicry and style matching.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import os

from database.database import get_db
from models.user import User
from services.auth_service import AuthService
from services.voice_service import VoiceService

router = APIRouter()
auth_service = AuthService()
voice_service = VoiceService()

@router.post("/clone")
async def clone_voice(
    voice_file: UploadFile = File(...),
    voice_name: str = "Custom Voice",
    current_user: User = Depends(auth_service.get_current_user)
):
    """Clone a voice using ElevenLabs API"""
    if not voice_file.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    try:
        result = await voice_service.clone_voice(voice_file, voice_name, current_user.id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/synthesize")
async def synthesize_speech(
    text: str,
    voice_id: str = None,
    current_user: User = Depends(auth_service.get_current_user)
):
    """Synthesize speech from text using ElevenLabs"""
    try:
        result = await voice_service.synthesize_speech(text, voice_id, current_user.id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/voices")
async def list_voices(
    current_user: User = Depends(auth_service.get_current_user)
):
    """List available voices"""
    try:
        voices = await voice_service.list_voices()
        return voices
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/style-match")
async def match_voice_style(
    text: str,
    reference_audio: UploadFile = File(...),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Match voice style from reference audio"""
    if not reference_audio.content_type.startswith('audio/'):
        raise HTTPException(status_code=400, detail="File must be an audio file")
    
    try:
        result = await voice_service.match_voice_style(text, reference_audio, current_user.id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
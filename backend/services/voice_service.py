"""
Enhanced Voice service using ElevenLabs API for voice cloning and synthesis.
"""

import os
import uuid
import aiofiles
import requests
from fastapi import UploadFile
from dotenv import load_dotenv
from typing import Dict, List

load_dotenv()

class VoiceService:
    def __init__(self):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        self.base_url = "https://api.elevenlabs.io/v1"
        
        if not self.api_key:
            raise ValueError("ElevenLabs API key not found in environment variables")

    async def clone_voice(self, voice_file: UploadFile, voice_name: str, user_id: int) -> dict:
        """Clone a voice using ElevenLabs API"""
        try:
            # Save uploaded file temporarily
            temp_filename = f"temp_{uuid.uuid4()}.{voice_file.filename.split('.')[-1]}"
            temp_path = f"uploads/temp/{temp_filename}"
            
            os.makedirs("uploads/temp", exist_ok=True)
            
            async with aiofiles.open(temp_path, 'wb') as f:
                content = await voice_file.read()
                await f.write(content)
            
            # Prepare the request to ElevenLabs
            url = f"{self.base_url}/voices/add"
            
            headers = {
                "xi-api-key": self.api_key
            }
            
            data = {
                "name": f"{voice_name}_{user_id}_{uuid.uuid4().hex[:8]}",
                "description": f"Cloned voice for grief support - {voice_name}"
            }
            
            with open(temp_path, 'rb') as audio_file:
                files = {
                    "files": (voice_file.filename, audio_file, voice_file.content_type)
                }
                
                response = requests.post(url, headers=headers, data=data, files=files)
            
            # Clean up temp file
            os.remove(temp_path)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "voice_id": result["voice_id"],
                    "voice_name": data["name"],
                    "message": "Voice cloned successfully",
                    "status": "success"
                }
            else:
                raise Exception(f"ElevenLabs API error: {response.status_code} - {response.text}")
            
        except Exception as e:
            # Clean up temp file if it exists
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.remove(temp_path)
            raise Exception(f"Voice cloning failed: {str(e)}")

    async def synthesize_speech(self, text: str, voice_id: str = None, user_id: int = None) -> dict:
        """Synthesize speech from text using ElevenLabs"""
        try:
            # Use default voice if none specified
            if not voice_id:
                voice_id = "21m00Tcm4TlvDq8ikWAM"  # Rachel - warm, caring voice
            
            url = f"{self.base_url}/text-to-speech/{voice_id}"
            
            headers = {
                "Accept": "audio/mpeg",
                "Content-Type": "application/json",
                "xi-api-key": self.api_key
            }
            
            data = {
                "text": text,
                "model_id": "eleven_monolingual_v1",
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.0,
                    "use_speaker_boost": True
                }
            }
            
            response = requests.post(url, json=data, headers=headers)
            
            if response.status_code == 200:
                # Save audio file
                filename = f"speech_{uuid.uuid4()}.mp3"
                file_path = f"uploads/speech/{filename}"
                
                os.makedirs("uploads/speech", exist_ok=True)
                
                with open(file_path, "wb") as f:
                    f.write(response.content)
                
                return {
                    "audio_file": file_path,
                    "filename": filename,
                    "text": text,
                    "voice_id": voice_id,
                    "message": "Speech synthesized successfully",
                    "status": "success"
                }
            else:
                raise Exception(f"ElevenLabs API error: {response.status_code} - {response.text}")
            
        except Exception as e:
            raise Exception(f"Speech synthesis failed: {str(e)}")

    async def list_voices(self) -> dict:
        """List available voices from ElevenLabs"""
        try:
            url = f"{self.base_url}/voices"
            headers = {
                "xi-api-key": self.api_key
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                voices_data = response.json()
                
                # Filter and format voices for grief counseling
                suitable_voices = []
                for voice in voices_data.get("voices", []):
                    # Prioritize warm, caring voices
                    voice_info = {
                        "voice_id": voice["voice_id"],
                        "name": voice["name"],
                        "category": voice.get("category", "Generated"),
                        "description": voice.get("description", ""),
                        "preview_url": voice.get("preview_url", ""),
                        "labels": voice.get("labels", {}),
                        "recommended_for_grief": self._is_suitable_for_grief(voice)
                    }
                    suitable_voices.append(voice_info)
                
                # Sort by suitability for grief counseling
                suitable_voices.sort(key=lambda x: x["recommended_for_grief"], reverse=True)
                
                return {
                    "voices": suitable_voices,
                    "total_count": len(suitable_voices),
                    "status": "success"
                }
            else:
                raise Exception(f"ElevenLabs API error: {response.status_code} - {response.text}")
            
        except Exception as e:
            raise Exception(f"Failed to fetch voices: {str(e)}")

    def _is_suitable_for_grief(self, voice: dict) -> bool:
        """Determine if a voice is suitable for grief counseling"""
        name = voice.get("name", "").lower()
        description = voice.get("description", "").lower()
        labels = voice.get("labels", {})
        
        # Preferred characteristics for grief counseling
        positive_indicators = [
            "warm", "caring", "gentle", "soft", "calm", "soothing", 
            "compassionate", "empathetic", "mature", "wise", "comforting"
        ]
        
        # Less suitable characteristics
        negative_indicators = [
            "aggressive", "harsh", "robotic", "cold", "dramatic", 
            "intense", "scary", "child", "young"
        ]
        
        # Check name and description
        text_to_check = f"{name} {description}"
        
        positive_score = sum(1 for indicator in positive_indicators if indicator in text_to_check)
        negative_score = sum(1 for indicator in negative_indicators if indicator in text_to_check)
        
        # Check labels for age and gender (prefer mature voices)
        age = labels.get("age", "").lower()
        gender = labels.get("gender", "").lower()
        
        if "middle aged" in age or "old" in age:
            positive_score += 2
        elif "young" in age:
            negative_score += 1
        
        return positive_score > negative_score

    async def match_voice_style(self, text: str, reference_audio: UploadFile, user_id: int) -> dict:
        """Match voice style from reference audio using voice conversion"""
        try:
            # Save reference audio
            temp_filename = f"ref_{uuid.uuid4()}.{reference_audio.filename.split('.')[-1]}"
            temp_path = f"uploads/temp/{temp_filename}"
            
            os.makedirs("uploads/temp", exist_ok=True)
            
            async with aiofiles.open(temp_path, 'wb') as f:
                content = await reference_audio.read()
                await f.write(content)
            
            # First, clone the voice from the reference audio
            clone_result = await self.clone_voice(reference_audio, f"style_match_{user_id}", user_id)
            
            if clone_result["status"] == "success":
                # Then synthesize speech with the cloned voice
                synthesis_result = await self.synthesize_speech(text, clone_result["voice_id"], user_id)
                
                # Clean up temp file
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                
                return {
                    "audio_file": synthesis_result["audio_file"],
                    "filename": synthesis_result["filename"],
                    "text": text,
                    "voice_id": clone_result["voice_id"],
                    "cloned_voice_name": clone_result["voice_name"],
                    "message": "Voice style matched and speech generated successfully",
                    "status": "success"
                }
            else:
                raise Exception("Failed to clone voice for style matching")
            
        except Exception as e:
            # Clean up temp file if it exists
            if 'temp_path' in locals() and os.path.exists(temp_path):
                os.remove(temp_path)
            raise Exception(f"Voice style matching failed: {str(e)}")

    async def get_voice_settings(self, voice_id: str) -> dict:
        """Get optimal voice settings for a specific voice"""
        try:
            url = f"{self.base_url}/voices/{voice_id}/settings"
            headers = {
                "xi-api-key": self.api_key
            }
            
            response = requests.get(url, headers=headers)
            
            if response.status_code == 200:
                return response.json()
            else:
                # Return default settings for grief counseling
                return {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.0,
                    "use_speaker_boost": True
                }
                
        except Exception as e:
            # Return default settings on error
            return {
                "stability": 0.5,
                "similarity_boost": 0.75,
                "style": 0.0,
                "use_speaker_boost": True
            }

    async def delete_voice(self, voice_id: str) -> dict:
        """Delete a cloned voice"""
        try:
            url = f"{self.base_url}/voices/{voice_id}"
            headers = {
                "xi-api-key": self.api_key
            }
            
            response = requests.delete(url, headers=headers)
            
            if response.status_code == 200:
                return {
                    "message": "Voice deleted successfully",
                    "status": "success"
                }
            else:
                raise Exception(f"ElevenLabs API error: {response.status_code} - {response.text}")
                
        except Exception as e:
            raise Exception(f"Failed to delete voice: {str(e)}")
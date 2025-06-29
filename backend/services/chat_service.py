"""
Enhanced AI Chatbot service for grief counseling conversations using OpenAI GPT-4.
Improved error handling, fallback responses, and API key management.
"""

import openai
import os
from dotenv import load_dotenv
from typing import List, Dict, Optional
import logging
import json

load_dotenv()
logger = logging.getLogger(__name__)

class ChatService:
    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.client = None
        
        if self.api_key and self.api_key != "sk-your-openai-api-key-here":
            try:
                self.client = openai.OpenAI(api_key=self.api_key)
                logger.info("✅ OpenAI client initialized successfully")
                self._test_api_connection()
            except Exception as e:
                logger.warning(f"⚠️  OpenAI client initialization failed: {e}")
                self.client = None
        else:
            logger.warning("⚠️  OpenAI API key not configured - using fallback responses")
            
        self.system_prompt = """
        You are Hope, a compassionate and professional AI grief counselor. Your role is to provide emotional support, 
        guidance, and resources to people who are grieving. You should:
        
        CORE PRINCIPLES:
        1. Be empathetic, warm, and understanding in every response
        2. Validate their feelings without judgment
        3. Use person-first, trauma-informed language
        4. Provide practical coping strategies when appropriate
        5. Suggest professional help when signs of complicated grief appear
        6. Never minimize their pain or rush their healing process
        7. Use gentle, supportive language that feels like talking to a caring friend
        8. Ask thoughtful, open-ended questions to help them process emotions
        9. Acknowledge the uniqueness of their grief journey
        10. Offer hope while respecting their current emotional state
        
        CONVERSATION STYLE:
        - Keep responses conversational but professional (300-500 words max)
        - Use "I" statements to show empathy ("I can hear how difficult this is")
        - Reflect back their emotions to show understanding
        - Offer gentle suggestions rather than direct advice
        - Include questions to encourage deeper reflection
        - Use metaphors and analogies that relate to healing and growth
        
        TOPICS TO ADDRESS:
        - Different stages and types of grief
        - Coping mechanisms and self-care strategies
        - Memory preservation and honoring loved ones
        - Dealing with grief triggers and difficult days
        - Building support systems
        - Finding meaning and purpose after loss
        - Managing guilt, anger, and other complex emotions
        - Navigating holidays and anniversaries
        
        WHEN TO SUGGEST PROFESSIONAL HELP:
        - Persistent thoughts of self-harm or suicide
        - Inability to function in daily life for extended periods
        - Substance abuse as coping mechanism
        - Complicated grief lasting over a year without improvement
        - Severe depression or anxiety
        
        REMEMBER:
        - Grief is not linear and has no timeline
        - Everyone grieves differently
        - Healing doesn't mean "getting over" the loss
        - Small steps forward are still progress
        - It's okay to have bad days even after good ones
        - Love doesn't end with death
        
        Always end responses with gentle encouragement and remind them they're not alone in this journey.
        """
        
        # Conversation context to maintain continuity
        self.conversation_history: Dict[str, List[Dict]] = {}

    def _test_api_connection(self):
        """Test the OpenAI API connection"""
        try:
            if self.client:
                # Test with a simple completion
                response = self.client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": "Hello"}],
                    max_tokens=10
                )
                logger.info("✅ OpenAI API connection test successful")
                return True
        except Exception as e:
            logger.warning(f"⚠️  OpenAI API connection test failed: {e}")
            self.client = None
            return False

    async def process_message(self, message: str, user_id: str) -> str:
        """Process a user message and return AI response using OpenAI GPT-4 or fallback"""
        try:
            if self.client and self.api_key:
                return await self._process_with_openai(message, user_id)
            else:
                return self._get_fallback_response(message, "no_api_key")
                
        except Exception as e:
            logger.error(f"Chat service error: {str(e)}")
            return self._get_fallback_response(message, "general_error")

    async def _process_with_openai(self, message: str, user_id: str) -> str:
        """Process message using OpenAI API"""
        try:
            # Initialize conversation history for new users
            if user_id not in self.conversation_history:
                self.conversation_history[user_id] = [
                    {"role": "system", "content": self.system_prompt}
                ]
            
            # Add user message to conversation history
            self.conversation_history[user_id].append({
                "role": "user", 
                "content": message
            })
            
            # Keep conversation history manageable (last 10 exchanges)
            if len(self.conversation_history[user_id]) > 21:  # system + 10 exchanges
                # Keep system prompt and last 8 exchanges
                self.conversation_history[user_id] = [
                    self.conversation_history[user_id][0]  # system prompt
                ] + self.conversation_history[user_id][-16:]  # last 8 exchanges
            
            # Generate response using OpenAI
            response = self.client.chat.completions.create(
                model="gpt-4",
                messages=self.conversation_history[user_id],
                max_tokens=600,
                temperature=0.7,
                presence_penalty=0.1,
                frequency_penalty=0.1
            )
            
            ai_response = response.choices[0].message.content.strip()
            
            # Add AI response to conversation history
            self.conversation_history[user_id].append({
                "role": "assistant",
                "content": ai_response
            })
            
            return ai_response
            
        except openai.APIError as e:
            logger.error(f"OpenAI API error: {e}")
            return self._get_fallback_response(message, "api_error")
        except openai.RateLimitError as e:
            logger.error(f"OpenAI rate limit error: {e}")
            return self._get_fallback_response(message, "rate_limit")
        except Exception as e:
            logger.error(f"OpenAI processing error: {e}")
            return self._get_fallback_response(message, "general_error")

    def _get_fallback_response(self, message: str, error_type: str) -> str:
        """Provide compassionate fallback responses when AI is unavailable"""
        
        # Analyze message for emotional keywords
        message_lower = message.lower()
        
        # Crisis-related keywords
        crisis_keywords = ['suicide', 'kill myself', 'end it all', 'can\'t go on', 'want to die', 'hurt myself']
        if any(keyword in message_lower for keyword in crisis_keywords):
            return """I'm very concerned about what you've shared. Your life has value, and there are people who want to help you through this difficult time.

Please reach out for immediate support:
• National Suicide Prevention Lifeline: 988
• Crisis Text Line: Text HOME to 741741
• Or go to your nearest emergency room

You don't have to face this alone. Professional counselors are available 24/7 to provide the support you need right now. Your feelings are valid, but there are ways through this pain that don't involve ending your life.

Would you be willing to reach out to one of these resources today?"""

        # Emotional keyword responses
        if any(word in message_lower for word in ['sad', 'crying', 'tears', 'heartbroken', 'devastated']):
            return """I can hear the deep sadness in your words, and I want you to know that what you're feeling is completely natural and valid. Tears are often the heart's way of expressing love that has nowhere to go.

Grief can feel overwhelming, like waves crashing over you. It's okay to let yourself feel these emotions - they're a testament to the love you carry. Some days will be harder than others, and that's part of the journey.

What has been the most difficult part of today for you? Sometimes sharing the weight can help lighten the load, even just a little. Remember, you're not alone in this."""

        elif any(word in message_lower for word in ['angry', 'mad', 'frustrated', 'rage', 'furious']):
            return """Anger is such a common and valid part of grief, though it can feel confusing or even frightening. You might feel angry at the situation, at yourself, at others, or even at your loved one for leaving. All of these feelings are normal.

Anger often masks other emotions like fear, sadness, or helplessness. It can actually be a sign that you're starting to process your loss more deeply.

Have you found any healthy ways to express or release this anger? Sometimes physical activity, journaling, or even screaming into a pillow can help. What feels right for you right now?"""

        elif any(word in message_lower for word in ['lonely', 'alone', 'isolated', 'empty', 'abandoned']):
            return """The loneliness that comes with grief can feel so profound and isolating. When someone important is no longer physically present, the world can feel empty and different. You're not alone in feeling this way.

Even when surrounded by people, grief can make us feel deeply alone because others might not fully understand what we're experiencing. This is one of the hardest parts of loss.

Is there anyone in your life who has been supportive, even if they don't fully understand? Sometimes just having someone sit with us in our pain can help. You're also part of a community here of people who understand grief intimately."""

        elif any(word in message_lower for word in ['guilt', 'regret', 'should have', 'if only', 'my fault']):
            return """Guilt and regret are such heavy companions in grief. The 'what ifs' and 'if onlys' can replay endlessly in our minds. Please know that these feelings, while painful, are very common.

We often hold ourselves to impossible standards when it comes to our relationships with those we've lost. The truth is, love is imperfect, and so are we. What matters is that you cared, and that love was real.

Is there something specific you're struggling with guilt about? Sometimes speaking these thoughts aloud can help us see them more clearly and with more compassion for ourselves."""

        elif any(word in message_lower for word in ['help', 'support', 'don\'t know', 'lost', 'confused']):
            return """Reaching out shows incredible strength, even when you feel lost. Grief can make everything feel uncertain and overwhelming - that's completely understandable.

There's no roadmap for grief because every person's journey is unique. What helps one person might not help another, and that's okay. The fact that you're here, seeking support, is already a meaningful step.

Some people find comfort in talking, others in creative expression, movement, or quiet reflection. What has brought you even small moments of peace or comfort in the past? We can start there and build slowly."""

        elif any(word in message_lower for word in ['miss', 'missing', 'memories', 'remember']):
            return """Missing someone is one of the most natural expressions of love. Those memories you carry are precious gifts - they're proof of the bond you shared and the impact that person had on your life.

Sometimes memories can bring comfort, and sometimes they can bring fresh waves of pain. Both responses are completely normal. Your loved one lives on in these memories, in the ways they changed you, and in the love that continues even though they're not physically here.

What's one memory that brings you comfort, even if it also brings sadness? Sometimes sharing these memories can help us feel connected to our loved ones."""

        else:
            # General supportive response
            return """Thank you for sharing with me. I can sense that you're going through something difficult right now, and I want you to know that your feelings are valid and important.

Grief is such a personal journey, and there's no right or wrong way to experience it. Some days might feel impossible, while others might surprise you with moments of peace or even joy - and both are okay.

I'm here to listen and support you through this. What's been on your heart today? Sometimes just putting our thoughts and feelings into words can help us process them a little better.

Remember, healing doesn't mean forgetting or 'getting over' your loss. It means learning to carry your love in a new way. You're stronger than you know, and you don't have to walk this path alone."""

        # Add error-specific messages
        if error_type == "rate_limit":
            return f"\n\n(I'm experiencing high demand right now, but I'm still here to support you with these thoughtful responses.)"
        elif error_type == "api_error":
            return f"\n\n(I'm having some technical difficulties, but my care for you remains constant.)"
        elif error_type == "no_api_key":
            return f"\n\n(I'm running in offline mode but still here to provide support and guidance.)"

    def get_coping_strategies(self) -> list:
        """Get a comprehensive list of coping strategies for grief"""
        return [
            {
                "category": "Emotional Coping",
                "strategies": [
                    "Allow yourself to feel emotions without judgment",
                    "Practice self-compassion and patience",
                    "Write letters to your loved one",
                    "Create a memory box or photo album",
                    "Talk to your loved one (out loud or in your mind)"
                ]
            },
            {
                "category": "Physical Wellness",
                "strategies": [
                    "Take gentle walks in nature",
                    "Practice deep breathing exercises",
                    "Maintain regular sleep schedule",
                    "Eat nourishing foods when possible",
                    "Try gentle yoga or stretching"
                ]
            },
            {
                "category": "Social Support",
                "strategies": [
                    "Connect with supportive friends or family",
                    "Join a grief support group",
                    "Consider professional counseling",
                    "Participate in online grief communities",
                    "Ask for help with daily tasks"
                ]
            },
            {
                "category": "Meaningful Activities",
                "strategies": [
                    "Engage in creative activities (art, music, writing)",
                    "Volunteer for causes important to your loved one",
                    "Plant a garden or tree in their memory",
                    "Participate in memorial events or rituals",
                    "Continue traditions that honor their memory"
                ]
            },
            {
                "category": "Mindfulness & Spirituality",
                "strategies": [
                    "Practice meditation or mindfulness",
                    "Spend time in nature",
                    "Explore spiritual or religious practices",
                    "Practice gratitude for time shared",
                    "Find meaning in your loss and growth"
                ]
            }
        ]

    def clear_conversation_history(self, user_id: str):
        """Clear conversation history for a user"""
        if user_id in self.conversation_history:
            del self.conversation_history[user_id]

    def get_api_status(self) -> dict:
        """Get the current API status"""
        return {
            "openai_configured": bool(self.client),
            "api_key_present": bool(self.api_key and self.api_key != "sk-your-openai-api-key-here"),
            "fallback_mode": not bool(self.client)
        }
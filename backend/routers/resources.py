"""
Resource hub router for books, articles, and helpful content.
"""

from fastapi import APIRouter, Depends
from typing import List, Dict

router = APIRouter()

@router.get("/books")
async def get_grief_books():
    """Get recommended grief support books"""
    books = [
        {
            "title": "The Grief Recovery Handbook",
            "author": "John W. James and Russell Friedman",
            "description": "A step-by-step program for moving beyond loss",
            "amazon_link": "https://amazon.com/grief-recovery-handbook",
            "rating": 4.5,
            "category": "Self-Help"
        },
        {
            "title": "Option B: Facing Adversity, Building Resilience, and Finding Joy",
            "author": "Sheryl Sandberg and Adam Grant",
            "description": "Building resilience in the face of adversity",
            "amazon_link": "https://amazon.com/option-b",
            "rating": 4.7,
            "category": "Resilience"
        },
        {
            "title": "It's OK That You're Not OK",
            "author": "Megan Devine",
            "description": "Meeting grief and loss in a culture that doesn't understand",
            "amazon_link": "https://amazon.com/its-ok-not-ok",
            "rating": 4.6,
            "category": "Grief Support"
        }
    ]
    return books

@router.get("/articles")
async def get_grief_articles():
    """Get helpful grief support articles"""
    articles = [
        {
            "title": "Understanding the Five Stages of Grief",
            "author": "Dr. Elisabeth Kübler-Ross",
            "url": "https://example.com/five-stages-grief",
            "summary": "Learn about denial, anger, bargaining, depression, and acceptance",
            "read_time": "8 minutes",
            "category": "Education"
        },
        {
            "title": "Coping with Grief During the Holidays",
            "author": "American Psychological Association",
            "url": "https://example.com/grief-holidays",
            "summary": "Strategies for managing grief during special occasions",
            "read_time": "6 minutes",
            "category": "Coping Strategies"
        },
        {
            "title": "When to Seek Professional Help for Grief",
            "author": "Mayo Clinic",
            "url": "https://example.com/professional-grief-help",
            "summary": "Signs that indicate you might benefit from professional support",
            "read_time": "5 minutes",
            "category": "Professional Help"
        }
    ]
    return articles

@router.get("/videos")
async def get_grief_videos():
    """Get helpful grief support videos"""
    videos = [
        {
            "title": "TED Talk: There's no shame in taking care of your mental health",
            "speaker": "Sangu Delle",
            "youtube_url": "https://youtube.com/watch?v=example1",
            "duration": "13:44",
            "description": "Breaking the stigma around mental health care",
            "category": "Mental Health"
        },
        {
            "title": "Guided Meditation for Grief and Loss",
            "speaker": "Headspace",
            "youtube_url": "https://youtube.com/watch?v=example2",
            "duration": "20:00",
            "description": "A calming meditation to help process grief",
            "category": "Meditation"
        },
        {
            "title": "How to Support Someone Who Is Grieving",
            "speaker": "What's Your Grief",
            "youtube_url": "https://youtube.com/watch?v=example3",
            "duration": "8:32",
            "description": "Practical advice for supporting grieving friends and family",
            "category": "Support"
        }
    ]
    return videos

@router.get("/hotlines")
async def get_crisis_hotlines():
    """Get crisis support hotlines and resources"""
    hotlines = [
        {
            "name": "National Suicide Prevention Lifeline",
            "phone": "988",
            "description": "24/7 crisis support for those in emotional distress",
            "website": "https://suicidepreventionlifeline.org"
        },
        {
            "name": "Crisis Text Line",
            "phone": "Text HOME to 741741",
            "description": "24/7 text-based crisis support",
            "website": "https://crisistextline.org"
        },
        {
            "name": "GriefShare",
            "phone": "1-800-395-5755",
            "description": "Grief recovery support groups",
            "website": "https://griefshare.org"
        }
    ]
    return hotlines
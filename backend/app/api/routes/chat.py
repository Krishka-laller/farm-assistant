"""Chat endpoint: conversational AI farming assistant."""

import logging
import traceback

from fastapi import APIRouter, HTTPException, Request

from app.middleware.rate_limit import limiter
from app.config import get_settings
from app.models.schemas import ChatRequest, ChatResponse
from app.models.errors import ApiError
from app.services.gemini import generate_chat_response, get_disclaimer

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post(
    "",
    response_model=ChatResponse,
    responses={
        400: {"model": ApiError},
        429: {"model": ApiError},
        500: {"model": ApiError},
        503: {"model": ApiError},
    },
)
@limiter.limit(get_settings().rate_limit_chat)
async def chat_with_assistant(request: Request, body: ChatRequest) -> ChatResponse:
    """Send a message and receive farming advice in the user's language.

    Chat history is passed from the client; nothing is stored server-side.
    """
    history = [m.model_dump() for m in body.history]
    try:
        reply = await generate_chat_response(
            message=body.message,
            lang=body.lang.value,
            history=history,
        )
        return ChatResponse(
            reply=reply,
            lang=body.lang,
            disclaimer=get_disclaimer(body.lang.value),
            sources=[],
        )
    except Exception as exc:
        print(f"\n[CHAT ROUTE ERROR] Failed processing chat: {type(exc).__name__}: {exc}\n", flush=True)
        traceback.print_exc()
        if isinstance(exc, HTTPException):
            raise exc
        raise HTTPException(
            status_code=503,
            detail=f"The AI service error: {exc}",
        )
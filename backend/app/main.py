"""FastAPI application entry point.

Configures CORS (locked to ALLOWED_ORIGINS), rate limiting via slowapi,
global error handlers, and registers all route modules. Exports the
OpenAPI spec that serves as the API contract.

Stateless design: no database, no storage of user content, no logging
of chat text or images.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.middleware.rate_limit import limiter
from app.middleware.error_handler import app_exception_handler, generic_exception_handler
from app.models.errors import AppException
from app.api.routes import chat, crop, disease, weather, mandi, fertilizer, location

settings = get_settings()

app = FastAPI(
    title="Farm Decision Assistant API",
    version="1.0.0",
    description=(
        "Backend API for the Multilingual AI Farm Decision Assistant. "
        "Provides farming advice, crop recommendations, disease identification, "
        "weather forecasts, mandi prices, and fertilizer guidance."
    ),
)

# CORS: locked to specific origins, no wildcards in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# Rate limiting via slowapi
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Global error handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)

# Register routes
app.include_router(chat.router)
app.include_router(crop.router)
app.include_router(disease.router)
app.include_router(weather.router)
app.include_router(mandi.router)
app.include_router(fertilizer.router)
app.include_router(location.router)


from fastapi.responses import RedirectResponse


@app.get("/", include_in_schema=False)
async def root() -> RedirectResponse:
    """Redirect root to API documentation."""
    return RedirectResponse(url="/docs")


@app.get("/api/health", tags=["Health"])
async def health_check() -> dict:
    """Simple health check endpoint."""
    return {"status": "ok"}


"""Global error handler that normalizes all exceptions to the API error shape."""
import logging

logger = logging.getLogger(__name__)
from fastapi import Request
from fastapi.responses import JSONResponse

from app.models.errors import ApiError, AppException, ErrorCode


async def app_exception_handler(_request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.error.model_dump(),
    )


async def generic_exception_handler(_request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled error", exc_info=exc)
    error = ApiError(
        code=ErrorCode.INTERNAL_ERROR,
        message="Something went wrong. Please try again.",
        details=None,
    )
    return JSONResponse(status_code=500, content=error.model_dump())

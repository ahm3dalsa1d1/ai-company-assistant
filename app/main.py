

from fastapi import FastAPI
from app.db.database import Base, engine
from app.routers.users import router as users_router
from app.routers.auth import router as auth_router
from app.routers.documents import router as documents_router
from app.routers.search import router as search_router
from app.routers.chat import router as chat_router
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from app.core.exceptions import (
    PermissionDeniedError,
    ResourceConflictError,
    ResourceNotFoundError
)
import app.models
from app.core.config import settings
from app.core.logging import configure_logging

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.logging import configure_logging


configure_logging()

logger = logging.getLogger(__name__)


app = FastAPI(
    title=settings.app_name,
    description="AI-powered document knowledge and retrieval API",
    version=settings.app_version
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(ResourceNotFoundError)
async def resource_not_found_handler(
    request: Request,
    exc: ResourceNotFoundError
):
    return JSONResponse(
        status_code=404,
        content={
            "detail": str(exc)
        }
    )


@app.exception_handler(PermissionDeniedError)
async def permission_denied_handler(
    request: Request,
    exc: PermissionDeniedError
):
    return JSONResponse(
        status_code=403,
        content={
            "detail": str(exc)
        }
    )


@app.exception_handler(ResourceConflictError)
async def resource_conflict_handler(
    request: Request,
    exc: ResourceConflictError
):
    return JSONResponse(
        status_code=409,
        content={
            "detail": str(exc)
        }
    )

app.include_router(users_router)
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(search_router)
app.include_router(chat_router)


@app.get("/")
def root():
    return {
        "message": "AI Knowledge API is running"
    }


@app.get(
    "/health",
    tags=["System"]
)
def health():
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "environment": settings.environment
    }
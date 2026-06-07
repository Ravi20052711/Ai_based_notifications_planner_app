from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import engine, Base
from .models import user, reminder # Explicitly import models to register them with Base.metadata
from .core.exceptions import AppException
from fastapi.responses import JSONResponse

from .routers import auth, reminders, ai, users, admin
from .services.scheduler import scheduler_service
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start scheduler
    scheduler_service.start()
    yield
    # Shutdown scheduler
    scheduler_service.shutdown()

# Create tables (for development, better to use Alembic in production)
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

@app.exception_handler(AppException)
async def app_exception_handler(request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )

app.include_router(auth.router)
app.include_router(reminders.router)
app.include_router(ai.router)
app.include_router(users.router)
app.include_router(admin.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to NotifyAI API"}

# Routers will be included here later

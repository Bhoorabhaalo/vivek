from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.live import router as live_router
from app.api.audit import router as audit_router
from app.api.auth import router as auth_router
from app.services.engine_coordinator import coordinator
from app.db.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# Add CORS to allow frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    coordinator.start()

app.include_router(live_router, prefix="/ws", tags=["live"])
app.include_router(audit_router, prefix="/api/audit", tags=["audit"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])


@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.PROJECT_NAME}

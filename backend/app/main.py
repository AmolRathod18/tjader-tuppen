from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import auth, crud, reports

settings = get_settings()
app = FastAPI(
    title="TJÄDERTUPPEN Management System API",
    version="1.0.0",
    description="Protected backend for clients, projects, employees, assignments, work entries and reports.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth.router)
app.include_router(crud.router)
app.include_router(reports.router)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}

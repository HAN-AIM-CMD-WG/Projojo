from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
from contextlib import asynccontextmanager

from exceptions.exceptions import ItemRetrievalException, UnauthorizedException
from exceptions.global_exception_handler import generic_handler

# Import routers
from routes.auth_router import router as auth_router
from routes.business_router import router as business_router
from routes.project_router import router as project_router
from routes.skill_router import router as skill_router
from routes.student_router import router as student_router
from routes.supervisor_router import router as supervisor_router
from routes.task_router import router as task_router
from routes.teacher_router import router as teacher_router

from routes.test_router import router as test_router

# Import the TypeDB connection module
from db.initDatabase import get_database

# Initialize TypeDB connection on startup and close on shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize TypeDB connection
    print("Initializing TypeDB connection...")
    Db = get_database()

    yield {}

    # Close TypeDB connection on shutdown
    print("Closing TypeDB connection...")
    Db.close()

app = FastAPI(
    title="Projojo Backend",
    description="Backend API for Projojo application",
    version="0.1.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(auth_router)
app.include_router(business_router)
app.include_router(project_router)
app.include_router(skill_router)
app.include_router(student_router)
app.include_router(supervisor_router)
app.include_router(task_router)
app.include_router(teacher_router)

app.include_router(test_router)

# Add exception handler for Custom exceptions
app.add_exception_handler(ItemRetrievalException, generic_handler)
app.add_exception_handler(UnauthorizedException, generic_handler)

# Dependency to get TypeDB connection
def get_db():
    return get_database()

app.mount("/test/image", StaticFiles(directory="static/images"), name="image")
# app.mount("/test/pdf", StaticFiles(directory="static/pdf"), name="pdf")
@app.get("/")
async def root():
    return {"message": "Welcome to Projojo Backend API"}

@app.get("/typedb/status")
async def typedb_status(db=Depends(get_db)):
    """Check TypeDB connection status"""
    try:
        # Try to get database name to verify connection
        db_name = db.name  # dit kon wel eens slagen, ook als er geen verbinding is met de Db.
        return {
            "status": "connected",
            "database": db_name,
            "server": db.address
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

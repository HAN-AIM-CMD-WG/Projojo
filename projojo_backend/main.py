from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.staticfiles import StaticFiles
import uvicorn
import logging
from contextlib import asynccontextmanager
from environs import Env

from exceptions.exceptions import ItemRetrievalException, UnauthorizedException
from exceptions.global_exception_handler import generic_handler
from auth.jwt_middleware import JWTMiddleware

# Import routers
from routes.auth_router import router as auth_router
from routes.business_router import router as business_router
from routes.invite_router import router as invite_router
from routes.project_router import router as project_router
from routes.skill_router import router as skill_router
from routes.student_router import router as student_router
from routes.supervisor_router import router as supervisor_router
from routes.task_router import router as task_router
from routes.teacher_router import router as teacher_router
from routes.user_router import router as user_router

# Import the TypeDB connection module
from db.initDatabase import get_database

# Set up logger
logger = logging.getLogger('uvicorn.error')

# Load environment variables
env = Env(expand_vars=True)
env.read_env(".env.production", recurse=True, override=True)
env.read_env(".env", recurse=True, override=True)

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
    # allow_origin_regex=r"https?://.*",  # Allows all origins with http or https
    allow_origins=["*"],  # Allows all origins
    allow_credentials=False,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Add JWT validation middleware
app.add_middleware(JWTMiddleware)

# Add session middleware (required by authlib for OAuth state)
app.add_middleware(
    SessionMiddleware,
    secret_key=env.str("SESSIONS_SECRET_KEY", "supersecretkey123456789abcdefghijklmnop")
)

@app.middleware("http")
async def print_headers(request: Request, call_next):
    logger.debug("Request headers:")
    for header, value in request.headers.items():
        logger.debug(f"  {header}: {value}")
    response = await call_next(request)
    logger.debug("Response headers:")
    for header, value in response.headers.items():
        logger.debug(f"  {header}: {value}")
    return response


# Include routers
app.include_router(auth_router)
app.include_router(business_router)
app.include_router(invite_router)
app.include_router(project_router)
app.include_router(skill_router)
app.include_router(student_router)
app.include_router(supervisor_router)
app.include_router(task_router)
app.include_router(teacher_router)
app.include_router(user_router)

# Add exception handler for Custom exceptions
app.add_exception_handler(ItemRetrievalException, generic_handler)
app.add_exception_handler(UnauthorizedException, generic_handler)

# Dependency to get TypeDB connection
def get_db():
    return get_database()

app.mount("/image", StaticFiles(directory="static/images"), name="image")
app.mount("/pdf", StaticFiles(directory="static/pdf"), name="pdf")

@app.get("/")
async def root():
    return {"message": "Welcome to Projojo Backend API"}

@app.get("/typedb/status")
async def typedb_status(db=Depends(get_db)):
    """Check TypeDB connection status"""
    if env.str("ENVIRONMENT", "none").lower() != "development":
        raise HTTPException(status_code=403, detail="Dit kan alleen in de test-omgeving")

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

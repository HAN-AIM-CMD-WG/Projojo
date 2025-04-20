from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager

# Import the TypeDB connection module
from initDatabase import get_database

# Initialize TypeDB connection on startup and close on shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize TypeDB connection
    print("Initializing TypeDB connection...")
    Db = get_database()
    
    yield Db
    
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

# Dependency to get TypeDB connection
def get_db():
    return get_database()

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
    uvicorn.run(app, host="0.0.0.0", port=8000)

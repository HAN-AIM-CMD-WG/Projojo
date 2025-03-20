# Projojo Backend

FastAPI backend service for the Projojo application.

## Setup

1. Ensure Python 3.13 is installed
2. Create virtual environment:
   ```bash
   python3.13 -m venv venv
   ```
3. Activate virtual environment:
   - On Unix or MacOS:
     ```bash
     source venv/bin/activate
     ```
   - On Windows:
     ```bash
     .\venv\Scripts\activate
     ```
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

Start the server with:
```bash
uvicorn main:app --reload
```

The API will be available at http://localhost:8000

API documentation will be available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

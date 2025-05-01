from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from .exceptions import ItemRetrievalException

async def generic_handler(request: Request, exc: Exception):
    class_name = exc.__class__.__name__
    message = getattr(exc, "message", "An error occurred.")
    return JSONResponse(
        status_code=getattr(exc, "status_code", 500),
        content={"detail": f"{class_name}: {message}"}
    )
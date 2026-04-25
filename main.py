import logging
from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

logging.basicConfig(level=logging.INFO)
app = FastAPI(title="FreeLanceOS")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

from src.api.routes import get_jobs, health_check, classify_jobs

@app.get("/jobs")
async def jobs_endpoint(request: Request):
    return await get_jobs(request)

@app.get("/classify")
async def classify_endpoint(request: Request):
    return await classify_jobs(request)

@app.get("/health")
async def health_endpoint():
    return await health_check()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

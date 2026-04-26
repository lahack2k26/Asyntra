import logging
from fastapi import FastAPI, Request
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

logging.basicConfig(level=logging.INFO)
app = FastAPI(title="Asyntra")
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://frontend-phi-green-43.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_methods=["*"],
    allow_headers=["*"],
)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

from src.api.routes import get_jobs, health_check, refresh_invoices, clear_all_caches, debug_scrape

@app.get("/jobs")
async def jobs_endpoint(request: Request):
    return await get_jobs(request)

@app.get("/health")
async def health_endpoint():
    return await health_check()

@app.post("/cache/clear-invoice")
async def clear_invoice_endpoint():
    return await refresh_invoices()

@app.post("/cache/clear-all")
async def clear_all_endpoint():
    return await clear_all_caches()

@app.get("/debug/scrape")
async def debug_scrape_endpoint():
    return await debug_scrape()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

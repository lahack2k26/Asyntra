# FreeLanceOS

AI-powered operating system for software development freelancers. Automatically scrapes job listings, classifies them by client using LLM agents, and generates budget and timeline estimates — surfaced on a live dashboard.

## Architecture

```
Job Sources (Upwork, Fiverr, IndiehHackers, Toptal)
        ↓
  Firecrawl  —  web scraping
        ↓
  JobParserAgent  —  raw markdown → structured jobs  [ASI:1]
        ↓
  InboxAgent  —  filter · group by client · enrich requirements  [ASI:1]
        ↓
  InvoiceAgent  —  budget & timeline estimates  [ASI:1]
        ↓
  Upstash Redis  —  30 min TTL cache
        ↓
  FastAPI  —  /jobs  /health
        ↓
  Next.js Dashboard
```

## Setup

**Backend**
```bash
git clone <repo-url>
cd FreeLanceOS
pip install -r requirements.txt
cp .env.example .env   # fill in your keys
python main.py         # runs on http://localhost:8000
```

**Frontend**
```bash
cd frontend
npm install
BACKEND_URL=http://localhost:8000 npm run dev   # runs on http://localhost:3000
```

**Environment variables**

| Variable | Description |
|---|---|
| `FIRECRAWL_API_KEY` | Firecrawl web scraping API |
| `ASI_ONE_API_KEY` | ASI:1 LLM for all agents |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token |

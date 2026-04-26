# Asyntra

AI-powered operating system for software development freelancers. Automatically scrapes job listings, classifies them by client using LLM agents, and generates budget and timeline estimates — surfaced on a live dashboard.

## Features

- **Automated Job Scraping** — Pulls live listings from Upwork, Fiverr, IndieHackers, and Toptal via Firecrawl
- **LLM Job Parsing** — Converts raw scraped markdown into structured job objects with category, complexity, urgency, and budget fields
- **Client Inbox & Classification** — Groups jobs by client/company, enriches each project with detailed functional and non-functional requirements using an AI agent
- **Invoice Generation** — Automatically estimates budget ranges and timelines for every project using a dedicated invoicing agent
- **Gmail Integration** — Scans your inbox for inbound freelance opportunities and feeds them through the same pipeline
- **Redis Caching** — All three pipeline stages are individually cached in Upstash Redis with a 30-minute TTL to avoid redundant LLM calls
- **Live Dashboard** — React frontend with a pipeline view (active projects + invoices) and a leads view (classified companies and requirements)
- **FastAPI Backend** — Single `/jobs` endpoint orchestrates the full scrape → parse → classify → invoice pipeline with structured logging at every stage

## Architecture

```
  Client (Dashboard / curl)
        ↓
  FastAPI  —  GET /jobs  GET /health
        ↓
  Upstash Redis  —  30 min TTL cache (hit → return early)
        ↓ (cache miss)
  Firecrawl  —  web scraping (Upwork, Fiverr, IndiehHackers, Toptal)
              ↓
  JobParserAgent  —  raw markdown → structured jobs  [ASI:1]
              ↓
  InboxAgent  —  group by client · enrich requirements  [ASI:1]
              ↓
  InvoiceAgent  —  budget & timeline estimates  [ASI:1]
              ↓
  Upstash Redis  —  cache all stages
              ↓
  JSON response → Vite / React Dashboard
```

## Setup

**Backend**
```bash
git clone <repo-url>
cd Asyntra
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

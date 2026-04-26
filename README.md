# Asyntra

AI-powered operating system for software development freelancers. Automatically scrapes job listings, classifies them by client using LLM agents, and generates budget and timeline estimates which are surfaced on a live dashboard.

<img width="1024" height="572" alt="image" src="https://github.com/user-attachments/assets/5503a4dd-9518-4ac3-bb72-6d79be70de98" />


> **Image disclaimer:** The banner above was generated using an AI image generation
> tool for presentation purposes only.

## Features

- **Automated Job Scraping** — Pulls live listings from multiple websites via Firecrawl
- **LLM Job Parsing** — Converts raw scraped markdown into structured job objects with category, complexity, urgency, and budget fields
- **Client Inbox & Classification** — Groups jobs by client/company, enriches each project with detailed functional and non-functional requirements using an AI agent
- **Invoice Generation** — Automatically estimates budget ranges and timelines for every project using a dedicated invoicing agent
- **Gmail Integration** — Scans your inbox for inbound freelance opportunities and feeds them through the same pipeline
- **Redis Caching** — All three pipeline stages are individually cached in Upstash Redis with a 30-minute TTL to avoid redundant LLM calls
- **Live Dashboard** — React frontend with a pipeline view (active projects + invoices) and a leads view (classified companies and requirements)
- **FastAPI Backend** — Single `/jobs` endpoint orchestrates the full scrape → parse → classify → invoice pipeline with structured logging at every stage

## Architecture
<img width="567" height="851" center alt="image" src="https://github.com/user-attachments/assets/077ac5cb-834a-4933-945f-39dc62b17172" />


## Setup

**Backend**
```bash
git clone https://github.com/lahack2k26/Asyntra.git
cd Asyntra
pip install -r requirements.txt
uvicorn main:app --reload --port 8000        # runs on http://localhost:8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev   # runs on http://localhost:3000
```

**Environment variables**

| Variable | Description |
|---|---|
| `FIRECRAWL_API_KEY` | Firecrawl web scraping API |
| `ASI_ONE_API_KEY` | ASI:1 LLM for all agents |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis auth token |

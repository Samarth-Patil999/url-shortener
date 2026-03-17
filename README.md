# snip. — Distributed URL Shortener

Full-stack URL shortener with React frontend, Node.js backend, MySQL, Redis.

## Features

- URL shortening with Base62 encoding (collision-free)
- Custom slugs (logged-in users)
- URL expiry (time-based)
- QR code generation + download
- Click analytics with 30-day chart
- User auth (JWT)
- Dashboard — manage all your URLs
- Redis caching with thundering herd protection
- Distributed rate limiting (Redis-based, works across servers)
- Async analytics worker (redirect latency unaffected)
- Nginx load balancer (3 app server instances)
- Health check endpoint

## One-command setup

```bash
docker-compose up --build
```

- Frontend → http://localhost:3000
- API → http://localhost:80
- Health → http://localhost:80/health

## Manual setup

```bash
# MySQL
mysql -u root -p < backend/schema.sql

# Backend
cd backend && cp .env.example .env
# Edit .env with your credentials
npm install && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm start
```

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Register |
| POST | /api/auth/login | No | Login → JWT |
| POST | /api/shorten | Optional | Shorten URL |
| GET | /:code | No | Redirect |
| GET | /api/stats/:code | No | Click stats + chart |
| GET | /api/qr/:code | No | QR code PNG |
| GET | /api/my-urls | Yes | User's URLs |
| GET | /health | No | Health check |

## Architecture & Design Decisions

| Decision | Choice | Why |
|---|---|---|
| Hash | Base62 on auto-increment ID | Zero collision guaranteed |
| Cache | Redis + mutex lock | Prevents thundering herd |
| Rate limit | Redis counter | Works across all app servers |
| Analytics | Async batch worker | Redirect stays <5ms |
| Auth | JWT (stateless) | No session storage needed |
| Load balancer | Nginx round-robin | Battle-tested, simple |

## Capacity Estimates

- 100M redirects/day → ~1,160 req/sec
- 7-char Base62 → 3.5 trillion unique URLs
- Redis hit rate ~95% → MySQL stays low load

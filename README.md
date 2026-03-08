# Fitness AI

Self-hosted calorie and nutrition tracker powered by AI. Describe or photograph your food, get instant macro estimates, and track daily intake against configurable goals.

## Quick Start

```bash
# 1. Clone and configure
git clone https://github.com/toshayx/fitness-ai-webapp.git
cd fitness-ai-webapp
cp .env.example .env
# Edit .env with your OpenRouter API key and a random JWT secret

# 2. Run
docker compose up -d --build

# 3. Open http://your-host:8090
```

## Features

- Text or image-based food analysis via OpenRouter (Claude, Gemini, GPT-4o)
- Selectable AI model per request
- Daily macro tracking: calories, fats, saturated fats, carbs, proteins, sodium
- Configurable daily goals with color-coded progress bars
- History view with expandable daily breakdowns
- Simple JWT auth (max 2 users)
- SQLite database (zero maintenance)

## Configuration

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key |
| `JWT_SECRET` | Random string for signing JWT tokens |

## Architecture

- **Frontend**: React 19 + Vite + Tailwind CSS 4
- **Backend**: Python FastAPI + SQLAlchemy (async SQLite)
- **AI**: OpenRouter API (multi-model)
- **Deployment**: Docker Compose (2 containers + 1 volume)

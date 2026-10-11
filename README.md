# AI Knowledge Assistant

A full-stack AI-powered knowledge base that lets authenticated users ask questions about company documents and receive answers grounded in the information they are authorized to access.

The project combines a FastAPI backend, retrieval-augmented generation (RAG), role-based authorization, persistent chat history, streaming AI responses, a React + TypeScript frontend, Alembic migrations, automated tests, and Dockerized deployment.

## Features

- JWT-based authentication
- Two-level role-based access control
- PDF and TXT document uploads
- Document text extraction and chunking
- Embedding generation through OpenRouter
- Semantic search using cosine similarity
- Retrieval-augmented generation (RAG)
- Access-aware retrieval so users only search permitted documents
- Persistent conversations and message history
- Streaming AI responses with Server-Sent Events (SSE)
- Admin document management
- Conversation deletion with ownership checks
- Alembic database migrations
- Automated authentication and authorization tests
- Dockerized backend with persistent SQLite storage
- Responsive React + TypeScript frontend styled with Tailwind CSS

## Tech Stack

### Backend

- Python 3.12
- FastAPI
- SQLAlchemy
- Alembic
- Pydantic Settings
- PyJWT
- pwdlib / Argon2
- pypdf
- OpenAI Python SDK
- OpenRouter
- SQLite
- Pytest

### AI / RAG

- Embeddings: `openai/text-embedding-3-small`
- LLM: `deepseek/deepseek-v4.1-flash`
- Cosine-similarity semantic retrieval
- Configurable relevance threshold
- Retrieval filtered by user access level before context is sent to the LLM

### Frontend

- React
- TypeScript
- Vite
- React Router
- Tailwind CSS v4
- Lucide React

### Deployment

- Docker
- Docker Compose
- Persistent Docker volume for SQLite
- Alembic migrations executed automatically when the API container starts

## Architecture

```text
Browser
  |
  v
React + TypeScript Frontend
  |
  | HTTP / SSE
  v
FastAPI Backend
  |
  +--> JWT Authentication
  |
  +--> Role-Based Authorization
  |
  +--> Document Upload
  |      |
  |      +--> Text Extraction
  |      +--> Chunking
  |      +--> Embeddings
  |
  +--> Semantic Search
  |      |
  |      +--> Access-Level Filtering
  |      +--> Cosine Similarity
  |
  +--> RAG Chat
  |      |
  |      +--> Conversation History
  |      +--> OpenRouter LLM
  |      +--> Streaming SSE Response
  |
  v
SQLite Database
```

## Authorization Model

The application currently uses two access levels:

| Level | Role | Permissions |
| --- | --- | --- |
| 1 | Standard user | Chat, search, and access Level 1 documents |
| 2 | Administrator | All Level 1 permissions plus restricted documents, user listing, document upload, and document deletion |

New accounts are created as Level 1 users by default. Users cannot choose their own access level during registration.

Authorization is enforced by the backend. Frontend route protection is only used for user experience and is not treated as a security boundary.

## RAG Flow

When a user asks a question:

1. The API authenticates the user.
2. The question is converted into an embedding.
3. The backend searches stored chunk embeddings.
4. Documents above the user's access level are filtered out before retrieval.
5. Relevant chunks above the configured similarity threshold are selected.
6. The retrieved context and recent conversation history are sent to the LLM.
7. The response is streamed back to the frontend.
8. Both user and assistant messages are persisted in the database.

If no sufficiently relevant context is found, the backend returns a controlled response instead of asking the LLM to answer from outside knowledge.

## Project Structure

```text
ai-knowledge-api/
├── app/
│   ├── core/
│   ├── db/
│   ├── dependencies/
│   ├── models/
│   ├── routers/
│   ├── schemas/
│   ├── services/
│   └── main.py
├── alembic/
│   └── versions/
├── tests/
├── ai-knowledge-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── alembic.ini
├── Dockerfile
├── docker-compose.yml
├── entrypoint.sh
├── requirements.txt
└── README.md
```

## Environment Variables

Create a `.env` file in the backend project root.

```env
APP_NAME=AI Knowledge API
APP_VERSION=1.0.0
ENVIRONMENT=development

DATABASE_URL=sqlite:///./knowledge.db

SECRET_KEY=replace_with_a_secure_secret
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

OPENROUTER_API_KEY=replace_with_your_openrouter_key

EMBEDDING_MODEL=openai/text-embedding-3-small
LLM_MODEL=deepseek/deepseek-v4.1-flash
RELEVANCE_THRESHOLD=0.45

CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
LOG_LEVEL=INFO
```

Never commit the real `.env` file or API keys to source control.

For the frontend, create `ai-knowledge-frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

## Running the Backend Locally

From the backend project root:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

Health endpoint:

```text
http://127.0.0.1:8000/health
```

## Running the Frontend

From the frontend directory:

```bash
cd ai-knowledge-frontend
npm install
npm run dev
```

The frontend will be available at:

```text
http://localhost:5173
```

## Running With Docker

The backend is Dockerized and uses a named volume to persist the SQLite database.

Build and start the API:

```bash
docker compose up --build
```

Run in the background:

```bash
docker compose up -d
```

View logs:

```bash
docker compose logs -f
```

Stop the container while keeping the database volume:

```bash
docker compose down
```

> `docker compose down -v` also deletes the database volume and should only be used when a full reset is intended.

The container startup process runs:

```text
alembic upgrade head
        |
        v
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Database Migrations

The project uses Alembic for schema management.

After modifying SQLAlchemy models:

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

Check the current revision:

```bash
alembic current
```

## Tests

Run the test suite from the backend root:

```bash
python -m pytest -v
```

The current test suite covers areas including:

- Registration
- Duplicate-user handling
- Login
- Invalid credentials
- Protected endpoints
- Current-user retrieval
- Level 1 authorization restrictions
- Level 2 authorization
- Document deletion permissions
- Conversation ownership

The tests use an isolated in-memory SQLite database and do not modify the development database.

## Main API Routes

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/users/` | Register a user |
| `POST` | `/auth/login` | Authenticate and receive a JWT |
| `GET` | `/users/me` | Get the current user |
| `GET` | `/users/` | List users — Level 2 only |
| `GET` | `/documents/` | List accessible documents |
| `POST` | `/documents/upload` | Upload a PDF/TXT — Level 2 only |
| `DELETE` | `/documents/{id}` | Delete a document — Level 2 only |
| `POST` | `/search/` | Semantic document search |
| `POST` | `/chat/` | Standard RAG chat response |
| `POST` | `/chat/stream` | Streaming RAG response |
| `GET` | `/chat/conversations` | List current user's conversations |
| `GET` | `/chat/conversations/{id}` | Load a conversation |
| `DELETE` | `/chat/conversations/{id}` | Delete an owned conversation |
| `GET` | `/health` | API health check |

## Security Notes

- Passwords are hashed with Argon2 and are never stored in plain text.
- JWT payloads identify the user; authorization levels are loaded from the database.
- Registration does not allow clients to assign themselves administrator access.
- Restricted documents are filtered before semantic retrieval.
- Conversation queries are scoped to the authenticated owner.
- Document text is treated as data, not trusted instructions, in the LLM prompt.
- Secrets and API keys are supplied through environment variables and excluded from Docker images and Git.

## Current Limitations

- SQLite is used for the current project scope. A larger production deployment would typically move to PostgreSQL.
- Embeddings are currently stored as JSON text and compared in application code rather than using a vector database.
- Scanned PDFs are not supported because OCR is not implemented.
- The project currently uses two authorization levels instead of a larger RBAC permission model.
- Authentication uses bearer tokens stored by the frontend rather than HTTP-only cookie sessions.

## Possible Future Improvements

- PostgreSQL with `pgvector`
- OCR support for scanned PDFs
- Refresh tokens or HTTP-only cookie authentication
- More granular roles and permissions
- Document metadata and search filters
- Source citations inside generated answers
- Background document-processing jobs
- Rate limiting
- Audit logging
- Automated CI/CD
- Dockerization of the frontend and reverse-proxy deployment

## Purpose

This project was built as a practical full-stack exercise in backend engineering and AI integration. Its focus is not simply calling an LLM API, but building the surrounding system required to use AI safely and meaningfully with private application data: authentication, authorization, retrieval, persistence, migrations, testing, streaming, and deployment.

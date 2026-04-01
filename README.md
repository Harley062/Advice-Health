# To-Do List Application

A full-stack task management application built with Django REST Framework, React (Vite), and PostgreSQL. Supports user authentication, task CRUD with filtering/pagination, task sharing between users, category management, and an external joke API integration.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                  Docker Compose                      │
│                                                     │
│  ┌──────────┐    ┌──────────────┐   ┌───────────┐  │
│  │ Frontend │───▶│   Backend    │──▶│ PostgreSQL│  │
│  │  React   │    │    Django    │   │  (port    │  │
│  │  :3000   │    │  DRF :8000   │   │   5432)   │  │
│  └──────────┘    └──────────────┘   └───────────┘  │
└─────────────────────────────────────────────────────┘
```

- **Frontend**: React 18 + Vite, Tailwind CSS, Axios, React Query, React Router v6
- **Backend**: Django 4.2 + Django REST Framework, SimpleJWT for auth, django-filter for filtering
- **Database**: PostgreSQL 15
- **Auth**: JWT tokens (access + refresh) — stored in `localStorage`
- **Containerization**: Docker + Docker Compose

---

## How to Run with Docker Compose

### Prerequisites
- Docker Desktop installed and running

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd <repo-directory>

# 2. Start all services
docker compose up --build

# 3. The app is now available at:
#    Frontend: http://localhost:3000
#    Backend API: http://localhost:8000/api
#    Django Admin: http://localhost:8000/admin
```

To run in the background:
```bash
docker compose up --build -d
```

To stop:
```bash
docker compose down
```

To tear down including the database volume:
```bash
docker compose down -v
```

---

## How to Run Tests

### Backend (pytest)

```bash
# With Docker Compose running:
docker compose exec backend pytest --tb=short -v

# Or locally (requires a running PostgreSQL instance):
cd backend
pip install -r requirements.txt
DB_HOST=localhost DB_NAME=todoapp_test DB_USER=postgres DB_PASSWORD=postgres \
  pytest --tb=short -v
```

### Frontend Selenium Tests

The Selenium tests require:
1. The full stack running (`docker compose up`)
2. Google Chrome installed
3. Python dependencies installed

```bash
cd frontend/tests
pip install selenium webdriver-manager
python selenium_tests.py
```

### Frontend Lint

```bash
cd frontend
npm install
npm run lint
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register a new user |
| POST | `/api/auth/login/` | Obtain JWT access + refresh tokens |
| POST | `/api/auth/refresh/` | Refresh the access token |
| GET | `/api/auth/me/` | Get current authenticated user |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks/` | List tasks (owned + shared) — paginated |
| POST | `/api/tasks/` | Create a new task |
| GET | `/api/tasks/{id}/` | Retrieve a task |
| PUT/PATCH | `/api/tasks/{id}/` | Update a task (owner only) |
| DELETE | `/api/tasks/{id}/` | Delete a task (owner only) |
| POST | `/api/tasks/{id}/share/` | Share task with a user by email |
| POST | `/api/tasks/{id}/toggle/` | Toggle completed status |

#### Task Filter Parameters
- `completed=true|false` — filter by completion status
- `category=<id>` — filter by category ID
- `due_date_from=YYYY-MM-DD` — filter tasks due on or after this date
- `due_date_to=YYYY-MM-DD` — filter tasks due on or before this date
- `page=<n>` — page number (10 items per page)

### Categories
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories/` | List user's categories |
| POST | `/api/categories/` | Create a category |
| GET | `/api/categories/{id}/` | Retrieve a category |
| PUT/PATCH | `/api/categories/{id}/` | Update a category |
| DELETE | `/api/categories/{id}/` | Delete a category |

### External
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/external/joke/` | Fetch a random joke from external API |

---

## Design Decisions

### Authentication
JWT with short-lived access tokens (60 min) and longer-lived refresh tokens (7 days). The React API service automatically refreshes the access token on 401 responses using a request queue to avoid race conditions.

### Task Visibility
A user can see tasks they own **or** tasks that have been shared with them. Only the owner can edit, delete, or share a task; shared users have read-only access.

### Custom User Model
A custom `User` model extending `AbstractUser` uses `email` as the `USERNAME_FIELD`. This makes email-based login natural and avoids migrating later.

### Filtering
`django-filter` provides declarative filter classes. The `TaskFilter` supports boolean `completed`, FK `category`, and date range filters (`due_date_from`/`due_date_to`).

### Frontend State
`@tanstack/react-query` manages server state (caching, background refetching, invalidation). Context (`AuthContext`) manages auth state globally.

### Tailwind CSS
Utility-first CSS with no custom CSS files needed beyond the Tailwind directives in `index.css`. Responsive design works down to mobile widths.

### External API Integration
The `/api/external/joke/` endpoint acts as a backend proxy to `https://official-joke-api.appspot.com/random_joke`, avoiding CORS issues on the frontend.

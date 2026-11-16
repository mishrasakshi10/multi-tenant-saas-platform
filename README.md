# Multi-Tenant SaaS Project Management Platform

A full-stack SaaS project management application inspired by tools like Jira. It enables teams to manage workspaces, projects, tasks, sprints, and collaboration through a centralized platform with tenant-based data isolation.

## Live Application

- **Frontend:** https://multi-tenant-saas-platform-xi.vercel.app
- **Backend API:** https://multi-tenant-saas-platform-n35l.onrender.com
- **GitHub Repository:** https://github.com/mishrasakshi10/multi-tenant-saas-platform

> Note: The backend root URL may return 404 because the application exposes its functionality through API routes.

## Features

- User registration and JWT authentication
- Multi-tenant workspaces and membership management
- Project creation and management
- Kanban boards and issue tracking
- Sprint management
- Issue comments and attachments
- Activity logs and notifications
- Workspace-based subscription and billing integration
- Background task and due-date reminder integration
- RESTful API architecture
- Docker-based local development
- Automated backend and frontend checks using GitHub Actions

## Application Preview

### Dashboard

![Dashboard Preview](docs/dashboard.png)

## Tech Stack

### Backend
- Python 3.12+
- Django
- Django REST Framework
- PostgreSQL
- Celery integration
- Redis integration
- Stripe API integration

### Frontend
- React 19
- Vite
- JavaScript
- HTML
- CSS

### Tools and Services
- Neon PostgreSQL
- Upstash Redis integration
- Docker and Docker Compose
- Git and GitHub
- GitHub Actions
- Render
- Vercel

## Project Structure

```text
multi-tenant-saas-platform/
├── backend/
│   ├── accounts/
│   ├── billing/
│   ├── config/
│   ├── projects/
│   ├── workspaces/
│   ├── Dockerfile
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
│
├── docs/
│   ├── dashboard.png
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_DESIGN.md
│   ├── DEPLOYMENT.md
│   └── TESTING.md
│
├── .github/
│   └── workflows/
├── docker-compose.yml
└── README.md
```

## Documentation

Detailed project documentation is available in the `docs/` directory:

| Document | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System architecture and components |
| [API Documentation](docs/API_DOCUMENTATION.md) | API endpoints and permissions |
| [Database Design](docs/DATABASE_DESIGN.md) | Database models and relationships |
| [Deployment Guide](docs/DEPLOYMENT.md) | Hosting and deployment configuration |
| [Testing Documentation](docs/TESTING.md) | Testing approach and results |

## Local Installation and Setup

### Prerequisites

- Python 3.12+
- Node.js 22+
- npm
- PostgreSQL database or Neon PostgreSQL
- Git
- Docker Desktop (optional)

### 1. Clone the Repository

```bash
git clone https://github.com/mishrasakshi10/multi-tenant-saas-platform.git
cd multi-tenant-saas-platform
```

### 2. Backend Setup

Navigate to the backend directory:

```powershell
cd backend
python -m venv venv
```

Activate the virtual environment:

```powershell
.\venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r requirements.txt
```

Create a `.env` file inside the `backend` directory.

Configure the required environment variables:

```env
DJANGO_SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=your-database-url
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173
```

Optional Stripe configuration:

```env
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
STRIPE_SUCCESS_URL=
STRIPE_CANCEL_URL=
```

Use your own database connection string and secret credentials. Never commit real credentials or secret keys to GitHub.

Run database migrations:

```powershell
python manage.py migrate
```

Create an administrator account:

```powershell
python manage.py createsuperuser
```

Start the backend development server:

```powershell
python manage.py runserver
```

Backend URL:

http://127.0.0.1:8000/

### 3. Frontend Setup

Open another terminal from the project root:

```powershell
cd frontend
npm install
```

Create a frontend `.env` file if required:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/
```

Start the frontend development server:

```powershell
npm run dev
```

Frontend URL:

http://localhost:5173/

## Docker Setup

Docker and Docker Compose can be used for local development.

Run from the project root:

```bash
docker compose up --build -d
```

Check running containers:

```bash
docker compose ps
```

Stop the containers:

```bash
docker compose down
```

## Running Tests

### Backend Tests

From the backend directory:

```powershell
python manage.py test accounts workspaces projects billing --settings=config.settings_test
```

The backend test suite previously completed with 23 passing tests and no failures.

### Frontend Lint

From the frontend directory:

```bash
npm run lint
```

### Frontend Production Build

```bash
npm run build
```

Frontend linting and production build checks completed successfully during development.

## Background Tasks

The project includes Celery integration for asynchronous background processing, including due-date reminder functionality.

A separately configured Celery worker, Celery Beat scheduler, and Redis service are required for background and scheduled tasks to execute.

## Billing Integration

The application includes Stripe subscription checkout and webhook integration.

Live payment processing requires:

- Valid Stripe API credentials
- A configured Stripe Price ID
- A configured webhook endpoint and signing secret

The billing integration can also be tested using mocked API responses without live payment credentials.

## CI/CD

GitHub Actions is configured to automate:

- Backend Django system checks
- Backend automated tests
- Frontend ESLint checks
- Frontend production builds

Backend CI tests use SQLite test settings.

## Database

The application uses PostgreSQL and supports Neon PostgreSQL through environment-based database configuration.

The application uses workspace-based data scoping to separate tenant data.

## Deployment Notes

- Frontend is deployed on Vercel.
- Backend is deployed on Render.
- PostgreSQL database is hosted on Neon.
- Render Free services may sleep after inactivity, causing delays on the first request.
- Uploaded media files on the Render Free filesystem are not guaranteed to persist across redeployments.
- Production email delivery requires an external email service.
- Live Stripe payments require additional credentials and webhook configuration.
- Background task execution requires a separately configured worker and Redis service.

## Author

**Sakshi Mishra**

GitHub: https://github.com/mishrasakshi10

---

*Developed as part of a full-stack software development internship project.*
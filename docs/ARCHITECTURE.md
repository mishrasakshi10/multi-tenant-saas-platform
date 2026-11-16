# System Architecture

## Project Overview

The Multi-Tenant SaaS Project Management Platform uses React for the frontend, Django REST Framework for the backend, and PostgreSQL for data storage.

## Architecture Flow

User -> React Frontend (Vercel) -> Django REST API (Render) -> PostgreSQL Database (Neon)

## Frontend
- React 19
- JavaScript
- Vite

## Backend
- Python
- Django
- Django REST Framework
- JWT Authentication

## Database
- PostgreSQL
- Neon

## Deployment
- Frontend: Vercel
- Backend: Render
- Database: Neon
- Source Code: GitHub

## Security
- JWT-based authentication
- Workspace membership validation
- Role-based permissions
- Workspace-level data isolation

## Background Processing

Celery and Redis integration is included in the project code. A separately configured worker and Redis service are required to run background tasks.

# Deployment Guide

## Project Deployment

The application is deployed using Vercel, Render, and Neon.

## Frontend Deployment - Vercel

- Platform: Vercel
- Framework: React with Vite
- Root Directory: frontend
- Environment Variable: VITE_API_BASE_URL

Production URL:
https://multi-tenant-saas-platform-xi.vercel.app

## Backend Deployment - Render

- Platform: Render
- Framework: Django REST Framework
- Root Directory: backend
- Deployment: Docker

Production API URL:
https://multi-tenant-saas-platform-n35l.onrender.com

## Database - Neon

- Database: PostgreSQL
- Hosting: Neon
- Connection: DATABASE_URL environment variable

## Required Environment Variables

Configure the following variables in the hosting dashboard. Never commit secret values to GitHub.

- DJANGO_SECRET_KEY
- DEBUG
- ALLOWED_HOSTS
- DATABASE_URL
- CORS_ALLOWED_ORIGINS
- CSRF_TRUSTED_ORIGINS
- VITE_API_BASE_URL

Stripe-related variables are required only when enabling live billing:

- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID
- STRIPE_SUCCESS_URL
- STRIPE_CANCEL_URL

## Important Deployment Notes

- Render Free services may sleep after inactivity, causing a delay on the first request.
- Uploaded media files on the Render Free filesystem are not guaranteed to persist across redeployments.
- Production email delivery requires a configured email service.
- Live Stripe payments require valid Stripe credentials and webhook configuration.
- Background jobs require a separately configured Celery worker and Redis service.

## Source Code

GitHub Repository:
https://github.com/mishrasakshi10/multi-tenant-saas-platform

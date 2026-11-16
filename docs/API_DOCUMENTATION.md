# API Documentation

## Overview

The backend provides REST APIs built with Django REST Framework.

Base URL (local):

http://127.0.0.1:8000/api/

Production backend:

https://multi-tenant-saas-platform-n35l.onrender.com

## Authentication

The application uses JWT authentication through Django REST Framework SimpleJWT.

### Token Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register a new user |
| POST | `/api/auth/token/` | Obtain access and refresh tokens |
| POST | `/api/auth/token/refresh/` | Refresh an access token |
| POST | `/api/auth/logout/` | Blacklist a refresh token |

Protected endpoints require:

`Authorization: Bearer <access_token>`

Token configuration:

- Access token lifetime: 30 minutes
- Refresh token lifetime: 1 day
- Refresh token rotation: Enabled
- Token blacklist after rotation: Enabled

## Workspace APIs

Base path: `/api/workspaces/`

| Method | Endpoint | Description |
|---|---|---|
| GET, POST | `/api/workspaces/` | List accessible workspaces or create a workspace |
| GET, PUT, PATCH, DELETE | `/api/workspaces/{id}/` | Retrieve, update or delete a workspace |
| GET, POST | `/api/workspaces/{workspace_id}/members/` | List or add workspace members |
| GET, PUT, PATCH, DELETE | `/api/workspaces/{workspace_id}/members/{id}/` | Retrieve or manage a membership |

Workspace access is restricted to members. Workspace updates and deletion require workspace administrator permissions. Membership management has additional role restrictions, including owner-only operations.

## Project APIs

Base path: `/api/projects/`

### Projects

| Method | Endpoint | Description |
|---|---|---|
| GET, POST | `/api/projects/` | List or create projects |
| GET, PUT, PATCH, DELETE | `/api/projects/{id}/` | Retrieve, update or delete a project |

### Boards

| Method | Endpoint | Description |
|---|---|---|
| GET, POST | `/api/projects/boards/` | List or create boards |
| GET, PUT, PATCH, DELETE | `/api/projects/boards/{id}/` | Retrieve, update or delete a board |

### Sprints

| Method | Endpoint | Description |
|---|---|---|
| GET, POST | `/api/projects/sprints/` | List or create sprints |
| GET, PUT, PATCH, DELETE | `/api/projects/sprints/{id}/` | Retrieve, update or delete a sprint |

### Issues

| Method | Endpoint | Description |
|---|---|---|
| GET, POST | `/api/projects/issues/` | List or create issues |
| GET, PUT, PATCH, DELETE | `/api/projects/issues/{id}/` | Retrieve, update or delete an issue |

### Comments

| Method | Endpoint | Description |
|---|---|---|
| GET, POST | `/api/projects/comments/` | List or create issue comments |
| GET, PUT, PATCH, DELETE | `/api/projects/comments/{id}/` | Retrieve, update or delete a comment |

### Attachments

| Method | Endpoint | Description |
|---|---|---|
| GET, POST | `/api/projects/attachments/` | List or upload issue attachments |
| GET, PUT, PATCH, DELETE | `/api/projects/attachments/{id}/` | Retrieve, update or delete an attachment |

### Activities

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/activities/` | List issue activity records |

Optional query parameter:

`issue_id` — filter activities by issue.

### Notifications

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects/notifications/` | List notifications for the authenticated user |
| PATCH | `/api/projects/notifications/{id}/` | Update an owned notification |

Users can access project data only within workspaces where they are members. Detail updates and deletions require workspace administrator permissions. Activity and notification records are restricted to authorized users.

## Billing APIs

Base path: `/api/billing/`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/billing/workspaces/{workspace_id}/checkout/` | Create a Stripe Checkout session |
| GET | `/api/billing/workspaces/{workspace_id}/subscription/` | Retrieve workspace subscription |
| POST | `/api/billing/webhook/` | Receive Stripe webhook events |

### Billing Access

- Checkout requires authentication and workspace ownership.
- Subscription retrieval requires authenticated workspace membership.
- Stripe webhook requests are verified using the configured webhook signing secret.
- Checkout requires valid Stripe configuration.

## Common HTTP Status Codes

| Status | Meaning |
|---|---|
| 200 | Request successful |
| 201 | Resource created |
| 400 | Invalid request data |
| 401 | Authentication required or invalid token |
| 403 | Permission denied |
| 404 | Resource not found |
| 500 | Internal server error |
| 503 | Required service configuration unavailable |

Actual response codes depend on the endpoint and request.

## Notes

- All protected API endpoints use JWT authentication.
- The global default permission is `IsAuthenticated`; individual endpoints can override it.
- Users should only access resources belonging to workspaces where they have membership.
- Stripe checkout and webhook processing require valid Stripe configuration.

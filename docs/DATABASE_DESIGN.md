# Database Design

## Overview

The Multi-Tenant SaaS Project Management Platform uses PostgreSQL as its relational database.

The application follows a shared database and shared schema multi-tenancy approach. Multiple workspaces share the same database tables, while workspace relationships and membership-based access control keep workspace data separated.

## 1. Workspace

Stores workspace information.

| Field | Description |
|---|---|
| id | Primary key |
| name | Workspace name |
| slug | Unique workspace slug |
| created_by | User who created the workspace |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

## 2. Membership

Connects users with workspaces.

| Field | Description |
|---|---|
| id | Primary key |
| workspace | Related workspace |
| user | Related user |
| role | OWNER, ADMIN or MEMBER |
| joined_at | Membership creation timestamp |

A unique constraint prevents the same user from joining the same workspace more than once.

## 3. Project

Stores projects inside workspaces.

| Field | Description |
|---|---|
| id | Primary key |
| workspace | Related workspace |
| name | Project name |
| key | Project key |
| description | Project description |
| status | Planning, Active, Completed or Archived |
| created_by | Project creator |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

Project keys must be unique within a workspace.

## 4. Board

Stores project boards.

| Field | Description |
|---|---|
| id | Primary key |
| project | Related project |
| name | Board name |
| description | Board description |
| is_default | Indicates the default board |
| created_by | Board creator |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

Board names must be unique within a project.

## 5. Sprint

Stores project sprint information.

| Field | Description |
|---|---|
| id | Primary key |
| project | Related project |
| name | Sprint name |
| goal | Sprint goal |
| start_date | Sprint start date |
| end_date | Sprint end date |
| status | Planning, Active or Completed |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

## 6. Issue

Stores tasks, bugs, stories and features.

| Field | Description |
|---|---|
| id | Primary key |
| project | Related project |
| board | Related board |
| sprint | Optional related sprint |
| title | Issue title |
| description | Issue description |
| issue_type | Task, Bug, Story or Feature |
| priority | Low, Medium, High or Urgent |
| status | To Do, In Progress, In Review or Done |
| reporter | User who reported the issue |
| assignee | Optional assigned user |
| due_date | Optional due date |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

If a sprint is deleted, its related issues retain their records with the sprint reference set to NULL.

## 7. IssueComment

Stores comments added to issues.

| Field | Description |
|---|---|
| id | Primary key |
| issue | Related issue |
| author | Comment author |
| body | Comment content |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

## 8. IssueAttachment

Stores files attached to issues.

| Field | Description |
|---|---|
| id | Primary key |
| issue | Related issue |
| uploaded_by | User who uploaded the file |
| file | Uploaded file |
| caption | Optional attachment caption |
| created_at | Upload timestamp |

Files are stored under the `issue_attachments/` media directory.

## 9. IssueActivity

Maintains an activity history for issues.

| Field | Description |
|---|---|
| id | Primary key |
| issue | Related issue |
| actor | User who performed the action |
| action | Activity type |
| field_name | Changed field, if applicable |
| old_value | Previous value |
| new_value | New value |
| created_at | Activity timestamp |

Supported actions include Created, Updated, Status Changed, Assigned, Commented and Attachment Added.

## 10. Notification

Stores notifications for workspace users.

| Field | Description |
|---|---|
| id | Primary key |
| recipient | Notification recipient |
| workspace | Related workspace |
| issue | Related issue |
| notification_type | Notification category |
| message | Notification message |
| reminder_for_date | Optional due-date reminder date |
| is_read | Read status |
| created_at | Creation timestamp |

A conditional unique constraint prevents duplicate due-date reminders for the same recipient, issue and reminder date.

## 11. Subscription

Stores subscription information for each workspace.

| Field | Description |
|---|---|
| id | Primary key |
| workspace | One-to-one workspace relationship |
| stripe_customer_id | Stripe customer identifier |
| stripe_subscription_id | Stripe subscription identifier |
| stripe_price_id | Stripe price identifier |
| plan_name | Subscription plan name |
| status | Subscription status |
| current_period_end | Current billing period end |
| cancel_at_period_end | Cancellation setting |
| created_at | Creation timestamp |
| updated_at | Last update timestamp |

Each workspace can have one subscription record.

## 12. StripeWebhookEvent

Stores processed Stripe webhook events.

| Field | Description |
|---|---|
| id | Primary key |
| event_id | Unique Stripe event identifier |
| event_type | Stripe event type |
| processed_at | Processing timestamp |

The unique event ID helps prevent duplicate webhook event processing.

## Relationships

- One workspace can have multiple memberships.
- One user can belong to multiple workspaces.
- One workspace can contain multiple projects.
- One project can contain multiple boards, sprints and issues.
- One board can contain multiple issues.
- One sprint can contain multiple issues.
- One issue can have multiple comments, attachments, activities and notifications.
- One workspace can have one subscription.
- Stripe webhook events are stored independently.

## Data Integrity

The database uses foreign keys, unique constraints and deletion rules to maintain data integrity.

- CASCADE deletes dependent records where configured.
- PROTECT prevents deletion of referenced users.
- SET_NULL preserves issues when an optional sprint is deleted.
- Unique constraints prevent duplicate workspace slugs, project keys within a workspace, board names within a project and duplicate memberships.

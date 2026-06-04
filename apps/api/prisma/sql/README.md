# SQL Files

This directory stores manually runnable SQL scripts for local development and demos.

- `demo-data.sql`: inserts repeatable demo users, boards, tags, threads, comments, reactions, bookmarks, follows, notifications, conversations, messages, reports and audit logs.

Prisma migration SQL files stay under `apps/api/prisma/migrations/` because Prisma
uses that directory structure to track migration history.

Demo accounts use the password `DemoPass123!`:

| Email | Username | Role |
| --- | --- | --- |
| `admin@example.com` | `admin_demo` | Admin |
| `alice@example.com` | `alice_demo` | User |
| `bob@example.com` | `bob_demo` | Moderator |

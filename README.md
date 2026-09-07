# AI Mail Assistant

A Gmail-based mail application that combines a familiar email interface with an AI assistant for performing common email tasks using natural language.

Instead of making the user navigate through multiple screens for every action, the assistant can understand commands such as:

> "Show my unread emails"

> "Find emails from Spotify"

> "Go to starred"

> "Write a polite email asking for a project update"

The application is connected to a real Gmail account, so the inbox, sent mail, starred mail, trash, and outgoing emails are not mock data.

---

## Why I built this

Most email interfaces are powerful, but many common actions still require several manual steps.

This project explores a simpler interaction model:

**User intent → AI-assisted action → Email UI**

The goal was not to build another Gmail clone, but to add a natural-language layer on top of essential email workflows.

---
                 ┌──────────────────┐
                 │     React UI     │
                 │                  │
                 │ Inbox / Sent     │
                 │ Starred / Trash  │
                 │ Compose / Search │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  AI Assistant    │
                 │                  │
                 │ Natural language │
                 │     commands     │
                 └────────┬─────────┘
                          │
                          ▼
                 ┌──────────────────┐
                 │  Node + Express  │
                 │     Backend      │
                 └────────┬─────────┘
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
      ┌──────────────┐         ┌──────────────┐
      │  Gmail API   │         │ Gemini API   │
      │              │         │              │
      │ Email data   │         │ AI compose   │
      │ Send / Read  │         │ Summarize    │
      └──────────────┘         └──────────────┘

## What it can do

### Email

- View real Gmail inbox messages
- Open and read individual emails
- View sent emails
- View starred emails
- View emails in Trash/Bin
- Search emails
- Filter unread emails
- Open the latest email
- Automatically refresh email data
- Compose and send real emails
- Reply to an opened email

### AI Assistant

The assistant currently understands commands such as:

```text
Go to inbox
Go to sent
Go to starred
Go to trash

Show my unread emails

Find emails from Spotify


Open the latest email

Summarize this email

Write a polite email asking for a project update

Reply to this email

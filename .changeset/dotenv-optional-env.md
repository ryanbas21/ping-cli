---
"p1-cli": minor
---

Add dotenv support and make environment-id optional across all commands

- Add dotenv package to automatically load .env files on startup
- Make --environment-id optional for all commands (falls back to PINGONE_ENV_ID env var or stored credentials)
- Fix ConfigHelper to use idiomatic Option handling
- Fix updatePingOneUser to use PATCH instead of PUT
- Fix setPingOneUserPassword Content-Type header handling

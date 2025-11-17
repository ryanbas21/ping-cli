---
"p1-cli": patch
---

Fix auth login command to support multiple input methods with proper precedence:
- CLI flags (highest priority)
- Environment variables (PINGONE_CLIENT_ID, PINGONE_CLIENT_SECRET, PINGONE_ENV_ID, PINGONE_AUTH_REGION)
- Interactive prompts (lowest priority)

All authentication options are now optional, allowing flexible authentication workflows for different use cases (CI/CD, development, interactive).

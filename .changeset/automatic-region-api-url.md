---
"p1-cli": patch
---

Automatic API endpoint detection from stored credentials region

The CLI now automatically determines the correct API URL based on the region specified during `auth login`, eliminating the need to manually set `PINGONE_API_URL` for non-default regions.

**Changes:**
- `getApiBaseUrl()` now uses 3-tier priority: `PINGONE_API_URL` env var > stored credentials region > default
- Automatically extracts region from stored credentials' `tokenEndpoint`
- Supports all regions: North America (com), Europe (eu), Asia Pacific (asia), Canada (ca)
- Fixes 401 errors when using Canada, Europe, or Asia Pacific regions without explicit configuration

**What this means for users:**
- Just run `p1-cli auth login --region="ca"` and the CLI automatically uses `https://api.pingone.ca/v1`
- No need to manually set `PINGONE_API_URL` environment variable anymore
- Seamless multi-region support out of the box

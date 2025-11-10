---
"p1-cli": minor
---

Add environment management commands for discovering environment IDs

**New Commands:**
- `p1-cli p1 environments list_environments`: List all accessible environments
- `p1-cli p1 environments read_environment`: Read specific environment details

**Features:**
- List environments with pagination (`--limit`) and filtering (`--filter`)
- Discover environment IDs without needing prior knowledge
- Read environment details including name, type, region, and license info
- Commands operate at organization level (no `--environment-id` required)
- Automatic response caching with 5-minute TTL for GET operations

**HTTP Client:**
- New `EnvironmentClient.ts` with `listEnvironments` and `readEnvironment` functions
- Uses `executeCachedRequest` helper for efficient API calls
- Full schema validation with `EnvironmentSchemas.ts`

**Testing:**
- 5 comprehensive tests for EnvironmentClient (all passing)
- 3 smoke tests for environment commands (all passing)
- Full integration with existing test infrastructure

**Documentation:**
- Updated README with Environment Commands section
- Added feature to Features list
- Included usage examples with pagination and filtering

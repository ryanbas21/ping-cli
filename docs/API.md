# API Reference

This document provides detailed information about the PingOne API endpoints used by this CLI and the GitHub API integration.

## Table of Contents

- [PingOne API](#pingone-api)
  - [Authentication](#authentication)
  - [User Management Endpoints](#user-management-endpoints)
  - [Request/Response Schemas](#requestresponse-schemas)
  - [Error Codes](#error-codes)
- [GitHub API](#github-api)
  - [Workflow Dispatch](#workflow-dispatch)
- [Type Definitions](#type-definitions)

---

## PingOne API

### Base URL

```
https://api.pingone.com/v1
```

### Authentication

All PingOne API requests require authentication via Bearer token:

```
Authorization: Bearer {PINGONE_TOKEN}
```

The token is obtained through PingOne's OAuth 2.0 authentication flow and should be stored securely.

#### Headers

All requests include these headers:

```
Authorization: Bearer {token}
Accept: application/json
Content-Type: application/json
```

---

## User Management Endpoints

### Create User

Creates a new user in a PingOne environment.

**Endpoint:**
```
POST /environments/{envId}/users
```

**Request Schema:**

```typescript
{
  username: string               // Required: User's username
  email: string                  // Required: User's email address
  population: {                  // Required: Population assignment
    id: string                   //   Population identifier
  }
  name?: {                       // Optional: User's name
    given?: string              //   Given (first) name
    family?: string             //   Family (last) name
  }
  department?: string           // Optional: Department name
  locales?: Array<string>       // Optional: Locale codes (e.g., ["en", "es"])
}
```

**Response Schema:**

```typescript
{
  id: string                     // User's unique identifier
  environment: {                 // Environment reference
    id: string
  }
  population: {                  // Population reference
    id: string
  }
  createdAt: string             // ISO 8601 timestamp
  email: string                 // User's email
  enabled: boolean              // Account enabled status
  lifecycle: {                  // Lifecycle information
    status: string              //   e.g., "ACCOUNT_OK"
  }
  mfaEnabled: boolean           // MFA status
  name?: {                      // User's name (if provided)
    given?: string
    family?: string
  }
  updatedAt: string             // ISO 8601 timestamp
  username: string              // User's username
  department?: string           // Department (if provided)
  locales?: Array<string>       // Locales (if provided)
}
```

**Status Codes:**
- `200 OK`: User created successfully
- `201 Created`: User created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Environment or population not found
- `422 Unprocessable Entity`: Validation failed
- `500 Internal Server Error`: Server error

**Example Request:**

```typescript
import { createPingOneUser } from "./HttpClient/PingOneClient"
import { Effect } from "effect"

const program = Effect.gen(function* () {
  const user = yield* createPingOneUser({
    envId: "abc-123-def",
    token: "eyJhbGc...",
    userData: {
      username: "john.doe",
      email: "john.doe@example.com",
      population: {
        id: "pop-456"
      },
      name: {
        given: "John",
        family: "Doe"
      },
      department: "Engineering"
    }
  })

  console.log("Created user:", user.id)
})
```

---

### Read User

Retrieves user information by user ID.

**Endpoint:**
```
GET /environments/{envId}/users/{userId}?expand=population
```

**Query Parameters:**
- `expand=population` - Expands the population reference to include full details

**Response Schema:**

Same as Create User response.

**Status Codes:**
- `200 OK`: User retrieved successfully
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

**Example Request:**

```typescript
import { readPingOneUser } from "./HttpClient/PingOneClient"
import { Effect } from "effect"

const program = Effect.gen(function* () {
  const user = yield* readPingOneUser({
    envId: "abc-123-def",
    token: "eyJhbGc...",
    userId: "user-789"
  })

  console.log("User details:", {
    username: user.username,
    email: user.email,
    status: user.lifecycle.status
  })
})
```

---

### Update User

Updates an existing user's information.

**Endpoint:**
```
PUT /environments/{envId}/users/{userId}
```

**Request Schema:**

```typescript
{
  username?: string              // Optional: New username
  name?: {                       // Optional: Extended name structure
    formatted?: string          //   Full formatted name
    given?: string              //   Given name
    middle?: string             //   Middle name
    family?: string             //   Family name
    honorificPrefix?: string    //   e.g., "Dr.", "Mr."
    honorificSuffix?: string    //   e.g., "Jr.", "III"
  }
  nickname?: string             // Optional: Nickname
  title?: string                // Optional: Job title
  preferredLanguage?: string    // Optional: Language code
  locale?: string               // Optional: Locale code
  email?: string                // Optional: New email
  primaryPhone?: string         // Optional: Primary phone number
  mobilePhone?: string          // Optional: Mobile phone number
  photo?: {                     // Optional: Photo URL
    href: string
  }
  address?: {                   // Optional: Address information
    streetAddress?: string
    locality?: string           //   City
    region?: string             //   State/Province
    postalCode?: string
    countryCode?: string        //   ISO country code
  }
  accountId?: string            // Optional: Account identifier
  type?: string                 // Optional: User type
  timezone?: string             // Optional: Timezone
}
```

**Response Schema:**

```typescript
{
  id: string
  environment: { id: string }
  population: { id: string }
  createdAt: string
  email?: string
  enabled: boolean
  lifecycle: { status: string }
  mfaEnabled: boolean
  name?: {
    formatted?: string
    given?: string
    middle?: string
    family?: string
    honorificPrefix?: string
    honorificSuffix?: string
  }
  updatedAt: string
  username?: string
  nickname?: string
  title?: string
  preferredLanguage?: string
  locale?: string
  primaryPhone?: string
  mobilePhone?: string
  photo?: { href: string }
  address?: {
    streetAddress?: string
    locality?: string
    region?: string
    postalCode?: string
    countryCode?: string
  }
  accountId?: string
  type?: string
  timezone?: string
}
```

**Status Codes:**
- `200 OK`: User updated successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `422 Unprocessable Entity`: Validation failed
- `500 Internal Server Error`: Server error

**Example Request:**

```typescript
import { updatePingOneUser } from "./HttpClient/PingOneClient"
import { Effect } from "effect"

const program = Effect.gen(function* () {
  const updatedUser = yield* updatePingOneUser({
    envId: "abc-123-def",
    token: "eyJhbGc...",
    userId: "user-789",
    userData: {
      email: "newemail@example.com",
      name: {
        given: "Jane",
        family: "Smith"
      },
      department: "Product"
    }
  })

  console.log("Updated user:", updatedUser.id)
})
```

---

### Delete User

Deletes a user from PingOne.

**Endpoint:**
```
DELETE /environments/{envId}/users/{userId}
```

**Request:** No body required

**Response:** No content (204)

**Status Codes:**
- `204 No Content`: User deleted successfully
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `500 Internal Server Error`: Server error

**Example Request:**

```typescript
import { deletePingOneUser } from "./HttpClient/PingOneClient"
import { Effect } from "effect"

const program = Effect.gen(function* () {
  yield* deletePingOneUser({
    envId: "abc-123-def",
    token: "eyJhbGc...",
    userId: "user-789"
  })

  console.log("User deleted successfully")
})
```

---

### Verify User

Verifies a user account using a verification code.

**Endpoint:**
```
POST /environments/{envId}/users/{userId}
```

**Headers:**
```
Content-Type: application/vnd.pingidentity.user.verify+json
```

**Request Schema:**

```typescript
{
  verificationCode: string      // Required: 6-digit verification code
}
```

**Response Schema:**

Same as Create User response.

**Status Codes:**
- `200 OK`: User verified successfully
- `400 Bad Request`: Invalid verification code
- `401 Unauthorized`: Invalid or missing authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: User not found
- `422 Unprocessable Entity`: Verification failed
- `500 Internal Server Error`: Server error

**Example Request:**

```typescript
import { verifyPingOneUser } from "./HttpClient/PingOneClient"
import { Effect } from "effect"

const program = Effect.gen(function* () {
  const verifiedUser = yield* verifyPingOneUser({
    envId: "abc-123-def",
    token: "eyJhbGc...",
    userId: "user-789",
    verificationData: {
      verificationCode: "123456"
    }
  })

  console.log("User verified:", verifiedUser.lifecycle.status)
})
```

---

## Error Codes

### PingOne API Error Responses

All error responses follow this structure:

```typescript
{
  id: string              // Error identifier
  code: string            // Error code
  message: string         // Human-readable error message
  details?: Array<{       // Optional detailed error information
    code: string
    message: string
    target?: string       // Field that caused the error
  }>
}
```

### Common Error Codes

| Code | Status | Meaning |
|------|--------|---------|
| `INVALID_VALUE` | 400 | One or more fields contain invalid values |
| `INVALID_DATA` | 400 | Request body is malformed or invalid |
| `UNIQUENESS_VIOLATION` | 400 | Username or email already exists |
| `UNAUTHORIZED` | 401 | Invalid or expired authentication token |
| `INSUFFICIENT_PERMISSIONS` | 403 | Token lacks required permissions |
| `NOT_FOUND` | 404 | Resource (user, environment, population) not found |
| `VALIDATION_ERROR` | 422 | Field validation failed |
| `INTERNAL_SERVER_ERROR` | 500 | PingOne service error |

### CLI Error Types

The CLI wraps API errors in custom error types:

```typescript
// Authentication errors
class PingOneAuthError extends Data.TaggedError("PingOneAuthError")<{
  cause: string
}>

// API request errors
class PingOneApiError extends Data.TaggedError("PingOneApiError")<{
  status: number
  message: string
  errorCode?: string
}>

// Validation errors
class PingOneValidationError extends Data.TaggedError("PingOneValidationError")<{
  field: string
  message: string
}>
```

---

## GitHub API

### Workflow Dispatch

Triggers a GitHub Actions workflow.

**Endpoint:**
```
POST https://api.github.com/repos/{owner}/{repo}/actions/workflows/{workflow_id}/dispatches
```

**Headers:**
```
Authorization: Bearer {GH_TOKEN}
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2022-11-28
```

**Request Schema:**

```typescript
{
  ref: string                    // Required: Git ref (branch, tag, commit)
  inputs?: Record<string, any>   // Optional: Workflow input parameters
}
```

**CI Workflow Inputs:**

```typescript
{
  inputs: {
    baseUrl: string             // Tenant URL for testing
  },
  ref: string                   // Git reference to test
}
```

**Publish Workflow Inputs:**

```typescript
{
  inputs: {
    ref?: string                // Git reference to publish
    tag?: string                // NPM dist-tag (e.g., "latest", "beta")
    branch?: string             // Branch name
    prerelease?: string         // Prerelease version
    access?: string             // NPM access ("public" or "restricted")
  }
}
```

**Status Codes:**
- `204 No Content`: Workflow dispatched successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Invalid GitHub token
- `403 Forbidden`: Token lacks permissions
- `404 Not Found`: Workflow not found
- `422 Unprocessable Entity`: Validation failed

**Example Request:**

```typescript
import { invokeJsSdkWorkflow } from "./HttpClient/HttpClient"
import { Effect } from "effect"

const program = Effect.gen(function* () {
  const response = yield* invokeJsSdkWorkflow({
    ghToken: "ghp_xxx",
    workflowId: "CI.yml",
    payload: {
      inputs: {
        baseUrl: "https://tenant.example.com"
      },
      ref: "main"
    }
  })

  console.log("Workflow dispatched:", response.status)
})
```

---

## Type Definitions

### Core Types

```typescript
// User creation payload
interface CreateUserPayload<S> {
  envId: string
  token: string
  userData: S  // Validated against PingOneCreateUserRequest schema
}

// User read payload
interface ReadUserPayload {
  envId: string
  token: string
  userId: string
}

// User update payload
interface UpdateUserPayload<S> {
  envId: string
  token: string
  userId: string
  userData: S  // Validated against PingOneUpdateUserRequest schema
}

// User delete payload
interface DeleteUserPayload {
  envId: string
  token: string
  userId: string
}

// User verify payload
interface VerifyUserPayload<S> {
  envId: string
  token: string
  userId: string
  verificationData: S  // Validated against PingOneVerifyUserRequest schema
}

// GitHub workflow payload
interface WorkflowPayloads<S> {
  workflowId: string
  ghToken: string
  payload: S  // Validated against GitHubDispatchSchema
}
```

### Schema Exports

All schemas are exported from:

- **PingOne Schemas**: `src/HttpClient/PingOneSchemas.ts`
- **GitHub Schemas**: `src/HttpClient/schemas.ts`

```typescript
// PingOne Schemas
export {
  PingOneCreateUserRequest,
  PingOneCreateUserResponse,
  PingOneReadUserResponse,
  PingOneUpdateUserRequest,
  PingOneUpdateUserResponse,
  PingOneVerifyUserRequest,
  PingOneVerifyUserResponse,
  PingOneUserNameSchema,
  PingOnePopulationSchema,
  PingOneEnvironmentSchema,
  PingOneLifecycleSchema
} from "./HttpClient/PingOneSchemas"

// GitHub Schemas
export {
  GitHubDispatchSchema,
  PingCIWorkflow,
  PingPublishWorkflow
} from "./HttpClient/schemas"
```

---

## Rate Limiting

### PingOne API

PingOne API implements rate limiting:

- **Rate Limit**: Varies by endpoint and subscription tier
- **Headers**: Check `X-RateLimit-Limit` and `X-RateLimit-Remaining` headers
- **Retry**: Implement exponential backoff on `429 Too Many Requests`

### GitHub API

GitHub API rate limits:

- **Authenticated**: 5,000 requests per hour
- **Headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **Retry**: Wait until `X-RateLimit-Reset` timestamp

---

## Best Practices

1. **Always validate inputs** using Effect Schema before API calls
2. **Handle errors gracefully** with proper error types
3. **Use environment variables** for sensitive credentials
4. **Implement retry logic** for transient failures
5. **Log requests and responses** for debugging (exclude sensitive data)
6. **Cache frequently accessed data** to reduce API calls
7. **Use Effect's resource management** for cleanup and error recovery

---

## Resources

- [PingOne API Documentation](https://apidocs.pingidentity.com/pingone/platform/v1/api/)
- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [Effect Library Documentation](https://effect.website)
- [Effect Schema Documentation](https://effect.website/docs/schema/introduction)

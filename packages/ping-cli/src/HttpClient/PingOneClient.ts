/**
 * PingOne Users HTTP Client
 *
 * Provides functions for managing PingOne users via the PingOne Management API.
 * Includes operations for creating, reading, updating, deleting, and verifying users.
 *
 * @since 0.0.1
 */
import { HttpClientRequest, HttpClientResponse } from "@effect/platform"
import { HttpClient } from "@effect/platform/HttpClient"
import type { Schema } from "effect"
import { Effect } from "effect"
import { getApiBaseUrl } from "../Commands/PingOne/ConfigHelper.js"
import { PingOneApiError } from "../Errors.js"
import { CacheService, RetryService } from "../Services/index.js"
import {
  PingOneCreateUserRequest,
  PingOneCreateUserResponse,
  PingOnePasswordResetRequest,
  PingOnePasswordResetResponse,
  PingOneReadUserResponse,
  PingOneSetPasswordRequest,
  PingOneSetPasswordResponse,
  PingOneUpdateUserRequest,
  PingOneUpdateUserResponse,
  PingOneVerifyUserRequest,
  PingOneVerifyUserResponse
} from "./PingOneSchemas.js"
import type {
  CreateUserPayload,
  DeleteUserPayload,
  PasswordResetPayload,
  ReadUserPayload,
  SetPasswordPayload,
  UpdateUserPayload,
  VerifyUserPayload
} from "./PingOneTypes.js"

/**
 * Creates a user in PingOne via API
 *
 * Makes a POST request to the PingOne Users API to create a new user account.
 * The request is validated against the PingOneCreateUserRequest schema and the
 * response is validated against the PingOneCreateUserResponse schema.
 *
 * @param payload - Create user payload
 * @param payload.envId - PingOne environment ID where the user will be created
 * @param payload.token - PingOne access token with user:create permissions
 * @param payload.userData - User data matching PingOneCreateUserRequest schema
 * @returns Effect that yields the created user response with ID, username, email, and lifecycle information
 ** @throws {PingOneApiError} When API request fails with non-2xx status code
 * @see {@link PingOneCreateUserRequest} for request schema definition
 * @see {@link PingOneCreateUserResponse} for response schema definition
 * @since 0.0.1
 * @category API Client
 */
export const createPingOneUser = <S extends Schema.Schema.Type<typeof PingOneCreateUserRequest>>(
  { envId, token, userData }: CreateUserPayload<S>
) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const apiBaseUrl = yield* getApiBaseUrl()

    const httpRequest = HttpClientRequest.post(
      `${apiBaseUrl}/environments/${envId}/users`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.schemaBodyJson(PingOneCreateUserRequest)(userData),
      Effect.flatMap((req) =>
        HttpClient.pipe(
          Effect.flatMap((client) => client.execute(req))
        )
      ),
      Effect.flatMap((response) =>
        Effect.if(response.status >= 200 && response.status < 300, {
          onTrue: () => Effect.succeed(response),
          onFalse: () =>
            Effect.fail(
              new PingOneApiError({
                status: response.status,
                message: `PingOne API request failed with status ${response.status}`
              })
            )
        })
      ),
      Effect.flatMap((response) => HttpClientResponse.schemaBodyJson(PingOneCreateUserResponse)(response))
    )

    return yield* retry.retryableRequest(httpRequest)
  })

/**
 * Reads a user from PingOne by ID
 *
 * Makes a GET request to retrieve user information from the PingOne API.
 * The request includes the `expand=population` query parameter to include
 * full population details in the response.
 *
 * @param payload - Read user payload
 * @param payload.envId - PingOne environment ID containing the user
 * @param payload.token - PingOne access token with user:read permissions
 * @param payload.userId - Unique identifier of the user to retrieve
 * @returns Effect that yields user data including username, email, status, and population info
 ** @throws {PingOneApiError} When API request fails (e.g., 404 if user not found)
 * @see {@link PingOneReadUserResponse} for response schema definition
 * @since 0.0.1
 * @category API Client
 */
export const readPingOneUser = (
  { envId, token, userId }: ReadUserPayload
) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const cache = yield* CacheService
    const apiBaseUrl = yield* getApiBaseUrl()

    const req = HttpClientRequest.get(
      `${apiBaseUrl}/environments/${envId}/users/${userId}?expand=population`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    const httpRequest = Effect.gen(function*() {
      const client = yield* HttpClient
      const response = yield* client.execute(req)

      if (response.status >= 200 && response.status < 300) {
        return yield* HttpClientResponse.schemaBodyJson(PingOneReadUserResponse)(response)
      }

      return yield* Effect.fail(
        new PingOneApiError({
          status: response.status,
          message: `PingOne API request failed with status ${response.status}`
        })
      )
    })

    // Apply caching first, then retry
    return yield* cache.getCached(req, retry.retryableRequest(httpRequest))
  })

/**
 * Updates a user in PingOne via API
 *
 * Makes a PUT request to update an existing user's information.
 * Only provided fields will be updated; omitted fields remain unchanged.
 * The request is validated against the PingOneUpdateUserRequest schema.
 *
 * @param payload - Update user payload
 * @param payload.envId - PingOne environment ID containing the user
 * @param payload.token - PingOne access token with user:update permissions
 * @param payload.userId - Unique identifier of the user to update
 * @param payload.userData - User data to update (only modified fields needed)
 * @returns Effect that yields the updated user response with new values
 ** @throws {PingOneApiError} When API request fails (e.g., 404 if user not found, 422 if validation fails)
 * @see {@link PingOneUpdateUserRequest} for request schema definition
 * @see {@link PingOneUpdateUserResponse} for response schema definition
 * @since 0.0.1
 * @category API Client
 */
export const updatePingOneUser = <S extends Schema.Schema.Type<typeof PingOneUpdateUserRequest>>(
  { envId, token, userId, userData }: UpdateUserPayload<S>
) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const apiBaseUrl = yield* getApiBaseUrl()

    const httpRequest = HttpClientRequest.put(
      `${apiBaseUrl}/environments/${envId}/users/${userId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.schemaBodyJson(PingOneUpdateUserRequest)(userData),
      Effect.flatMap((req) =>
        HttpClient.pipe(
          Effect.flatMap((client) => client.execute(req))
        )
      ),
      Effect.flatMap((response) =>
        Effect.if(response.status >= 200 && response.status < 300, {
          onTrue: () => Effect.succeed(response),
          onFalse: () =>
            Effect.fail(
              new PingOneApiError({
                status: response.status,
                message: `PingOne API request failed with status ${response.status}`
              })
            )
        })
      ),
      Effect.flatMap((response) => HttpClientResponse.schemaBodyJson(PingOneUpdateUserResponse)(response))
    )

    return yield* retry.retryableRequest(httpRequest)
  })

/**
 * Deletes a user from PingOne
 *
 * Makes a DELETE request to permanently remove a user from the PingOne environment.
 * This operation cannot be undone. Returns undefined on success (HTTP 204 No Content).
 *
 * @param payload - Delete user payload
 * @param payload.envId - PingOne environment ID containing the user
 * @param payload.token - PingOne access token with user:delete permissions
 * @param payload.userId - Unique identifier of the user to delete
 * @returns Effect that yields undefined on successful deletion
 ** @throws {PingOneApiError} When API request fails (e.g., 404 if user not found, 403 if forbidden)
 * @since 0.0.1
 * @category API Client
 */
export const deletePingOneUser = (
  { envId, token, userId }: DeleteUserPayload
) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const apiBaseUrl = yield* getApiBaseUrl()

    const httpRequest = Effect.gen(function*() {
      const req = HttpClientRequest.del(
        `${apiBaseUrl}/environments/${envId}/users/${userId}`
      ).pipe(
        HttpClientRequest.bearerToken(token),
        HttpClientRequest.accept("application/json")
      )

      const client = yield* HttpClient
      const response = yield* client.execute(req)

      if (response.status === 204) {
        return undefined
      }

      return yield* Effect.fail(
        new PingOneApiError({
          status: response.status,
          message: `PingOne API request failed with status ${response.status}`
        })
      )
    })

    return yield* retry.retryableRequest(httpRequest)
  })

/**
 * Verifies a user account in PingOne with a verification code
 *
 * Makes a POST request with a special content type to verify a user's account
 * using a verification code (typically 6 digits) sent to the user's email.
 * Upon successful verification, the user's lifecycle status is updated to ACCOUNT_OK.
 *
 * @param payload - Verify user payload
 * @param payload.envId - PingOne environment ID containing the user
 * @param payload.token - PingOne access token with user:update permissions
 * @param payload.userId - Unique identifier of the user to verify
 * @param payload.verificationData - Verification data containing the verification code
 * @returns Effect that yields the verified user response with updated lifecycle status
 ** @throws {PingOneApiError} When API request fails (e.g., 400 if code is invalid, 404 if user not found)
 * @see {@link PingOneVerifyUserRequest} for request schema definition
 * @see {@link PingOneVerifyUserResponse} for response schema definition
 * @since 0.0.1
 * @category API Client
 */
export const verifyPingOneUser = <S extends Schema.Schema.Type<typeof PingOneVerifyUserRequest>>(
  { envId, token, userId, verificationData }: VerifyUserPayload<S>
) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const apiBaseUrl = yield* getApiBaseUrl()

    const httpRequest = HttpClientRequest.post(
      `${apiBaseUrl}/environments/${envId}/users/${userId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/vnd.pingidentity.user.verify+json"),
      HttpClientRequest.schemaBodyJson(PingOneVerifyUserRequest)(verificationData),
      Effect.flatMap((req) =>
        HttpClient.pipe(
          Effect.flatMap((client) => client.execute(req))
        )
      ),
      Effect.flatMap((response) =>
        Effect.if(response.status >= 200 && response.status < 300, {
          onTrue: () => Effect.succeed(response),
          onFalse: () =>
            Effect.fail(
              new PingOneApiError({
                status: response.status,
                message: `PingOne API request failed with status ${response.status}`
              })
            )
        })
      ),
      Effect.flatMap((response) => HttpClientResponse.schemaBodyJson(PingOneVerifyUserResponse)(response))
    )

    return yield* retry.retryableRequest(httpRequest)
  })

/**
 * Sets a user's password in PingOne
 *
 * Makes a PUT request to set or update a user's password. Can optionally require
 * the user to change their password on next login by setting forceChange to true.
 *
 * @param payload - Set password payload
 * @param payload.envId - PingOne environment ID containing the user
 * @param payload.token - PingOne access token with user:password:set permissions
 * @param payload.userId - Unique identifier of the user
 * @param payload.passwordData - Password data containing the new password value and optional forceChange flag
 * @returns Effect that yields the password set response with user ID and status
 * @throws {PingOneApiError} When API request fails (e.g., 400 if password doesn't meet policy, 404 if user not found)
 * @see {@link PingOneSetPasswordRequest} for request schema definition
 * @see {@link PingOneSetPasswordResponse} for response schema definition
 * @since 0.0.1
 * @category API Client
 */
export const setPingOneUserPassword = <S extends Schema.Schema.Type<typeof PingOneSetPasswordRequest>>(
  { envId, token, userId, passwordData }: SetPasswordPayload<S>
) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const apiBaseUrl = yield* getApiBaseUrl()

    const httpRequest = HttpClientRequest.put(
      `${apiBaseUrl}/environments/${envId}/users/${userId}/password`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/vnd.pingidentity.password.set+json"),
      HttpClientRequest.schemaBodyJson(PingOneSetPasswordRequest)(passwordData),
      Effect.flatMap((req) =>
        HttpClient.pipe(
          Effect.flatMap((client) => client.execute(req))
        )
      ),
      Effect.flatMap((response) =>
        Effect.if(response.status >= 200 && response.status < 300, {
          onTrue: () => Effect.succeed(response),
          onFalse: () =>
            Effect.fail(
              new PingOneApiError({
                status: response.status,
                message: `PingOne API request failed with status ${response.status}`
              })
            )
        })
      ),
      Effect.flatMap((response) => HttpClientResponse.schemaBodyJson(PingOneSetPasswordResponse)(response))
    )

    return yield* retry.retryableRequest(httpRequest)
  })

/**
 * Initiates a password recovery flow for a user
 *
 * Makes a POST request to trigger a password recovery flow. PingOne will send
 * a recovery code/link to the user's email address. This is a self-service operation
 * that users can initiate themselves.
 *
 * @param payload - Password recovery payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token (or can be unauthenticated based on policy)
 * @param payload.resetData - Reset data containing the user's email address
 * @returns Effect that yields the password recovery response with recovery ID and status
 * @throws {PingOneApiError} When API request fails (e.g., 404 if email not found)
 * @see {@link PingOnePasswordResetRequest} for request schema definition
 * @see {@link PingOnePasswordResetResponse} for response schema definition
 * @since 0.0.1
 * @category API Client
 */
export const recoverPingOneUserPassword = <S extends Schema.Schema.Type<typeof PingOnePasswordResetRequest>>(
  { envId, token, resetData }: PasswordResetPayload<S>
) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const apiBaseUrl = yield* getApiBaseUrl()

    const httpRequest = HttpClientRequest.post(
      `${apiBaseUrl}/environments/${envId}/users/password`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/vnd.pingidentity.password.recover+json"),
      HttpClientRequest.schemaBodyJson(PingOnePasswordResetRequest)(resetData),
      Effect.flatMap((req) =>
        HttpClient.pipe(
          Effect.flatMap((client) => client.execute(req))
        )
      ),
      Effect.flatMap((response) =>
        Effect.if(response.status >= 200 && response.status < 300, {
          onTrue: () => Effect.succeed(response),
          onFalse: () =>
            Effect.fail(
              new PingOneApiError({
                status: response.status,
                message: `PingOne API request failed with status ${response.status}`
              })
            )
        })
      ),
      Effect.flatMap((response) => HttpClientResponse.schemaBodyJson(PingOnePasswordResetResponse)(response))
    )

    return yield* retry.retryableRequest(httpRequest)
  })

/**
 * Initiates a password reset flow (admin-initiated)
 *
 * Similar to password recovery but initiated by an administrator rather than the user.
 * Makes a POST request to trigger a password reset flow. PingOne will send a reset
 * code/link to the specified email address.
 *
 * @param payload - Password reset payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token with user:password:reset permissions
 * @param payload.resetData - Reset data containing the user's email address
 * @returns Effect that yields the password reset response with reset ID and status
 * @throws {PingOneApiError} When API request fails (e.g., 404 if email not found)
 * @see {@link PingOnePasswordResetRequest} for request schema definition
 * @see {@link PingOnePasswordResetResponse} for response schema definition
 * @since 0.0.1
 * @category API Client
 */
export const resetPingOneUserPassword = <S extends Schema.Schema.Type<typeof PingOnePasswordResetRequest>>(
  { envId, token, resetData }: PasswordResetPayload<S>
) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const apiBaseUrl = yield* getApiBaseUrl()

    const httpRequest = HttpClientRequest.post(
      `${apiBaseUrl}/environments/${envId}/users/password`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/vnd.pingidentity.password.reset+json"),
      HttpClientRequest.schemaBodyJson(PingOnePasswordResetRequest)(resetData),
      Effect.flatMap((req) =>
        HttpClient.pipe(
          Effect.flatMap((client) => client.execute(req))
        )
      ),
      Effect.flatMap((response) =>
        Effect.if(response.status >= 200 && response.status < 300, {
          onTrue: () => Effect.succeed(response),
          onFalse: () =>
            Effect.fail(
              new PingOneApiError({
                status: response.status,
                message: `PingOne API request failed with status ${response.status}`
              })
            )
        })
      ),
      Effect.flatMap((response) => HttpClientResponse.schemaBodyJson(PingOnePasswordResetResponse)(response))
    )

    return yield* retry.retryableRequest(httpRequest)
  })

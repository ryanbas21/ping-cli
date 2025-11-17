/**
 * PingOne Users HTTP Client
 *
 * Provides functions for managing PingOne users via the PingOne Management API.
 * Includes operations for creating, reading, updating, deleting, and verifying users.
 *
 * @internal
 * @since 0.0.1
 */
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import type { Schema } from "effect"
import * as Effect from "effect/Effect"
import { getApiBaseUrl } from "../Commands/PingOne/ConfigHelper.js"
import { executeCachedRequest, executeRequest, executeVoidRequest } from "./helpers.js"
import {
  PingOneCreateUserRequest,
  PingOneCreateUserResponse,
  PingOneDeleteMfaDeviceResponse,
  PingOneListMfaDevicesResponse,
  PingOneListSessionsResponse,
  PingOneListUsersResponse,
  PingOnePasswordResetRequest,
  PingOnePasswordResetResponse,
  PingOneReadUserResponse,
  PingOneRevokeSessionResponse,
  PingOneSetPasswordRequest,
  PingOneSetPasswordResponse,
  PingOneUpdateMfaRequest,
  PingOneUpdateMfaResponse,
  PingOneUpdateUserAccountRequest,
  PingOneUpdateUserRequest,
  PingOneUpdateUserResponse,
  PingOneUpdateUserStatusRequest,
  PingOneUserStatusResponse,
  PingOneVerifyUserRequest,
  PingOneVerifyUserResponse
} from "./PingOneSchemas.js"
import type {
  CreateUserPayload,
  DeleteMfaDevicePayload,
  DeleteUserPayload,
  ListMfaDevicesPayload,
  ListUserSessionsPayload,
  ListUsersPayload,
  PasswordResetPayload,
  ReadUserPayload,
  RevokeUserSessionPayload,
  SetPasswordPayload,
  UpdateUserAccountPayload,
  UpdateUserMfaPayload,
  UpdateUserPayload,
  UpdateUserStatusPayload,
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
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = yield* HttpClientRequest.post(
      `${apiBaseUrl}/environments/${envId}/users`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.schemaBodyJson(PingOneCreateUserRequest)(userData)
    )

    return yield* executeRequest(request, PingOneCreateUserResponse)
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
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = HttpClientRequest.get(
      `${apiBaseUrl}/environments/${envId}/users/${userId}?expand=population`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    return yield* executeCachedRequest(request, PingOneReadUserResponse)
  })

/**
 * Lists users from PingOne with optional filtering and pagination
 *
 * Makes a GET request to retrieve a list of users from the PingOne API.
 * Supports SCIM filtering for searching users and pagination via limit parameter.
 *
 * @param payload - List users payload
 * @param payload.envId - PingOne environment ID containing the users
 * @param payload.token - PingOne access token with user:read permissions
 * @param payload.limit - Optional maximum number of users to return (default: 100, max: 1000)
 * @param payload.filter - Optional SCIM filter expression (e.g., 'email eq "user@example.com"')
 * @returns Effect that yields paginated list of users with metadata
 * @throws {PingOneApiError} When API request fails (e.g., 400 if filter is invalid)
 * @see {@link PingOneListUsersResponse} for response schema definition
 * @example
 * // List all users (up to default limit)
 * listPingOneUsers({ envId, token })
 *
 * // Search by email
 * listPingOneUsers({ envId, token, filter: 'email eq "user@example.com"' })
 *
 * // Search by username with limit
 * listPingOneUsers({ envId, token, filter: 'username sw "john"', limit: 50 })
 * @since 0.0.1
 * @category API Client
 */
export const listPingOneUsers = (
  { envId, token, limit, filter }: ListUsersPayload
) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    // Build query parameters
    const queryParams = new URLSearchParams()
    if (limit !== undefined) {
      queryParams.append("limit", String(limit))
    }
    if (filter !== undefined) {
      queryParams.append("filter", filter)
    }

    const queryString = queryParams.toString()
    const url = queryString
      ? `${apiBaseUrl}/environments/${envId}/users?${queryString}`
      : `${apiBaseUrl}/environments/${envId}/users`

    const request = HttpClientRequest.get(url).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    return yield* executeCachedRequest(request, PingOneListUsersResponse)
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
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = yield* HttpClientRequest.put(
      `${apiBaseUrl}/environments/${envId}/users/${userId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.schemaBodyJson(PingOneUpdateUserRequest)(userData)
    )

    return yield* executeRequest(request, PingOneUpdateUserResponse)
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
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = HttpClientRequest.del(
      `${apiBaseUrl}/environments/${envId}/users/${userId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    yield* executeVoidRequest(request)
    return undefined
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
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = yield* HttpClientRequest.post(
      `${apiBaseUrl}/environments/${envId}/users/${userId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/vnd.pingidentity.user.verify+json"),
      HttpClientRequest.schemaBodyJson(PingOneVerifyUserRequest)(verificationData)
    )

    return yield* executeRequest(request, PingOneVerifyUserResponse)
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
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = yield* HttpClientRequest.put(
      `${apiBaseUrl}/environments/${envId}/users/${userId}/password`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/vnd.pingidentity.password.set+json"),
      HttpClientRequest.schemaBodyJson(PingOneSetPasswordRequest)(passwordData)
    )

    return yield* executeRequest(request, PingOneSetPasswordResponse)
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
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = yield* HttpClientRequest.post(
      `${apiBaseUrl}/environments/${envId}/users/password`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/vnd.pingidentity.password.recover+json"),
      HttpClientRequest.schemaBodyJson(PingOnePasswordResetRequest)(resetData)
    )

    return yield* executeRequest(request, PingOnePasswordResetResponse)
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
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = yield* HttpClientRequest.post(
      `${apiBaseUrl}/environments/${envId}/users/password`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/vnd.pingidentity.password.reset+json"),
      HttpClientRequest.schemaBodyJson(PingOnePasswordResetRequest)(resetData)
    )

    return yield* executeRequest(request, PingOnePasswordResetResponse)
  })
/**
 * Enable a user in PingOne via API
 *
 * Makes a PATCH request to update the user's enabled status to true.
 *
 * @param payload - Update user status payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token with user:update permissions
 * @param payload.userId - ID of the user to enable
 * @param payload.enabled - Enabled status (true to enable)
 * @returns Effect that yields the user status response
 * @throws {PingOneApiError} When API request fails
 * @since 0.0.1
 * @category API Client
 */
export const updatePingOneUserStatus = (
  { envId, token, userId, enabled }: UpdateUserStatusPayload
) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = yield* HttpClientRequest.patch(
      `${apiBaseUrl}/environments/${envId}/users/${userId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.schemaBodyJson(PingOneUpdateUserStatusRequest)({ enabled })
    )

    return yield* executeRequest(request, PingOneUserStatusResponse)
  })

/**
 * Update a user's account authentication status in PingOne via API
 *
 * Makes a PATCH request to update the user's account.canAuthenticate status.
 * Setting canAuthenticate to false effectively locks the user account.
 *
 * @param payload - Update user account payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token with user:update permissions
 * @param payload.userId - ID of the user to update
 * @param payload.canAuthenticate - Whether the user can authenticate (false to lock)
 * @returns Effect that yields the user status response
 * @throws {PingOneApiError} When API request fails
 * @since 0.0.1
 * @category API Client
 */
export const updatePingOneUserAccount = (
  { envId, token, userId, canAuthenticate }: UpdateUserAccountPayload
) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = yield* HttpClientRequest.patch(
      `${apiBaseUrl}/environments/${envId}/users/${userId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.schemaBodyJson(PingOneUpdateUserAccountRequest)({
        account: { canAuthenticate }
      })
    )

    return yield* executeRequest(request, PingOneUserStatusResponse)
  })
/**
 * List user sessions in PingOne via API
 *
 * Makes a GET request to retrieve all active sessions for a user.
 *
 * @param payload - List user sessions payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token with user:read permissions
 * @param payload.userId - ID of the user whose sessions to list
 * @param payload.limit - Optional limit for number of sessions to return
 * @returns Effect that yields the list sessions response
 * @throws {PingOneApiError} When API request fails
 * @since 0.0.1
 * @category API Client
 */
export const listPingOneUserSessions = (
  { envId, token, userId, limit }: ListUserSessionsPayload
) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    // Build query parameters
    const queryParams = new URLSearchParams()
    if (limit !== undefined) {
      queryParams.append("limit", String(limit))
    }

    const queryString = queryParams.toString()
    const url = queryString
      ? `${apiBaseUrl}/environments/${envId}/users/${userId}/sessions?${queryString}`
      : `${apiBaseUrl}/environments/${envId}/users/${userId}/sessions`

    const request = HttpClientRequest.get(url).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    return yield* executeCachedRequest(request, PingOneListSessionsResponse)
  })

/**
 * Revoke a user session in PingOne via API
 *
 * Makes a DELETE request to revoke a specific user session.
 *
 * @param payload - Revoke user session payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token with user:update permissions
 * @param payload.userId - ID of the user whose session to revoke
 * @param payload.sessionId - ID of the session to revoke
 * @returns Effect that yields the revoke session response
 * @throws {PingOneApiError} When API request fails
 * @since 0.0.1
 * @category API Client
 */
export const revokePingOneUserSession = (
  { envId, token, userId, sessionId }: RevokeUserSessionPayload
) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = HttpClientRequest.del(
      `${apiBaseUrl}/environments/${envId}/users/${userId}/sessions/${sessionId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    return yield* executeRequest(request, PingOneRevokeSessionResponse)
  })
/**
 * Update a user's MFA enabled status in PingOne via API
 *
 * Makes a PATCH request to update the user's mfaEnabled status.
 *
 * @param payload - Update user MFA payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token with user:update permissions
 * @param payload.userId - ID of the user to update
 * @param payload.mfaEnabled - Whether MFA should be enabled (true) or disabled (false)
 * @returns Effect that yields the MFA update response
 * @throws {PingOneApiError} When API request fails
 * @since 0.0.1
 * @category API Client
 */
export const updatePingOneUserMfa = (
  { envId, token, userId, mfaEnabled }: UpdateUserMfaPayload
) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = yield* HttpClientRequest.patch(
      `${apiBaseUrl}/environments/${envId}/users/${userId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.schemaBodyJson(PingOneUpdateMfaRequest)({ mfaEnabled })
    )

    return yield* executeRequest(request, PingOneUpdateMfaResponse)
  })

/**
 * List MFA devices for a user in PingOne via API
 *
 * Makes a GET request to retrieve all MFA devices registered for a user.
 *
 * @param payload - List MFA devices payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token with user:read permissions
 * @param payload.userId - ID of the user whose MFA devices to list
 * @param payload.limit - Optional limit for number of devices to return
 * @returns Effect that yields the list MFA devices response
 * @throws {PingOneApiError} When API request fails
 * @since 0.0.1
 * @category API Client
 */
export const listPingOneMfaDevices = (
  { envId, token, userId, limit }: ListMfaDevicesPayload
) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    // Build query parameters
    const queryParams = new URLSearchParams()
    if (limit !== undefined) {
      queryParams.append("limit", String(limit))
    }

    const queryString = queryParams.toString()
    const url = queryString
      ? `${apiBaseUrl}/environments/${envId}/users/${userId}/devices?${queryString}`
      : `${apiBaseUrl}/environments/${envId}/users/${userId}/devices`

    const request = HttpClientRequest.get(url).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    return yield* executeCachedRequest(request, PingOneListMfaDevicesResponse)
  })

/**
 * Delete an MFA device for a user in PingOne via API
 *
 * Makes a DELETE request to remove a specific MFA device from a user's account.
 *
 * @param payload - Delete MFA device payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token with user:update permissions
 * @param payload.userId - ID of the user whose MFA device to delete
 * @param payload.deviceId - ID of the MFA device to delete
 * @returns Effect that yields the delete MFA device response
 * @throws {PingOneApiError} When API request fails
 * @since 0.0.1
 * @category API Client
 */
export const deletePingOneMfaDevice = (
  { envId, token, userId, deviceId }: DeleteMfaDevicePayload
) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = HttpClientRequest.del(
      `${apiBaseUrl}/environments/${envId}/users/${userId}/devices/${deviceId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    return yield* executeRequest(request, PingOneDeleteMfaDeviceResponse)
  })

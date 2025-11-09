import { HttpClientRequest, HttpClientResponse } from "@effect/platform"
import { HttpClient } from "@effect/platform/HttpClient"
import type { Schema } from "effect"
import { Effect } from "effect"
import { PingOneApiError } from "../Errors"
import {
  PingOneCreateUserRequest,
  PingOneCreateUserResponse,
  PingOneReadUserResponse,
  PingOneUpdateUserRequest,
  PingOneUpdateUserResponse,
  PingOneVerifyUserRequest,
  PingOneVerifyUserResponse
} from "./PingOneSchemas"
import type {
  CreateUserPayload,
  DeleteUserPayload,
  ReadUserPayload,
  UpdateUserPayload,
  VerifyUserPayload
} from "./PingOneTypes"

/**
 * Creates a user in PingOne via API
 *
 * @param envId - PingOne environment ID
 * @param token - PingOne access token
 * @param userData - User data matching PingOneCreateUserRequest schema
 * @returns Effect that yields the created user response
 */
export const createPingOneUser = <S extends Schema.Schema.Type<typeof PingOneCreateUserRequest>>(
  { envId, token, userData }: CreateUserPayload<S>
) =>
  HttpClientRequest.post(
    `https://api.pingone.com/v1/environments/${envId}/users`
  )
    .pipe(
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
      Effect.flatMap((response) =>
        HttpClientResponse.schemaBodyJson(PingOneCreateUserResponse)(response)
      )
    )

/**
 * Reads a user from PingOne by ID
 *
 * @param envId - PingOne environment ID
 * @param token - PingOne access token
 * @param userId - User ID to read
 * @returns Effect that yields the user data
 */
export const readPingOneUser = (
  { envId, token, userId }: ReadUserPayload
) =>
  Effect.gen(function*() {
    const req = HttpClientRequest.get(
      `https://api.pingone.com/v1/environments/${envId}/users/${userId}?expand=population`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

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

/**
 * Updates a user in PingOne via API
 *
 * @param envId - PingOne environment ID
 * @param token - PingOne access token
 * @param userId - User ID to update
 * @param userData - User data matching PingOneUpdateUserRequest schema
 * @returns Effect that yields the updated user response
 */
export const updatePingOneUser = <S extends Schema.Schema.Type<typeof PingOneUpdateUserRequest>>(
  { envId, token, userId, userData }: UpdateUserPayload<S>
) =>
  HttpClientRequest.put(
    `https://api.pingone.com/v1/environments/${envId}/users/${userId}`
  )
    .pipe(
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
      Effect.flatMap((response) =>
        HttpClientResponse.schemaBodyJson(PingOneUpdateUserResponse)(response)
      )
    )

/**
 * Deletes a user from PingOne
 *
 * @param envId - PingOne environment ID
 * @param token - PingOne access token
 * @param userId - User ID to delete
 * @returns Effect that yields void on success (204 No Content)
 */
export const deletePingOneUser = (
  { envId, token, userId }: DeleteUserPayload
) =>
  Effect.gen(function*() {
    const req = HttpClientRequest.del(
      `https://api.pingone.com/v1/environments/${envId}/users/${userId}`
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

/**
 * Verifies a user account in PingOne with a verification code
 *
 * @param envId - PingOne environment ID
 * @param token - PingOne access token
 * @param userId - User ID to verify
 * @param verificationData - Verification code data
 * @returns Effect that yields the verified user response
 */
export const verifyPingOneUser = <S extends Schema.Schema.Type<typeof PingOneVerifyUserRequest>>(
  { envId, token, userId, verificationData }: VerifyUserPayload<S>
) =>
  HttpClientRequest.post(
    `https://api.pingone.com/v1/environments/${envId}/users/${userId}`
  )
    .pipe(
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
      Effect.flatMap((response) =>
        HttpClientResponse.schemaBodyJson(PingOneVerifyUserResponse)(response)
      )
    )

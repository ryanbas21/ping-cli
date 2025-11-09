/**
 * PingOne Applications HTTP Client
 *
 * Provides functions for managing PingOne applications via the PingOne Management API.
 * Includes operations for creating, reading, updating, and deleting OAuth/OIDC applications.
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
  ApplicationSchema,
  CreateApplicationRequestSchema,
  ListApplicationsResponseSchema,
  UpdateApplicationRequestSchema
} from "./ApplicationSchemas.js"

/**
 * Creates an application in PingOne via API
 *
 * @param payload - Create application payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token
 * @param payload.applicationData - Application data
 * @returns Effect that yields the created application
 * @since 0.0.1
 * @category API Client
 */
export const createApplication = <S extends Schema.Schema.Type<typeof CreateApplicationRequestSchema>>(
  { envId, token, applicationData }: { envId: string; token: string; applicationData: S }
) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const apiBaseUrl = yield* getApiBaseUrl()

    const httpRequest = HttpClientRequest.post(
      `${apiBaseUrl}/environments/${envId}/applications`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.schemaBodyJson(CreateApplicationRequestSchema)(applicationData),
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
      Effect.flatMap((response) => HttpClientResponse.schemaBodyJson(ApplicationSchema)(response))
    )

    return yield* retry.retryableRequest(httpRequest)
  })

/**
 * Reads an application from PingOne via API
 *
 * @param payload - Read application payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token
 * @param payload.applicationId - Application ID
 * @returns Effect that yields the application data
 * @since 0.0.1
 * @category API Client
 */
export const readApplication = ({
  envId,
  token,
  applicationId
}: {
  envId: string
  token: string
  applicationId: string
}) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const cache = yield* CacheService
    const apiBaseUrl = yield* getApiBaseUrl()

    const req = HttpClientRequest.get(
      `${apiBaseUrl}/environments/${envId}/applications/${applicationId}`
    ).pipe(HttpClientRequest.bearerToken(token), HttpClientRequest.accept("application/json"))

    const httpRequest = Effect.gen(function*() {
      const client = yield* HttpClient
      const response = yield* client.execute(req)

      if (response.status >= 200 && response.status < 300) {
        return yield* HttpClientResponse.schemaBodyJson(ApplicationSchema)(response)
      }

      return yield* Effect.fail(
        new PingOneApiError({
          status: response.status,
          message: `PingOne API request failed with status ${response.status}`
        })
      )
    })

    return yield* cache.getCached(req, retry.retryableRequest(httpRequest))
  })

/**
 * Lists applications in PingOne via API
 *
 * @param payload - List applications payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token
 * @param payload.limit - Optional pagination limit
 * @param payload.filter - Optional filter expression
 * @returns Effect that yields paginated list of applications
 * @since 0.0.1
 * @category API Client
 */
export const listApplications = ({
  envId,
  token,
  limit,
  filter
}: {
  envId: string
  token: string
  limit?: number
  filter?: string
}) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const cache = yield* CacheService
    const apiBaseUrl = yield* getApiBaseUrl()

    const url = new URL(`${apiBaseUrl}/environments/${envId}/applications`)

    if (limit !== undefined) {
      url.searchParams.set("limit", limit.toString())
    }
    if (filter !== undefined) {
      url.searchParams.set("filter", filter)
    }

    const req = HttpClientRequest.get(url.toString()).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    const httpRequest = Effect.gen(function*() {
      const client = yield* HttpClient
      const response = yield* client.execute(req)

      if (response.status >= 200 && response.status < 300) {
        return yield* HttpClientResponse.schemaBodyJson(ListApplicationsResponseSchema)(response)
      }

      return yield* Effect.fail(
        new PingOneApiError({
          status: response.status,
          message: `PingOne API request failed with status ${response.status}`
        })
      )
    })

    return yield* cache.getCached(req, retry.retryableRequest(httpRequest))
  })

/**
 * Updates an application in PingOne via API
 *
 * @param payload - Update application payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token
 * @param payload.applicationId - Application ID
 * @param payload.applicationData - Application data to update
 * @returns Effect that yields the updated application
 * @since 0.0.1
 * @category API Client
 */
export const updateApplication = <S extends Schema.Schema.Type<typeof UpdateApplicationRequestSchema>>(
  {
    envId,
    token,
    applicationId,
    applicationData
  }: { envId: string; token: string; applicationId: string; applicationData: S }
) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const apiBaseUrl = yield* getApiBaseUrl()

    const httpRequest = HttpClientRequest.patch(
      `${apiBaseUrl}/environments/${envId}/applications/${applicationId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.schemaBodyJson(UpdateApplicationRequestSchema)(applicationData),
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
      Effect.flatMap((response) => HttpClientResponse.schemaBodyJson(ApplicationSchema)(response))
    )

    return yield* retry.retryableRequest(httpRequest)
  })

/**
 * Deletes an application from PingOne via API
 *
 * @param payload - Delete application payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token
 * @param payload.applicationId - Application ID
 * @returns Effect that yields undefined on success
 * @since 0.0.1
 * @category API Client
 */
export const deleteApplication = ({
  envId,
  token,
  applicationId
}: {
  envId: string
  token: string
  applicationId: string
}) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const apiBaseUrl = yield* getApiBaseUrl()

    const httpRequest = Effect.gen(function*() {
      const req = HttpClientRequest.del(
        `${apiBaseUrl}/environments/${envId}/applications/${applicationId}`
      ).pipe(
        HttpClientRequest.bearerToken(token),
        HttpClientRequest.accept("application/json")
      )

      const client = yield* HttpClient
      const response = yield* client.execute(req)

      if (response.status >= 200 && response.status < 300) {
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

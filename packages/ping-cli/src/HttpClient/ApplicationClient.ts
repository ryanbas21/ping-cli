/**
 * PingOne Applications HTTP Client
 *
 * Provides functions for managing PingOne applications via the PingOne Management API.
 * Includes operations for creating, reading, updating, and deleting OAuth/OIDC applications.
 *
 * @since 0.0.1
 */
import { HttpClientRequest } from "@effect/platform"
import type { Schema } from "effect"
import { Effect } from "effect"
import { getApiBaseUrl } from "../Commands/PingOne/ConfigHelper.js"
import {
  ApplicationSchema,
  CreateApplicationRequestSchema,
  ListApplicationsResponseSchema,
  UpdateApplicationRequestSchema
} from "./ApplicationSchemas.js"
import { executeCachedRequest, executeRequest, executeVoidRequest } from "./helpers.js"

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
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = yield* HttpClientRequest.post(
      `${apiBaseUrl}/environments/${envId}/applications`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.schemaBodyJson(CreateApplicationRequestSchema)(applicationData)
    )

    return yield* executeRequest(request, ApplicationSchema)
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
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = HttpClientRequest.get(
      `${apiBaseUrl}/environments/${envId}/applications/${applicationId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    return yield* executeCachedRequest(request, ApplicationSchema)
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
    const apiBaseUrl = yield* getApiBaseUrl()

    const url = new URL(`${apiBaseUrl}/environments/${envId}/applications`)

    if (limit !== undefined) {
      url.searchParams.set("limit", limit.toString())
    }
    if (filter !== undefined) {
      url.searchParams.set("filter", filter)
    }

    const request = HttpClientRequest.get(url.toString()).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    return yield* executeCachedRequest(request, ListApplicationsResponseSchema)
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
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = yield* HttpClientRequest.patch(
      `${apiBaseUrl}/environments/${envId}/applications/${applicationId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.schemaBodyJson(UpdateApplicationRequestSchema)(applicationData)
    )

    return yield* executeRequest(request, ApplicationSchema)
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
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = HttpClientRequest.del(
      `${apiBaseUrl}/environments/${envId}/applications/${applicationId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    yield* executeVoidRequest(request)
    return undefined
  })

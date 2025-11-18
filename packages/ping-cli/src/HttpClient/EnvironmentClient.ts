/**
 * PingOne Environments HTTP Client
 *
 * Provides functions for managing PingOne environments via the PingOne Management API.
 * Includes operations for reading and listing environments.
 *
 * @internal
 * @since 0.0.2
 */
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import * as Effect from "effect/Effect"
import { getApiBaseUrl } from "../Commands/PingOne/ConfigHelper.js"
import { EnvironmentSchema, ListEnvironmentsResponseSchema } from "./EnvironmentSchemas.js"
import { executeCachedRequest } from "./helpers.js"

/**
 * Reads an environment by ID
 *
 * @param params - Object containing token and environmentId
 * @param params.token - Authentication token
 * @param params.environmentId - Environment ID
 * @returns Effect that yields environment details
 * @since 0.0.2
 * @category API Client
 */
export const readEnvironment = ({
  token,
  environmentId
}: {
  token: string
  environmentId: string
}) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = HttpClientRequest.get(
      `${apiBaseUrl}/environments/${environmentId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    return yield* executeCachedRequest(request, EnvironmentSchema)
  })

/**
 * Lists environments
 *
 * @param params - Object containing token and optional query parameters
 * @param params.token - Authentication token
 * @param params.limit - Optional limit for number of results
 * @param params.filter - Optional filter expression
 * @returns Effect that yields list of environments
 * @since 0.0.2
 * @category API Client
 */
export const listEnvironments = ({
  token,
  limit,
  filter
}: {
  token: string
  limit?: number
  filter?: string
}) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const url = new URL(`${apiBaseUrl}/environments`)

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

    return yield* executeCachedRequest(request, ListEnvironmentsResponseSchema)
  })

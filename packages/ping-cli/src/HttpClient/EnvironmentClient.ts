/**
 * PingOne Environments HTTP Client
 *
 * Provides functions for managing PingOne environments via the PingOne Management API.
 * Includes operations for reading and listing environments.
 *
 * @since 0.0.2
 */
import { HttpClientRequest } from "@effect/platform"
import { Effect } from "effect"
import { getApiBaseUrl } from "../Commands/PingOne/ConfigHelper.js"
import { EnvironmentSchema, ListEnvironmentsResponseSchema } from "./EnvironmentSchemas.js"
import { executeCachedRequest } from "./helpers.js"

/**
 * Reads an environment by ID
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { readEnvironment } from "./EnvironmentClient"
 *
 * const program = Effect.gen(function* () {
 *   const environment = yield* readEnvironment({
 *     token: "your-auth-token",
 *     environmentId: "env-123"
 *   })
 *   console.log(`Environment: ${environment.name} (${environment.type})`)
 *   console.log(`Region: ${environment.region}`)
 * })
 * ```
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
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { listEnvironments } from "./EnvironmentClient"
 *
 * // List all environments
 * const program = Effect.gen(function* () {
 *   const response = yield* listEnvironments({
 *     token: "your-auth-token"
 *   })
 *   const environments = response._embedded.environments
 *   console.log(`Found ${environments.length} environments`)
 * })
 *
 * // List with pagination
 * const limited = Effect.gen(function* () {
 *   const response = yield* listEnvironments({
 *     token: "your-auth-token",
 *     limit: 10
 *   })
 *   const environments = response._embedded.environments
 *   console.log(`Retrieved ${environments.length} environments (max 10)`)
 * })
 *
 * // List with filtering
 * const filtered = Effect.gen(function* () {
 *   const response = yield* listEnvironments({
 *     token: "your-auth-token",
 *     filter: "type eq \"PRODUCTION\""
 *   })
 *   const environments = response._embedded.environments
 *   console.log(`Found ${environments.length} production environments`)
 * })
 * ```
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

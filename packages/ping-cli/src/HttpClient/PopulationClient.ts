/**
 * PingOne Populations HTTP Client
 *
 * Provides functions for managing PingOne populations via the PingOne Management API.
 * Includes operations for creating, reading, updating, and deleting user populations.
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
  CreatePopulationRequestSchema,
  ListPopulationsResponseSchema,
  PopulationSchema,
  UpdatePopulationRequestSchema
} from "./PopulationSchemas.js"

/**
 * Creates a new population in PingOne
 *
 * @param params - Object containing envId, token, and populationData
 * @param params.envId - PingOne environment ID
 * @param params.token - Authentication token
 * @param params.populationData - Population data (name, description)
 * @returns Effect that yields the created population
 * @since 0.0.1
 * @category API Client
 */
export const createPopulation = <S extends Schema.Schema.Type<typeof CreatePopulationRequestSchema>>(
  { envId, token, populationData }: { envId: string; token: string; populationData: S }
) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const apiBaseUrl = yield* getApiBaseUrl()

    const httpRequest = HttpClientRequest.post(
      `${apiBaseUrl}/environments/${envId}/populations`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.schemaBodyJson(CreatePopulationRequestSchema)(populationData),
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
      Effect.flatMap((response) => HttpClientResponse.schemaBodyJson(PopulationSchema)(response))
    )

    return yield* retry.retryableRequest(httpRequest)
  })

/**
 * Reads a population by ID
 *
 * @param params - Object containing envId, token, and populationId
 * @param params.envId - PingOne environment ID
 * @param params.token - Authentication token
 * @param params.populationId - Population ID
 * @returns Effect that yields population details
 * @since 0.0.1
 * @category API Client
 */
export const readPopulation = ({
  envId,
  token,
  populationId
}: {
  envId: string
  token: string
  populationId: string
}) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const cache = yield* CacheService
    const apiBaseUrl = yield* getApiBaseUrl()

    const req = HttpClientRequest.get(
      `${apiBaseUrl}/environments/${envId}/populations/${populationId}`
    ).pipe(HttpClientRequest.bearerToken(token), HttpClientRequest.accept("application/json"))

    const httpRequest = Effect.gen(function*() {
      const client = yield* HttpClient
      const response = yield* client.execute(req)

      if (response.status >= 200 && response.status < 300) {
        return yield* HttpClientResponse.schemaBodyJson(PopulationSchema)(response)
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
 * Lists populations in an environment
 *
 * @param params - Object containing envId, token, and optional query parameters
 * @param params.envId - PingOne environment ID
 * @param params.token - Authentication token
 * @param params.limit - Optional limit for number of results
 * @param params.filter - Optional filter expression
 * @returns Effect that yields list of populations
 * @since 0.0.1
 * @category API Client
 */
export const listPopulations = ({
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

    const url = new URL(`${apiBaseUrl}/environments/${envId}/populations`)

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
        return yield* HttpClientResponse.schemaBodyJson(ListPopulationsResponseSchema)(response)
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
 * Updates a population
 *
 * @param params - Object containing envId, token, populationId, and populationData
 * @param params.envId - PingOne environment ID
 * @param params.token - Authentication token
 * @param params.populationId - Population ID
 * @param params.populationData - Updated population data
 * @returns Effect that yields the updated population
 * @since 0.0.1
 * @category API Client
 */
export const updatePopulation = <S extends Schema.Schema.Type<typeof UpdatePopulationRequestSchema>>(
  {
    envId,
    token,
    populationId,
    populationData
  }: { envId: string; token: string; populationId: string; populationData: S }
) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const apiBaseUrl = yield* getApiBaseUrl()

    const httpRequest = HttpClientRequest.patch(
      `${apiBaseUrl}/environments/${envId}/populations/${populationId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.schemaBodyJson(UpdatePopulationRequestSchema)(populationData),
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
      Effect.flatMap((response) => HttpClientResponse.schemaBodyJson(PopulationSchema)(response))
    )

    return yield* retry.retryableRequest(httpRequest)
  })

/**
 * Deletes a population
 *
 * @param params - Object containing envId, token, and populationId
 * @param params.envId - PingOne environment ID
 * @param params.token - Authentication token
 * @param params.populationId - Population ID
 * @returns Effect that yields void on success
 * @since 0.0.1
 * @category API Client
 */
export const deletePopulation = ({
  envId,
  token,
  populationId
}: {
  envId: string
  token: string
  populationId: string
}) =>
  Effect.gen(function*() {
    const retry = yield* RetryService
    const apiBaseUrl = yield* getApiBaseUrl()

    const httpRequest = Effect.gen(function*() {
      const req = HttpClientRequest.del(
        `${apiBaseUrl}/environments/${envId}/populations/${populationId}`
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

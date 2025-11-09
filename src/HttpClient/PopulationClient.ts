import { HttpClientRequest, HttpClientResponse } from "@effect/platform"
import { HttpClient } from "@effect/platform/HttpClient"
import type { Schema } from "effect"
import { Effect } from "effect"
import { PingOneApiError } from "../Errors.js"
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
 */
export const createPopulation = <S extends Schema.Schema.Type<typeof CreatePopulationRequestSchema>>(
  { envId, token, populationData }: { envId: string; token: string; populationData: S }
) =>
  Effect.gen(function*() {
    const baseReq = HttpClientRequest.post(
      `https://api.pingone.com/v1/environments/${envId}/populations`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json")
    )

    const req = yield* HttpClientRequest.schemaBodyJson(CreatePopulationRequestSchema)(
      populationData
    )(baseReq)

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

/**
 * Reads a population by ID
 *
 * @param params - Object containing envId, token, and populationId
 * @param params.envId - PingOne environment ID
 * @param params.token - Authentication token
 * @param params.populationId - Population ID
 * @returns Effect that yields population details
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
    const req = HttpClientRequest.get(
      `https://api.pingone.com/v1/environments/${envId}/populations/${populationId}`
    ).pipe(HttpClientRequest.bearerToken(token), HttpClientRequest.accept("application/json"))

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

/**
 * Lists populations in an environment
 *
 * @param params - Object containing envId, token, and optional query parameters
 * @param params.envId - PingOne environment ID
 * @param params.token - Authentication token
 * @param params.limit - Optional limit for number of results
 * @param params.filter - Optional filter expression
 * @returns Effect that yields list of populations
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
    let url = `https://api.pingone.com/v1/environments/${envId}/populations`
    const queryParams: Array<string> = []

    if (limit !== undefined) {
      queryParams.push(`limit=${limit}`)
    }

    if (filter !== undefined) {
      queryParams.push(`filter=${encodeURIComponent(filter)}`)
    }

    if (queryParams.length > 0) {
      url += `?${queryParams.join("&")}`
    }

    const req = HttpClientRequest.get(url).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

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

/**
 * Updates a population
 *
 * @param params - Object containing envId, token, populationId, and populationData
 * @param params.envId - PingOne environment ID
 * @param params.token - Authentication token
 * @param params.populationId - Population ID
 * @param params.populationData - Updated population data
 * @returns Effect that yields the updated population
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
    const baseReq = HttpClientRequest.patch(
      `https://api.pingone.com/v1/environments/${envId}/populations/${populationId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json")
    )

    const req = yield* HttpClientRequest.schemaBodyJson(UpdatePopulationRequestSchema)(
      populationData
    )(baseReq)

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

/**
 * Deletes a population
 *
 * @param params - Object containing envId, token, and populationId
 * @param params.envId - PingOne environment ID
 * @param params.token - Authentication token
 * @param params.populationId - Population ID
 * @returns Effect that yields void on success
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
    const req = HttpClientRequest.del(
      `https://api.pingone.com/v1/environments/${envId}/populations/${populationId}`
    ).pipe(HttpClientRequest.bearerToken(token), HttpClientRequest.accept("application/json"))

    const client = yield* HttpClient
    const response = yield* client.execute(req)

    if (response.status >= 200 && response.status < 300) {
      return
    }

    return yield* Effect.fail(
      new PingOneApiError({
        status: response.status,
        message: `PingOne API request failed with status ${response.status}`
      })
    )
  })

/**
 * PingOne Groups HTTP Client
 *
 * Provides functions for managing PingOne groups via the PingOne Management API.
 * Includes operations for creating, reading, updating, and deleting groups, as well as
 * managing group memberships.
 *
 * @internal
 * @since 0.0.1
 */
import * as HttpClientRequest from "@effect/platform/HttpClientRequest"
import type { Schema } from "effect"
import * as Effect from "effect/Effect"
import { getApiBaseUrl } from "../Commands/PingOne/ConfigHelper.js"
import {
  PingOneCreateGroupRequest,
  PingOneCreateGroupResponse,
  PingOneListGroupMembersResponse,
  PingOneListGroupsResponse,
  PingOneReadGroupResponse,
  PingOneUpdateGroupRequest,
  PingOneUpdateGroupResponse
} from "./GroupSchemas.js"
import type {
  AddGroupMemberPayload,
  CreateGroupPayload,
  DeleteGroupPayload,
  ListGroupMembersPayload,
  ListGroupsPayload,
  ReadGroupPayload,
  RemoveGroupMemberPayload,
  UpdateGroupPayload
} from "./GroupTypes.js"
import { executeCachedRequest, executeRequest, executeVoidRequest } from "./helpers.js"

/**
 * Creates a group in PingOne via API
 *
 * Makes a POST request to the PingOne Groups API to create a new group.
 * The request is validated against the PingOneCreateGroupRequest schema and the
 * response is validated against the PingOneCreateGroupResponse schema.
 *
 * @param payload - Create group payload
 * @param payload.envId - PingOne environment ID where the group will be created
 * @param payload.token - PingOne access token with group:create permissions
 * @param payload.groupData - Group data matching PingOneCreateGroupRequest schema
 * @returns Effect that yields the created group response with ID, name, and member counts
 ** @throws {PingOneApiError} When API request fails with non-2xx status code
 * @see {@link PingOneCreateGroupRequest} for request schema definition
 * @see {@link PingOneCreateGroupResponse} for response schema definition
 * @since 0.0.1
 * @category API Client
 */
export const createGroup = <S extends Schema.Schema.Type<typeof PingOneCreateGroupRequest>>(
  { envId, token, groupData }: CreateGroupPayload<S>
) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = yield* HttpClientRequest.post(
      `${apiBaseUrl}/environments/${envId}/groups`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.schemaBodyJson(PingOneCreateGroupRequest)(groupData)
    )

    return yield* executeRequest(request, PingOneCreateGroupResponse)
  })

/**
 * Reads a group from PingOne by ID
 *
 * Makes a GET request to retrieve group information from the PingOne API.
 * Supports optional expansion of related resources.
 *
 * @param payload - Read group payload
 * @param payload.envId - PingOne environment ID containing the group
 * @param payload.token - PingOne access token with group:read permissions
 * @param payload.groupId - Unique identifier of the group to retrieve
 * @param payload.expand - Optional comma-separated list of resources to expand
 * @returns Effect that yields group data including name, description, and member counts
 ** @throws {PingOneApiError} When API request fails (e.g., 404 if group not found)
 * @see {@link PingOneReadGroupResponse} for response schema definition
 * @since 0.0.1
 * @category API Client
 */
export const readGroup = ({ envId, token, groupId, expand }: ReadGroupPayload) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const baseUrl = `${apiBaseUrl}/environments/${envId}/groups/${groupId}`
    const url = expand ? `${baseUrl}?expand=${expand}` : baseUrl

    const request = HttpClientRequest.get(url).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    return yield* executeCachedRequest(request, PingOneReadGroupResponse)
  })

/**
 * Lists groups from PingOne with optional filtering and pagination
 *
 * Makes a GET request to retrieve a list of groups from the PingOne API.
 * Supports filtering, pagination, and expansion of related resources.
 *
 * @param payload - List groups payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token with group:read permissions
 * @param payload.limit - Optional limit for number of results (pagination)
 * @param payload.filter - Optional SCIM filter expression
 * @param payload.expand - Optional comma-separated list of resources to expand
 * @returns Effect that yields paginated list of groups
 ** @throws {PingOneApiError} When API request fails
 * @see {@link PingOneListGroupsResponse} for response schema definition
 * @since 0.0.1
 * @category API Client
 */
export const listGroups = ({ envId, token, limit, filter, expand }: ListGroupsPayload) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const baseUrl = `${apiBaseUrl}/environments/${envId}/groups`
    const params = new URLSearchParams()

    if (limit !== undefined) params.append("limit", String(limit))
    if (filter) params.append("filter", filter)
    if (expand) params.append("expand", expand)

    const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl

    const request = HttpClientRequest.get(url).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    return yield* executeCachedRequest(request, PingOneListGroupsResponse)
  })

/**
 * Updates a group in PingOne via API
 *
 * Makes a PATCH request to update an existing group's information.
 * Only provided fields will be updated; omitted fields remain unchanged.
 * The request is validated against the PingOneUpdateGroupRequest schema.
 *
 * @param payload - Update group payload
 * @param payload.envId - PingOne environment ID containing the group
 * @param payload.token - PingOne access token with group:update permissions
 * @param payload.groupId - Unique identifier of the group to update
 * @param payload.groupData - Group data to update (only modified fields needed)
 * @returns Effect that yields the updated group response with new values
 ** @throws {PingOneApiError} When API request fails (e.g., 404 if group not found, 422 if validation fails)
 * @see {@link PingOneUpdateGroupRequest} for request schema definition
 * @see {@link PingOneUpdateGroupResponse} for response schema definition
 * @since 0.0.1
 * @category API Client
 */
export const updateGroup = <S extends Schema.Schema.Type<typeof PingOneUpdateGroupRequest>>(
  { envId, token, groupId, groupData }: UpdateGroupPayload<S>
) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = yield* HttpClientRequest.patch(
      `${apiBaseUrl}/environments/${envId}/groups/${groupId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json"),
      HttpClientRequest.setHeader("Content-Type", "application/json"),
      HttpClientRequest.schemaBodyJson(PingOneUpdateGroupRequest)(groupData)
    )

    return yield* executeRequest(request, PingOneUpdateGroupResponse)
  })

/**
 * Deletes a group from PingOne
 *
 * Makes a DELETE request to permanently remove a group from the PingOne environment.
 * This operation cannot be undone. Returns undefined on success (HTTP 204 No Content).
 *
 * @param payload - Delete group payload
 * @param payload.envId - PingOne environment ID containing the group
 * @param payload.token - PingOne access token with group:delete permissions
 * @param payload.groupId - Unique identifier of the group to delete
 * @returns Effect that yields undefined on successful deletion
 ** @throws {PingOneApiError} When API request fails (e.g., 404 if group not found, 403 if forbidden)
 * @since 0.0.1
 * @category API Client
 */
export const deleteGroup = ({ envId, token, groupId }: DeleteGroupPayload) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = HttpClientRequest.del(
      `${apiBaseUrl}/environments/${envId}/groups/${groupId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    yield* executeVoidRequest(request)
    return undefined
  })

/**
 * Adds a user to a group in PingOne
 *
 * Makes a POST request to add a user as a member of a group.
 * Returns undefined on success (HTTP 201 Created).
 *
 * @param payload - Add group member payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token with group:update permissions
 * @param payload.groupId - Unique identifier of the group
 * @param payload.userId - Unique identifier of the user to add
 * @returns Effect that yields undefined on successful addition
 ** @throws {PingOneApiError} When API request fails
 * @since 0.0.1
 * @category API Client
 */
export const addGroupMember = ({ envId, token, groupId, userId }: AddGroupMemberPayload) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = HttpClientRequest.post(
      `${apiBaseUrl}/environments/${envId}/groups/${groupId}/users/${userId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    yield* executeVoidRequest(request)
    return undefined
  })

/**
 * Removes a user from a group in PingOne
 *
 * Makes a DELETE request to remove a user's membership from a group.
 * Returns undefined on success (HTTP 204 No Content).
 *
 * @param payload - Remove group member payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token with group:update permissions
 * @param payload.groupId - Unique identifier of the group
 * @param payload.userId - Unique identifier of the user to remove
 * @returns Effect that yields undefined on successful removal
 ** @throws {PingOneApiError} When API request fails
 * @since 0.0.1
 * @category API Client
 */
export const removeGroupMember = ({ envId, token, groupId, userId }: RemoveGroupMemberPayload) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const request = HttpClientRequest.del(
      `${apiBaseUrl}/environments/${envId}/groups/${groupId}/users/${userId}`
    ).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    yield* executeVoidRequest(request)
    return undefined
  })

/**
 * Lists members of a group in PingOne
 *
 * Makes a GET request to retrieve the list of users who are members of a group.
 * Supports pagination via the limit parameter.
 *
 * @param payload - List group members payload
 * @param payload.envId - PingOne environment ID
 * @param payload.token - PingOne access token with group:read permissions
 * @param payload.groupId - Unique identifier of the group
 * @param payload.limit - Optional limit for number of results
 * @returns Effect that yields paginated list of group members
 ** @throws {PingOneApiError} When API request fails
 * @see {@link PingOneListGroupMembersResponse} for response schema definition
 * @since 0.0.1
 * @category API Client
 */
export const listGroupMembers = ({ envId, token, groupId, limit }: ListGroupMembersPayload) =>
  Effect.gen(function*() {
    const apiBaseUrl = yield* getApiBaseUrl()

    const baseUrl = `${apiBaseUrl}/environments/${envId}/groups/${groupId}/users`
    const url = limit !== undefined ? `${baseUrl}?limit=${limit}` : baseUrl

    const request = HttpClientRequest.get(url).pipe(
      HttpClientRequest.bearerToken(token),
      HttpClientRequest.accept("application/json")
    )

    return yield* executeCachedRequest(request, PingOneListGroupMembersResponse)
  })

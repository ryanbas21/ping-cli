import type { Schema } from "effect"
import type { PingOneCreateGroupRequest, PingOneUpdateGroupRequest } from "./GroupSchemas.js"

/**
 * Payload for creating a group
 *
 * @since 0.0.1
 */
export interface CreateGroupPayload<S extends Schema.Schema.Type<typeof PingOneCreateGroupRequest>> {
  envId: string
  token: string
  groupData: S
}

/**
 * Payload for reading a group
 *
 * @since 0.0.1
 */
export interface ReadGroupPayload {
  envId: string
  token: string
  groupId: string
  expand?: string
}

/**
 * Payload for listing groups
 *
 * @since 0.0.1
 */
export interface ListGroupsPayload {
  envId: string
  token: string
  limit?: number
  filter?: string
  expand?: string
}

/**
 * Payload for updating a group
 *
 * @since 0.0.1
 */
export interface UpdateGroupPayload<S extends Schema.Schema.Type<typeof PingOneUpdateGroupRequest>> {
  envId: string
  token: string
  groupId: string
  groupData: S
}

/**
 * Payload for deleting a group
 *
 * @since 0.0.1
 */
export interface DeleteGroupPayload {
  envId: string
  token: string
  groupId: string
}

/**
 * Payload for adding a member to a group
 *
 * @since 0.0.1
 */
export interface AddGroupMemberPayload {
  envId: string
  token: string
  groupId: string
  userId: string
}

/**
 * Payload for removing a member from a group
 *
 * @since 0.0.1
 */
export interface RemoveGroupMemberPayload {
  envId: string
  token: string
  groupId: string
  userId: string
}

/**
 * Payload for listing group members
 *
 * @since 0.0.1
 */
export interface ListGroupMembersPayload {
  envId: string
  token: string
  groupId: string
  limit?: number
}

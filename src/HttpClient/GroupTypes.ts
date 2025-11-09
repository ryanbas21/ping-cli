import type { Schema } from "effect"
import type { PingOneCreateGroupRequest, PingOneUpdateGroupRequest } from "./GroupSchemas"

/**
 * Payload for creating a group
 */
export interface CreateGroupPayload<S extends Schema.Schema.Type<typeof PingOneCreateGroupRequest>> {
  envId: string
  token: string
  groupData: S
}

/**
 * Payload for reading a group
 */
export interface ReadGroupPayload {
  envId: string
  token: string
  groupId: string
  expand?: string
}

/**
 * Payload for listing groups
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
 */
export interface UpdateGroupPayload<S extends Schema.Schema.Type<typeof PingOneUpdateGroupRequest>> {
  envId: string
  token: string
  groupId: string
  groupData: S
}

/**
 * Payload for deleting a group
 */
export interface DeleteGroupPayload {
  envId: string
  token: string
  groupId: string
}

/**
 * Payload for adding a member to a group
 */
export interface AddGroupMemberPayload {
  envId: string
  token: string
  groupId: string
  userId: string
}

/**
 * Payload for removing a member from a group
 */
export interface RemoveGroupMemberPayload {
  envId: string
  token: string
  groupId: string
  userId: string
}

/**
 * Payload for listing group members
 */
export interface ListGroupMembersPayload {
  envId: string
  token: string
  groupId: string
  limit?: number
}

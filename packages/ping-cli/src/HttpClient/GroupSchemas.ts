import * as Schema from "effect/Schema"

/**
 * Schema for population reference in group
 */
export const GroupPopulationSchema = Schema.Struct({
  id: Schema.String
})

/**
 * Schema for environment reference in group responses
 */
export const GroupEnvironmentSchema = Schema.Struct({
  id: Schema.String
})

/**
 * Schema for creating a group in PingOne
 * Based on PingOne API documentation
 */
export const PingOneCreateGroupRequest = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  population: Schema.optional(GroupPopulationSchema),
  userFilter: Schema.optional(Schema.String),
  externalId: Schema.optional(Schema.String)
})

/**
 * Schema for PingOne API response when creating a group
 */
export const PingOneCreateGroupResponse = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
  environment: GroupEnvironmentSchema,
  population: Schema.optional(GroupPopulationSchema),
  userFilter: Schema.optional(Schema.String),
  externalId: Schema.optional(Schema.String),
  custom: Schema.Boolean,
  createdAt: Schema.String,
  updatedAt: Schema.String,
  totalMemberCounts: Schema.optional(
    Schema.Struct({
      directMembers: Schema.Number,
      totalMembers: Schema.Number
    })
  )
})

/**
 * Schema for reading a group (same structure as create response)
 */
export const PingOneReadGroupResponse = PingOneCreateGroupResponse

/**
 * Schema for updating a group in PingOne
 * All fields are optional for PATCH operations
 */
export const PingOneUpdateGroupRequest = Schema.Struct({
  name: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  userFilter: Schema.optional(Schema.String),
  externalId: Schema.optional(Schema.String)
})

/**
 * Schema for update group response
 */
export const PingOneUpdateGroupResponse = PingOneCreateGroupResponse

/**
 * Schema for list groups response (embedded format)
 */
export const PingOneListGroupsResponse = Schema.Struct({
  _embedded: Schema.Struct({
    groups: Schema.Array(PingOneCreateGroupResponse)
  }),
  _links: Schema.optional(
    Schema.Struct({
      self: Schema.optional(Schema.Struct({ href: Schema.String })),
      next: Schema.optional(Schema.Struct({ href: Schema.String }))
    })
  ),
  count: Schema.optional(Schema.Number),
  size: Schema.optional(Schema.Number)
})

/**
 * Schema for user reference in group membership
 */
export const GroupMemberSchema = Schema.Struct({
  id: Schema.String,
  _links: Schema.optional(
    Schema.Struct({
      self: Schema.optional(Schema.Struct({ href: Schema.String }))
    })
  )
})

/**
 * Schema for list group members response
 */
export const PingOneListGroupMembersResponse = Schema.Struct({
  _embedded: Schema.Struct({
    users: Schema.Array(GroupMemberSchema)
  }),
  _links: Schema.optional(
    Schema.Struct({
      self: Schema.optional(Schema.Struct({ href: Schema.String })),
      next: Schema.optional(Schema.Struct({ href: Schema.String }))
    })
  ),
  count: Schema.optional(Schema.Number),
  size: Schema.optional(Schema.Number)
})

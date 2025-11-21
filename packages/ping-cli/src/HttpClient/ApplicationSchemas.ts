/**
 * PingOne Application API Schemas
 *
 * Schema definitions for PingOne application resources.
 * Applications represent OAuth/OIDC clients and other integrations.
 *
 * @internal
 * @since 0.0.1
 */
import { Schema } from "effect"

/**
 * Schema for Application in PingOne
 * Note: Applications have many type-specific fields, so we use a lenient schema
 * that accepts unknown additional properties.
 *
 * @since 0.0.1
 */
const ApplicationBaseSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
  enabled: Schema.Boolean,
  type: Schema.String,
  protocol: Schema.String,
  createdAt: Schema.optional(Schema.String),
  updatedAt: Schema.optional(Schema.String),
  homePageUrl: Schema.optional(Schema.String),
  loginPageUrl: Schema.optional(Schema.String),
  icon: Schema.optional(
    Schema.Struct({
      id: Schema.String,
      href: Schema.String
    })
  ),
  accessControl: Schema.optional(Schema.Unknown),
  grantTypes: Schema.optional(Schema.Array(Schema.String)),
  tokenEndpointAuthMethod: Schema.optional(Schema.String),
  redirectUris: Schema.optional(Schema.Array(Schema.String)),
  postLogoutRedirectUris: Schema.optional(Schema.Array(Schema.String)),
  responseTypes: Schema.optional(Schema.Array(Schema.String)),
  pkceEnforcement: Schema.optional(Schema.String),
  refreshTokenDuration: Schema.optional(Schema.Number),
  refreshTokenRollingDuration: Schema.optional(Schema.Number),
  environment: Schema.optional(
    Schema.Struct({
      id: Schema.String
    })
  ),
  _links: Schema.optional(Schema.Unknown)
})

export const ApplicationSchema = Schema.extend(
  ApplicationBaseSchema,
  Schema.Record({ key: Schema.String, value: Schema.Unknown })
).annotations({ identifier: "Application" })

/**
 * Type inferred from ApplicationSchema
 *
 * @since 0.0.1
 */
export type Application = typeof ApplicationSchema.Type

/**
 * Schema for embedded applications in list response
 *
 * @since 0.0.1
 */
export const ApplicationsEmbeddedSchema = Schema.Struct({
  applications: Schema.Array(ApplicationSchema)
})

/**
 * Schema for list applications response
 *
 * @since 0.0.1
 */
export const ListApplicationsResponseSchema = Schema.Struct({
  _embedded: ApplicationsEmbeddedSchema,
  count: Schema.optional(Schema.Number),
  size: Schema.optional(Schema.Number)
})

/**
 * Type for list applications response
 *
 * @since 0.0.1
 */
export type ListApplicationsResponse = typeof ListApplicationsResponseSchema.Type

/**
 * Schema for create application request
 *
 * @since 0.0.1
 */
export const CreateApplicationRequestSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String),
  enabled: Schema.optional(Schema.Boolean),
  type: Schema.String,
  protocol: Schema.String
})

/**
 * Type for create application request
 *
 * @since 0.0.1
 */
export type CreateApplicationRequest = typeof CreateApplicationRequestSchema.Type

/**
 * Schema for update application request
 *
 * @since 0.0.1
 */
export const UpdateApplicationRequestSchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  enabled: Schema.optional(Schema.Boolean)
})

/**
 * Type for update application request
 *
 * @since 0.0.1
 */
export type UpdateApplicationRequest = typeof UpdateApplicationRequestSchema.Type

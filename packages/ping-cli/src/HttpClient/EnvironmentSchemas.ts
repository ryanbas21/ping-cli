/**
 * PingOne Environment API Schemas
 *
 * Schema definitions for PingOne environment resources.
 * Environments are isolated containers for identity configurations.
 *
 * @internal
 * @since 0.0.2
 */
import { Schema } from "effect"

/**
 * License information schema
 *
 * @since 0.0.2
 * @category Schemas
 */
export const LicenseSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.optional(Schema.String)
})

/**
 * Environment type
 *
 * @since 0.0.2
 * @category Schemas
 */
export const EnvironmentTypeSchema = Schema.Literal("PRODUCTION", "SANDBOX")

/**
 * Environment schema
 *
 * @since 0.0.2
 * @category Schemas
 */
export const EnvironmentSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
  type: EnvironmentTypeSchema,
  region: Schema.String,
  license: LicenseSchema,
  createdAt: Schema.DateTimeUtc,
  updatedAt: Schema.DateTimeUtc
})

/**
 * HAL links schema for pagination
 *
 * @since 0.0.2
 * @category Schemas
 */
export const HalLinksSchema = Schema.Struct({
  self: Schema.optional(
    Schema.Struct({
      href: Schema.String
    })
  ),
  next: Schema.optional(
    Schema.Struct({
      href: Schema.String
    })
  )
})

/**
 * List environments response schema
 *
 * @since 0.0.2
 * @category Schemas
 */
export const ListEnvironmentsResponseSchema = Schema.Struct({
  _embedded: Schema.Struct({
    environments: Schema.Array(EnvironmentSchema)
  }),
  _links: Schema.optional(HalLinksSchema)
})

/**
 * Environment type definition
 *
 * @since 0.0.2
 * @category Models
 */
export type Environment = Schema.Schema.Type<typeof EnvironmentSchema>

/**
 * List environments response type definition
 *
 * @since 0.0.2
 * @category Models
 */
export type ListEnvironmentsResponse = Schema.Schema.Type<typeof ListEnvironmentsResponseSchema>

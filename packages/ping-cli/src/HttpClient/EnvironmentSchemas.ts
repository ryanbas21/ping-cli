/**
 * PingOne Environment API Schemas
 *
 * Schema definitions for PingOne environment resources.
 * Environments are isolated containers for identity configurations.
 *
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
  name: Schema.String
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
 * List environments response schema
 *
 * @since 0.0.2
 * @category Schemas
 */
export const ListEnvironmentsResponseSchema = Schema.Struct({
  _embedded: Schema.Struct({
    environments: Schema.Array(EnvironmentSchema)
  })
})

/**
 * Type definitions
 */
export type Environment = Schema.Schema.Type<typeof EnvironmentSchema>
export type ListEnvironmentsResponse = Schema.Schema.Type<typeof ListEnvironmentsResponseSchema>

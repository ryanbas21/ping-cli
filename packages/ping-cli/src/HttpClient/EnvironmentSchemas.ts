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
 * @example
 * ```ts
 * import { Schema } from "effect"
 * import { LicenseSchema } from "./EnvironmentSchemas"
 *
 * const license = Schema.decodeUnknownSync(LicenseSchema)({
 *   id: "lic-123",
 *   name: "Production License"
 * })
 * ```
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
 * @example
 * ```ts
 * import { Schema } from "effect"
 * import { EnvironmentTypeSchema } from "./EnvironmentSchemas"
 *
 * // Valid environment types
 * const prodType = Schema.decodeUnknownSync(EnvironmentTypeSchema)("PRODUCTION")
 * const sandboxType = Schema.decodeUnknownSync(EnvironmentTypeSchema)("SANDBOX")
 * ```
 *
 * @since 0.0.2
 * @category Schemas
 */
export const EnvironmentTypeSchema = Schema.Literal("PRODUCTION", "SANDBOX")

/**
 * Environment schema
 *
 * @example
 * ```ts
 * import { Schema } from "effect"
 * import { EnvironmentSchema } from "./EnvironmentSchemas"
 *
 * const environment = Schema.decodeUnknownSync(EnvironmentSchema)({
 *   id: "env-123",
 *   name: "Production",
 *   description: "Production environment",
 *   type: "PRODUCTION",
 *   region: "NA",
 *   license: {
 *     id: "lic-123",
 *     name: "Production License"
 *   },
 *   createdAt: "2024-01-01T00:00:00Z",
 *   updatedAt: "2024-01-01T00:00:00Z"
 * })
 * ```
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
 * @example
 * ```ts
 * import { Schema } from "effect"
 * import { HalLinksSchema } from "./EnvironmentSchemas"
 *
 * // Links with self and next pagination
 * const links = Schema.decodeUnknownSync(HalLinksSchema)({
 *   self: { href: "https://api.pingone.com/v1/environments?limit=10" },
 *   next: { href: "https://api.pingone.com/v1/environments?limit=10&cursor=abc123" }
 * })
 * ```
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
 * @example
 * ```ts
 * import { Schema } from "effect"
 * import { ListEnvironmentsResponseSchema } from "./EnvironmentSchemas"
 *
 * // Response with embedded environments
 * const response = Schema.decodeUnknownSync(ListEnvironmentsResponseSchema)({
 *   _embedded: {
 *     environments: [
 *       {
 *         id: "env-123",
 *         name: "Production",
 *         type: "PRODUCTION",
 *         region: "NA",
 *         license: { id: "lic-123", name: "Production License" },
 *         createdAt: "2024-01-01T00:00:00Z",
 *         updatedAt: "2024-01-01T00:00:00Z"
 *       }
 *     ]
 *   },
 *   _links: {
 *     self: { href: "https://api.pingone.com/v1/environments?limit=10" },
 *     next: { href: "https://api.pingone.com/v1/environments?limit=10&cursor=abc" }
 *   }
 * })
 * ```
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
 * Type definitions
 */
export type Environment = Schema.Schema.Type<typeof EnvironmentSchema>
export type ListEnvironmentsResponse = Schema.Schema.Type<typeof ListEnvironmentsResponseSchema>

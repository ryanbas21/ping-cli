import { Schema } from "effect"

/**
 * Schema for Population in PingOne
 *
 * @since 0.0.1
 */
export const PopulationSchema = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  description: Schema.optional(Schema.String),
  default: Schema.Boolean,
  passwordPolicy: Schema.optional(
    Schema.Struct({
      id: Schema.String
    })
  ),
  environment: Schema.optional(
    Schema.Struct({
      id: Schema.String
    })
  ),
  userCount: Schema.optional(Schema.Number),
  preferredLanguage: Schema.optional(Schema.String),
  theme: Schema.optional(
    Schema.Struct({
      id: Schema.String
    })
  ),
  createdAt: Schema.optional(Schema.String),
  updatedAt: Schema.optional(Schema.String),
  _links: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown }))
})

/**
 * Type inferred from PopulationSchema
 *
 * @since 0.0.1
 */
export type Population = typeof PopulationSchema.Type

/**
 * Schema for the embedded populations response
 *
 * @since 0.0.1
 */
export const PopulationsEmbeddedSchema = Schema.Struct({
  populations: Schema.Array(PopulationSchema)
})

/**
 * Schema for the list populations response
 *
 * @since 0.0.1
 */
export const ListPopulationsResponseSchema = Schema.Struct({
  _embedded: PopulationsEmbeddedSchema,
  count: Schema.optional(Schema.Number),
  size: Schema.optional(Schema.Number)
})

/**
 * Type for list populations response
 *
 * @since 0.0.1
 */
export type ListPopulationsResponse = typeof ListPopulationsResponseSchema.Type

/**
 * Schema for population creation request
 *
 * @since 0.0.1
 */
export const CreatePopulationRequestSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String)
})

/**
 * Type for create population request
 *
 * @since 0.0.1
 */
export type CreatePopulationRequest = typeof CreatePopulationRequestSchema.Type

/**
 * Schema for population update request
 *
 * @since 0.0.1
 */
export const UpdatePopulationRequestSchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String)
})

/**
 * Type for update population request
 *
 * @since 0.0.1
 */
export type UpdatePopulationRequest = typeof UpdatePopulationRequestSchema.Type

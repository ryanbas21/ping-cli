import { Schema } from "effect"

/**
 * Schema for Population in PingOne
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
  createdAt: Schema.optional(Schema.String),
  updatedAt: Schema.optional(Schema.String)
})

/**
 * Type inferred from PopulationSchema
 */
export type Population = typeof PopulationSchema.Type

/**
 * Schema for the embedded populations response
 */
export const PopulationsEmbeddedSchema = Schema.Struct({
  populations: Schema.Array(PopulationSchema)
})

/**
 * Schema for the list populations response
 */
export const ListPopulationsResponseSchema = Schema.Struct({
  _embedded: PopulationsEmbeddedSchema,
  count: Schema.optional(Schema.Number),
  size: Schema.optional(Schema.Number)
})

/**
 * Type for list populations response
 */
export type ListPopulationsResponse = typeof ListPopulationsResponseSchema.Type

/**
 * Schema for population creation request
 */
export const CreatePopulationRequestSchema = Schema.Struct({
  name: Schema.String,
  description: Schema.optional(Schema.String)
})

/**
 * Type for create population request
 */
export type CreatePopulationRequest = typeof CreatePopulationRequestSchema.Type

/**
 * Schema for population update request
 */
export const UpdatePopulationRequestSchema = Schema.Struct({
  name: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String)
})

/**
 * Type for update population request
 */
export type UpdatePopulationRequest = typeof UpdatePopulationRequestSchema.Type

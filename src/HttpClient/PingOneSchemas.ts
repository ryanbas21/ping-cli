import * as Schema from "effect/Schema"

/**
 * Schema for user name structure in PingOne
 */
export const PingOneUserNameSchema = Schema.Struct({
  given: Schema.optional(Schema.String),
  family: Schema.optional(Schema.String)
})

/**
 * Schema for population reference in PingOne
 */
export const PingOnePopulationSchema = Schema.Struct({
  id: Schema.String
})

/**
 * Schema for creating a user in PingOne
 * Based on PingOne API documentation
 */
export const PingOneCreateUserRequest = Schema.Struct({
  username: Schema.String,
  email: Schema.String,
  name: Schema.optional(PingOneUserNameSchema),
  population: PingOnePopulationSchema,
  department: Schema.optional(Schema.String),
  locales: Schema.optional(Schema.Array(Schema.String))
})

/**
 * Schema for environment reference in PingOne responses
 */
export const PingOneEnvironmentSchema = Schema.Struct({
  id: Schema.String
})

/**
 * Schema for lifecycle status in PingOne responses
 */
export const PingOneLifecycleSchema = Schema.Struct({
  status: Schema.String
})

/**
 * Schema for PingOne API response when creating a user
 */
export const PingOneCreateUserResponse = Schema.Struct({
  id: Schema.String,
  environment: PingOneEnvironmentSchema,
  population: PingOnePopulationSchema,
  createdAt: Schema.String,
  email: Schema.String,
  enabled: Schema.Boolean,
  lifecycle: PingOneLifecycleSchema,
  mfaEnabled: Schema.Boolean,
  name: Schema.optional(PingOneUserNameSchema),
  locales: Schema.optional(Schema.Array(Schema.String)),
  updatedAt: Schema.String,
  username: Schema.String,
  department: Schema.optional(Schema.String)
})

/**
 * Schema for reading a user (same structure as create response)
 */
export const PingOneReadUserResponse = PingOneCreateUserResponse

/**
 * Schema for extended name structure in update operations
 */
export const PingOneExtendedNameSchema = Schema.Struct({
  formatted: Schema.optional(Schema.String),
  given: Schema.optional(Schema.String),
  middle: Schema.optional(Schema.String),
  family: Schema.optional(Schema.String),
  honorificPrefix: Schema.optional(Schema.String),
  honorificSuffix: Schema.optional(Schema.String)
})

/**
 * Schema for photo in update operations
 */
export const PingOnePhotoSchema = Schema.Struct({
  href: Schema.String
})

/**
 * Schema for address in update operations
 */
export const PingOneAddressSchema = Schema.Struct({
  streetAddress: Schema.optional(Schema.String),
  locality: Schema.optional(Schema.String),
  region: Schema.optional(Schema.String),
  postalCode: Schema.optional(Schema.String),
  countryCode: Schema.optional(Schema.String)
})

/**
 * Schema for updating a user in PingOne
 * Based on PingOne API documentation for PUT /users/:id
 */
export const PingOneUpdateUserRequest = Schema.Struct({
  username: Schema.optional(Schema.String),
  name: Schema.optional(PingOneExtendedNameSchema),
  nickname: Schema.optional(Schema.String),
  title: Schema.optional(Schema.String),
  preferredLanguage: Schema.optional(Schema.String),
  locale: Schema.optional(Schema.String),
  email: Schema.optional(Schema.String),
  primaryPhone: Schema.optional(Schema.String),
  mobilePhone: Schema.optional(Schema.String),
  photo: Schema.optional(PingOnePhotoSchema),
  address: Schema.optional(PingOneAddressSchema),
  accountId: Schema.optional(Schema.String),
  type: Schema.optional(Schema.String),
  timezone: Schema.optional(Schema.String)
})

/**
 * Schema for update user response (includes all fields from update request plus system fields)
 */
export const PingOneUpdateUserResponse = Schema.Struct({
  id: Schema.String,
  environment: PingOneEnvironmentSchema,
  population: PingOnePopulationSchema,
  createdAt: Schema.String,
  email: Schema.optional(Schema.String),
  enabled: Schema.Boolean,
  lifecycle: PingOneLifecycleSchema,
  mfaEnabled: Schema.Boolean,
  name: Schema.optional(PingOneExtendedNameSchema),
  updatedAt: Schema.String,
  username: Schema.optional(Schema.String),
  nickname: Schema.optional(Schema.String),
  title: Schema.optional(Schema.String),
  preferredLanguage: Schema.optional(Schema.String),
  locale: Schema.optional(Schema.String),
  primaryPhone: Schema.optional(Schema.String),
  mobilePhone: Schema.optional(Schema.String),
  photo: Schema.optional(PingOnePhotoSchema),
  address: Schema.optional(PingOneAddressSchema),
  accountId: Schema.optional(Schema.String),
  type: Schema.optional(Schema.String),
  timezone: Schema.optional(Schema.String)
})

/**
 * Schema for verifying a user account
 */
export const PingOneVerifyUserRequest = Schema.Struct({
  verificationCode: Schema.String
})

/**
 * Schema for verify user response (same as read user)
 */
export const PingOneVerifyUserResponse = PingOneCreateUserResponse

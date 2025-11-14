import * as Schema from "effect/Schema"

/**
 * Schema for user name structure in PingOne
 *
 * @since 0.0.1
 */
export const PingOneUserNameSchema = Schema.Struct({
  given: Schema.optional(Schema.String),
  family: Schema.optional(Schema.String)
})

/**
 * Schema for population reference in PingOne
 *
 * @since 0.0.1
 */
export const PingOnePopulationSchema = Schema.Struct({
  id: Schema.String
})

/**
 * Schema for creating a user in PingOne
 * Based on PingOne API documentation
 *
 * @since 0.0.1
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
 *
 * @since 0.0.1
 */
export const PingOneEnvironmentSchema = Schema.Struct({
  id: Schema.String
})

/**
 * Schema for lifecycle status in PingOne responses
 *
 * @since 0.0.1
 */
export const PingOneLifecycleSchema = Schema.Struct({
  status: Schema.String
})

/**
 * Schema for PingOne API response when creating a user
 *
 * @since 0.0.1
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
  department: Schema.optional(Schema.String),
  account: Schema.optional(Schema.Struct({
    canAuthenticate: Schema.optional(Schema.Boolean),
    status: Schema.optional(Schema.String)
  })),
  identityProvider: Schema.optional(Schema.Struct({
    type: Schema.String
  })),
  verifyStatus: Schema.optional(Schema.String),
  _links: Schema.optional(Schema.Record({ key: Schema.String, value: Schema.Unknown }))
})

/**
 * Schema for reading a user (same structure as create response)
 *
 * @since 0.0.1
 */
export const PingOneReadUserResponse = PingOneCreateUserResponse

/**
 * Schema for extended name structure in update operations
 *
 * @since 0.0.1
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
 *
 * @since 0.0.1
 */
export const PingOnePhotoSchema = Schema.Struct({
  href: Schema.String
})

/**
 * Schema for address in update operations
 *
 * @since 0.0.1
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
 *
 * @since 0.0.1
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
 *
 * @since 0.0.1
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
 *
 * @since 0.0.1
 */
export const PingOneVerifyUserRequest = Schema.Struct({
  verificationCode: Schema.String
})

/**
 * Schema for verify user response (same as read user)
 *
 * @since 0.0.1
 */
export const PingOneVerifyUserResponse = PingOneCreateUserResponse

/**
 * Schema for setting a user's password
 *
 * @since 0.0.1
 */
export const PingOneSetPasswordRequest = Schema.Struct({
  value: Schema.String,
  forceChange: Schema.optional(Schema.Boolean)
})

/**
 * Schema for set password response
 *
 * @since 0.0.1
 */
export const PingOneSetPasswordResponse = Schema.Struct({
  id: Schema.String,
  environment: PingOneEnvironmentSchema,
  status: Schema.String
})

/**
 * Schema for password reset/recovery request
 *
 * @since 0.0.1
 */
export const PingOnePasswordResetRequest = Schema.Struct({
  email: Schema.String
})

/**
 * Schema for password reset/recovery response
 *
 * @since 0.0.1
 */
export const PingOnePasswordResetResponse = Schema.Struct({
  id: Schema.String,
  status: Schema.String
})

/**
 * Schema for pagination links in list responses
 *
 * @since 0.0.1
 */
export const PingOnePaginationLinksSchema = Schema.Struct({
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
 * Schema for list users response
 *
 * @since 0.0.1
 */
export const PingOneListUsersResponse = Schema.Struct({
  _embedded: Schema.Struct({
    users: Schema.Array(PingOneCreateUserResponse)
  }),
  _links: Schema.optional(PingOnePaginationLinksSchema),
  count: Schema.optional(Schema.Number),
  size: Schema.optional(Schema.Number)
})

/**
 * Schema for account authentication settings
 *
 * @since 0.0.1
 */
export const PingOneAccountSchema = Schema.Struct({
  canAuthenticate: Schema.optional(Schema.Boolean)
})

/**
 * Schema for updating user status (enable/disable)
 *
 * @since 0.0.1
 */
export const PingOneUpdateUserStatusRequest = Schema.Struct({
  enabled: Schema.Boolean
})

/**
 * Schema for updating user account lock status
 *
 * @since 0.0.1
 */
export const PingOneUpdateUserAccountRequest = Schema.Struct({
  account: PingOneAccountSchema
})

/**
 * Schema for user status update response
 *
 * @since 0.0.1
 */
export const PingOneUserStatusResponse = Schema.Struct({
  id: Schema.String,
  environment: PingOneEnvironmentSchema,
  enabled: Schema.Boolean,
  lifecycle: PingOneLifecycleSchema,
  updatedAt: Schema.String
})

/**
 * Schema for session information in PingOne
 *
 * @since 0.0.1
 */
export const PingOneSessionSchema = Schema.Struct({
  id: Schema.String,
  createdAt: Schema.String,
  expiresAt: Schema.optional(Schema.String),
  lastUsedAt: Schema.optional(Schema.String),
  application: Schema.optional(
    Schema.Struct({
      id: Schema.String,
      name: Schema.optional(Schema.String)
    })
  )
})

/**
 * Schema for list sessions response
 *
 * @since 0.0.1
 */
export const PingOneListSessionsResponse = Schema.Struct({
  _embedded: Schema.Struct({
    sessions: Schema.Array(PingOneSessionSchema)
  }),
  _links: Schema.optional(PingOnePaginationLinksSchema),
  count: Schema.optional(Schema.Number),
  size: Schema.optional(Schema.Number)
})

/**
 * Schema for revoke session response
 *
 * @since 0.0.1
 */
export const PingOneRevokeSessionResponse = Schema.Struct({
  id: Schema.String,
  status: Schema.String
})

/**
 * Schema for updating user MFA status
 *
 * @since 0.0.1
 */
export const PingOneUpdateMfaRequest = Schema.Struct({
  mfaEnabled: Schema.Boolean
})

/**
 * Schema for MFA update response
 *
 * @since 0.0.1
 */
export const PingOneUpdateMfaResponse = Schema.Struct({
  id: Schema.String,
  environment: PingOneEnvironmentSchema,
  mfaEnabled: Schema.Boolean,
  updatedAt: Schema.String
})

/**
 * Schema for MFA device information
 *
 * @since 0.0.1
 */
export const PingOneMfaDeviceSchema = Schema.Struct({
  id: Schema.String,
  type: Schema.String,
  status: Schema.optional(Schema.String),
  name: Schema.optional(Schema.String),
  nickname: Schema.optional(Schema.String),
  createdAt: Schema.String,
  updatedAt: Schema.String
})

/**
 * Schema for list MFA devices response
 *
 * @since 0.0.1
 */
export const PingOneListMfaDevicesResponse = Schema.Struct({
  _embedded: Schema.Struct({
    devices: Schema.Array(PingOneMfaDeviceSchema)
  }),
  _links: Schema.optional(PingOnePaginationLinksSchema),
  count: Schema.optional(Schema.Number),
  size: Schema.optional(Schema.Number)
})

/**
 * Schema for delete MFA device response
 *
 * @since 0.0.1
 */
export const PingOneDeleteMfaDeviceResponse = Schema.Struct({
  id: Schema.String,
  status: Schema.String
})

/**
 * Schema for bulk import user CSV row
 *
 * @since 0.0.1
 */
export const PingOneBulkImportUserSchema = Schema.Struct({
  username: Schema.String,
  email: Schema.String,
  givenName: Schema.optional(Schema.String),
  familyName: Schema.optional(Schema.String),
  department: Schema.optional(Schema.String),
  populationId: Schema.String
})

/**
 * Schema for bulk import result
 *
 * @since 0.0.1
 */
export const PingOneBulkImportResultSchema = Schema.Struct({
  total: Schema.Number,
  successful: Schema.Number,
  failed: Schema.Number,
  errors: Schema.Array(Schema.Struct({
    row: Schema.Number,
    username: Schema.String,
    error: Schema.String
  }))
})

/**
 * Schema for bulk delete user ID
 *
 * @since 0.0.1
 */
export const PingOneBulkDeleteUserSchema = Schema.Struct({
  userId: Schema.String
})

/**
 * Schema for bulk delete result
 *
 * @since 0.0.1
 */
export const PingOneBulkDeleteResultSchema = Schema.Struct({
  total: Schema.Number,
  successful: Schema.Number,
  failed: Schema.Number,
  errors: Schema.Array(Schema.Struct({
    userId: Schema.String,
    error: Schema.String
  }))
})

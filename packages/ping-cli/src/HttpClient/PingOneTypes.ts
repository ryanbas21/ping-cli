import type * as Schema from "effect/Schema"
import type {
  PingOneCreateUserRequest,
  PingOneCreateUserResponse,
  PingOnePasswordResetRequest,
  PingOneSetPasswordRequest,
  PingOneUpdateUserRequest,
  PingOneVerifyUserRequest
} from "./PingOneSchemas.js"

/**
 * TypeScript interface for PingOne user creation payload
 *
 * @since 0.0.1
 */
export interface CreateUserPayload<S> {
  readonly envId: string
  readonly token: string
  readonly userData: S
}

/**
 * TypeScript interface for PingOne read user payload
 *
 * @since 0.0.1
 */
export interface ReadUserPayload {
  readonly envId: string
  readonly token: string
  readonly userId: string
}

/**
 * TypeScript interface for PingOne update user payload
 *
 * @since 0.0.1
 */
export interface UpdateUserPayload<S> {
  readonly envId: string
  readonly token: string
  readonly userId: string
  readonly userData: S
}

/**
 * TypeScript interface for PingOne delete user payload
 *
 * @since 0.0.1
 */
export interface DeleteUserPayload {
  readonly envId: string
  readonly token: string
  readonly userId: string
}

/**
 * TypeScript interface for PingOne verify user payload
 *
 * @since 0.0.1
 */
export interface VerifyUserPayload<S> {
  readonly envId: string
  readonly token: string
  readonly userId: string
  readonly verificationData: S
}

/**
 * Type alias for PingOne create user request data
 *
 * @since 0.0.1
 */
export type PingOneUserData = Schema.Schema.Type<typeof PingOneCreateUserRequest>

/**
 * Type alias for PingOne create user response data
 *
 * @since 0.0.1
 */
export type PingOneUserResponse = Schema.Schema.Type<typeof PingOneCreateUserResponse>

/**
 * Type alias for PingOne update user request data
 *
 * @since 0.0.1
 */
export type PingOneUpdateUserData = Schema.Schema.Type<typeof PingOneUpdateUserRequest>

/**
 * Type alias for PingOne verify user request data
 *
 * @since 0.0.1
 */
export type PingOneVerifyUserData = Schema.Schema.Type<typeof PingOneVerifyUserRequest>

/**
 * TypeScript interface for PingOne set password payload
 *
 * @since 0.0.1
 */
export interface SetPasswordPayload<S> {
  readonly envId: string
  readonly token: string
  readonly userId: string
  readonly passwordData: S
}

/**
 * TypeScript interface for PingOne password reset payload
 *
 * @since 0.0.1
 */
export interface PasswordResetPayload<S> {
  readonly envId: string
  readonly token: string
  readonly resetData: S
}

/**
 * Type alias for PingOne set password request data
 *
 * @since 0.0.1
 */
export type PingOneSetPasswordData = Schema.Schema.Type<typeof PingOneSetPasswordRequest>

/**
 * Type alias for PingOne password reset request data
 *
 * @since 0.0.1
 */
export type PingOnePasswordResetData = Schema.Schema.Type<typeof PingOnePasswordResetRequest>

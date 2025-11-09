import type * as Schema from "effect/Schema"
import type {
  PingOneCreateUserRequest,
  PingOneCreateUserResponse,
  PingOneUpdateUserRequest,
  PingOneVerifyUserRequest
} from "./PingOneSchemas.js"

/**
 * TypeScript interface for PingOne user creation payload
 */
export interface CreateUserPayload<S> {
  readonly envId: string
  readonly token: string
  readonly userData: S
}

/**
 * TypeScript interface for PingOne read user payload
 */
export interface ReadUserPayload {
  readonly envId: string
  readonly token: string
  readonly userId: string
}

/**
 * TypeScript interface for PingOne update user payload
 */
export interface UpdateUserPayload<S> {
  readonly envId: string
  readonly token: string
  readonly userId: string
  readonly userData: S
}

/**
 * TypeScript interface for PingOne delete user payload
 */
export interface DeleteUserPayload {
  readonly envId: string
  readonly token: string
  readonly userId: string
}

/**
 * TypeScript interface for PingOne verify user payload
 */
export interface VerifyUserPayload<S> {
  readonly envId: string
  readonly token: string
  readonly userId: string
  readonly verificationData: S
}

/**
 * Type alias for PingOne create user request data
 */
export type PingOneUserData = Schema.Schema.Type<typeof PingOneCreateUserRequest>

/**
 * Type alias for PingOne create user response data
 */
export type PingOneUserResponse = Schema.Schema.Type<typeof PingOneCreateUserResponse>

/**
 * Type alias for PingOne update user request data
 */
export type PingOneUpdateUserData = Schema.Schema.Type<typeof PingOneUpdateUserRequest>

/**
 * Type alias for PingOne verify user request data
 */
export type PingOneVerifyUserData = Schema.Schema.Type<typeof PingOneVerifyUserRequest>

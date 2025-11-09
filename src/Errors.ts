/**
 * Error Types
 *
 * Defines structured error types for the PingOne CLI using Effect's Data.TaggedError.
 * These errors provide type-safe error handling throughout the application.
 *
 * @since 0.0.1
 */
import * as Data from "effect/Data"

export class NoGithubToken extends Data.TaggedError("NoGithubToken")<{ cause: string }> {}

export class WorkflowDispatchError extends Data.TaggedError("WorkflowDispatchError")<{
  status: number
  message: string
}> {}

export class PingOneAuthError extends Data.TaggedError("PingOneAuthError")<{
  cause: string
}> {}

export class PingOneApiError extends Data.TaggedError("PingOneApiError")<{
  status: number
  message: string
  errorCode?: string
}> {}

export class PingOneValidationError extends Data.TaggedError("PingOneValidationError")<{
  field: string
  message: string
}> {}

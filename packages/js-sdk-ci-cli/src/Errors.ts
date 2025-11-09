/**
 * Error Types
 *
 * Defines structured error types for the JS SDK CI CLI using Effect's Data.TaggedError.
 * These errors provide type-safe error handling throughout the application.
 *
 * @since 0.1.0
 */
import * as Data from "effect/Data"

export class NoGithubToken extends Data.TaggedError("NoGithubToken")<{ cause: string }> {}

export class WorkflowDispatchError extends Data.TaggedError("WorkflowDispatchError")<{
  status: number
  message: string
}> {}

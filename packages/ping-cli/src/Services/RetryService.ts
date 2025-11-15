import * as Context from "effect/Context"
import * as Duration from "effect/Duration"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Schedule from "effect/Schedule"
import { NetworkError, PingOneApiError, RateLimitError } from "../Errors.js"

/**
 * Service that provides retry logic for HTTP requests with exponential backoff.
 *
 * @since 0.0.1
 */
export interface RetryService {
  /**
   * Wraps an Effect with retry logic based on error classification.
   *
   * Retries transient errors:
   * - NetworkError (if retryable flag is true)
   * - RateLimitError (429 responses with Retry-After header)
   * - PingOneApiError with 5xx status codes (server errors)
   *
   * Does not retry permanent errors:
   * - PingOneAuthError (401, 403)
   * - PingOneValidationError (400, 422)
   * - PingOneApiError with 4xx status codes (except 429)
   *
   * @since 0.0.1
   */
  readonly retryableRequest: <A, E, R>(
    effect: Effect.Effect<A, E, R>
  ) => Effect.Effect<A, E, R>
}

/**
 * Context tag for RetryService.
 *
 * @since 0.0.1
 */
export const RetryService = Context.GenericTag<RetryService>("@services/RetryService")

/**
 * Determines if an error should trigger a retry attempt.
 *
 * @param error - The error to classify
 * @returns true if the error is transient and should be retried
 *
 * @since 0.0.1
 */
const shouldRetry = (error: unknown): boolean => {
  if (error instanceof NetworkError) {
    return error.retryable
  }

  if (error instanceof RateLimitError) {
    return true
  }

  if (error instanceof PingOneApiError) {
    // Retry 5xx server errors and 429 rate limits
    return error.status >= 500 || error.status === 429
  }

  // Don't retry authentication errors, validation errors, or other 4xx errors
  return false
}

/**
 * Creates a retry schedule with exponential backoff.
 *
 * Strategy:
 * - Initial delay: 1 second
 * - Exponential backoff (doubles each retry)
 * - Maximum total duration: 2 minutes
 * - Falls back to 5 second intervals after exponential phase
 *
 * @since 0.0.1
 */
const createRetrySchedule = () => {
  const exponentialBackoff = Schedule.exponential(Duration.seconds(1))
  const fixedInterval = Schedule.spaced(Duration.seconds(5))

  return exponentialBackoff.pipe(
    Schedule.union(fixedInterval),
    Schedule.compose(Schedule.elapsed),
    Schedule.whileOutput(Duration.lessThanOrEqualTo(Duration.minutes(2)))
  )
}

/**
 * Extracts Retry-After duration from RateLimitError.
 *
 * @param error - The error to extract retry delay from
 * @returns Duration to wait before retrying, or undefined if not applicable
 *
 * @since 0.0.1
 */
const getRetryAfterDelay = (error: unknown): Duration.Duration | undefined => {
  if (error instanceof RateLimitError && error.retryAfter > 0) {
    return Duration.seconds(error.retryAfter)
  }
  return undefined
}

/**
 * Live implementation of RetryService.
 *
 * Provides retry logic with exponential backoff and Retry-After header support.
 *
 * @since 0.0.1
 */
export const RetryServiceLive = Layer.succeed(
  RetryService,
  RetryService.of({
    retryableRequest: <A, E, R>(effect: Effect.Effect<A, E, R>) => {
      const retrySchedule = createRetrySchedule()

      return effect.pipe(
        Effect.retry({
          schedule: retrySchedule,
          while: shouldRetry
        }),
        Effect.catchAll((error) => {
          // If it's a rate limit error, respect Retry-After header
          const retryAfter = getRetryAfterDelay(error)
          if (retryAfter !== undefined) {
            return Effect.sleep(retryAfter).pipe(
              Effect.flatMap(() => effect),
              Effect.retry({
                schedule: retrySchedule,
                while: shouldRetry
              })
            )
          }
          // Re-throw non-retryable errors
          return Effect.fail(error)
        })
      )
    }
  })
)

/**
 * Auth Status Command
 *
 * Displays current authentication status and credential information.
 *
 * @since 0.0.3
 */
import { Command } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"
import { OAuthService } from "../../../Services/index.js"

/**
 * Formats a Unix timestamp as a human-readable date/time string.
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
const formatExpirationTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

/**
 * Masks a client ID for display (shows first 8 and last 4 characters).
 *
 * @param clientId - Full client ID
 * @returns Masked client ID
 */
const maskClientId = (clientId: string): string => {
  if (clientId.length <= 12) {
    return "****"
  }
  const start = clientId.slice(0, 8)
  const end = clientId.slice(-4)
  return `${start}****${end}`
}

/**
 * Auth status command.
 *
 * Shows current authentication state including:
 * - Whether credentials are stored
 * - Client ID (masked)
 * - Environment ID
 * - Token validity
 * - Token expiration time
 *
 * Usage:
 * ```bash
 * p1-cli auth status
 * ```
 *
 * @since 0.0.3
 */
export const status = Command.make("status", {}, () =>
  Effect.gen(function*() {
    const oauthService = yield* OAuthService

    const authStatus = yield* oauthService.getAuthStatus()

    if (!authStatus.hasCredentials) {
      yield* Console.log("❌ Not authenticated")
      yield* Console.log("")
      yield* Console.log("Run 'p1-cli auth login' to authenticate")
      return
    }

    yield* Console.log("✓ Authenticated")
    yield* Console.log("")

    if (authStatus.clientId) {
      yield* Console.log(`Client ID: ${maskClientId(authStatus.clientId)}`)
    }

    if (authStatus.environmentId) {
      yield* Console.log(`Environment: ${authStatus.environmentId}`)
    }

    yield* Console.log("")

    if (authStatus.hasValidToken && authStatus.tokenExpiresAt) {
      yield* Console.log("✓ Access token is valid")
      yield* Console.log(
        `  Expires: ${formatExpirationTime(authStatus.tokenExpiresAt)}`
      )
    } else if (authStatus.tokenExpiresAt) {
      yield* Console.log("⚠ Access token has expired")
      yield* Console.log("  A new token will be acquired automatically on next use")
    } else {
      yield* Console.log("ℹ No token cached yet")
      yield* Console.log("  A token will be acquired automatically on first use")
    }
  }))

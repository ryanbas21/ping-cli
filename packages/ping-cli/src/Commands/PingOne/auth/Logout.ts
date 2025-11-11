/**
 * Auth Logout Command
 *
 * Clears stored OAuth credentials and cached tokens.
 *
 * @since 0.0.3
 */
import { Command } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"
import { OAuthService } from "../../../Services/index.js"

/**
 * Auth logout command.
 *
 * Removes all stored OAuth credentials and clears cached access tokens.
 * After logout, you'll need to run `auth login` again to authenticate.
 *
 * Usage:
 * ```bash
 * p1-cli auth logout
 * ```
 *
 * @since 0.0.3
 */
export const logout = Command.make("logout", {}, () =>
  Effect.gen(function*() {
    const oauthService = yield* OAuthService

    yield* Console.log("Clearing stored credentials...")
    yield* oauthService.clearAuth()
    yield* Console.log("✓ Logged out successfully")
    yield* Console.log("✓ All credentials and tokens have been removed")
  }))

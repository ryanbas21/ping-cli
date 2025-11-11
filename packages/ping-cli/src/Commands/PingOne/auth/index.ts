/**
 * Auth Commands
 *
 * Commands for managing OAuth authentication credentials.
 *
 * @since 0.0.3
 */
import { Command } from "@effect/cli"
import { login } from "./Login.js"
import { logout } from "./Logout.js"
import { status } from "./Status.js"

/**
 * Auth command group.
 *
 * Manages OAuth client credentials authentication.
 *
 * Available subcommands:
 * - login: Store OAuth credentials
 * - logout: Clear stored credentials
 * - status: Show authentication status
 *
 * @since 0.0.3
 */
export const authCommand = Command.make("auth", {}).pipe(
  Command.withSubcommands([login, logout, status])
)

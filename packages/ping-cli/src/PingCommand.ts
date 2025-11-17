/* eslint-disable @effect/dprint */
import { Command } from "@effect/cli"
import { Array } from "effect"
import packageJson from "../package.json" with { type: "json" }
import { applicationsCommand } from "./Commands/PingOne/applications/index.js"
import { authCommand } from "./Commands/PingOne/auth/index.js"
import { bulkDeleteUsersCommand } from "./Commands/PingOne/BulkDeleteUsers.js"
import { bulkExportUsersCommand } from "./Commands/PingOne/BulkExportUsers.js"
import { bulkImportUsersCommand } from "./Commands/PingOne/BulkImportUsers.js"
import { createUser } from "./Commands/PingOne/CreateUser.js"
import { deleteMfaDevice } from "./Commands/PingOne/DeleteMfaDevice.js"
import { deleteUser } from "./Commands/PingOne/DeleteUser.js"
import { disableMfa } from "./Commands/PingOne/DisableMfa.js"
import { disableUser } from "./Commands/PingOne/DisableUser.js"
import { enableMfa } from "./Commands/PingOne/EnableMfa.js"
import { enableUser } from "./Commands/PingOne/EnableUser.js"
import { environmentsCommand } from "./Commands/PingOne/environments/index.js"
import { groupsCommand } from "./Commands/PingOne/groups/index.js"
import { listMfaDevices } from "./Commands/PingOne/ListMfaDevices.js"
import { listSessions } from "./Commands/PingOne/ListSessions.js"
import { listUsers } from "./Commands/PingOne/ListUsers.js"
import { lockUser } from "./Commands/PingOne/LockUser.js"
import { populationsCommand } from "./Commands/PingOne/populations/index.js"
import { readUser } from "./Commands/PingOne/ReadUser.js"
import { recoverPassword } from "./Commands/PingOne/RecoverPassword.js"
import { resetPassword } from "./Commands/PingOne/ResetPassword.js"
import { revokeSession } from "./Commands/PingOne/RevokeSession.js"
import { setPassword } from "./Commands/PingOne/SetPassword.js"
import { unlockUser } from "./Commands/PingOne/UnlockUser.js"
import { updateUser } from "./Commands/PingOne/UpdateUser.js"
import { verifyUser } from "./Commands/PingOne/VerifyUser.js"

/**
 * PingOne CLI commands
 *
 * @since 0.0.1
 */
const pingCommands = Array.make(
  authCommand,
  createUser,
  readUser,
  updateUser,
  deleteUser,
  verifyUser,
  listUsers,
  enableUser,
  disableUser,
  lockUser,
  unlockUser,
  listSessions,
  revokeSession,
  enableMfa,
  disableMfa,
  listMfaDevices,
  deleteMfaDevice,
  setPassword,
  resetPassword,
  recoverPassword,
  bulkImportUsersCommand,
  bulkExportUsersCommand,
  bulkDeleteUsersCommand,
  groupsCommand,
  populationsCommand,
  applicationsCommand,
  environmentsCommand
)

/**
 * Main PingOne CLI command
 *
 * @example
 * ```ts
 * import { PingCommand } from "p1-cli"
 * import { Command, Options } from "@effect/cli"
 * import { Effect } from "effect"
 *
 * // Create a custom command
 * const helloCommand = Command.make("hello", { name: Options.text("name") }).pipe(
 *   Command.withHandler(({ name }) => Effect.log(`Hello, ${name}!`))
 * )
 *
 * // Extend PingCommand with custom subcommands
 * const customCli = PingCommand.pipe(
 *   Command.withSubcommands([helloCommand])
 * )
 * ```
 *
 * @since 0.0.1
 * @category commands
 */
export const PingCommand = Command.make("p1-cli")

/**
 * Runnable PingOne CLI with all subcommands configured
 *
 * @example
 * ```ts
 * import { PingCli } from "p1-cli"
 *
 * // Create the CLI program with command line arguments
 * const program = PingCli(process.argv)
 *
 * // The program is an Effect that can be run with Effect.runPromise or Effect.runFork
 * // after providing the required services (Terminal, FileSystem, etc.)
 * ```
 *
 * @since 0.0.1
 * @category commands
 */
export const PingCli = PingCommand.pipe(Command.withSubcommands(pingCommands), Command.run({ name: "PingOne CLI", version: packageJson.version }))

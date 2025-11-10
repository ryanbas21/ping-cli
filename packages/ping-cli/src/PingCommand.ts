import { Command } from "@effect/cli"
import { Array } from "effect"
import { applicationsCommand } from "./Commands/PingOne/applications/index.js"
import { bulkDeleteUsersCommand } from "./Commands/PingOne/BulkDeleteUsers.js"
import { bulkExportUsersCommand } from "./Commands/PingOne/BulkExportUsers.js"
import { bulkImportUsersCommand } from "./Commands/PingOne/BulkImportUsers.js"
import { createUser } from "./Commands/PingOne/CreateUser.js"
import { deleteUser } from "./Commands/PingOne/DeleteUser.js"
import { environmentsCommand } from "./Commands/PingOne/environments/index.js"
import { groupsCommand } from "./Commands/PingOne/groups/index.js"
import { populationsCommand } from "./Commands/PingOne/populations/index.js"
import { readUser } from "./Commands/PingOne/ReadUser.js"
import { updateUser } from "./Commands/PingOne/UpdateUser.js"
import { verifyUser } from "./Commands/PingOne/VerifyUser.js"

/**
 * PingOne CLI commands
 *
 * @since 0.0.1
 */
const pingCommands = Array.make(
  createUser,
  readUser,
  updateUser,
  deleteUser,
  verifyUser,
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
 * @since 0.0.1
 */
export const PingCommand = Command.make("p1-cli")

export const PingCli = PingCommand.pipe(Command.withSubcommands(pingCommands)).pipe(
  Command.run({ name: "PingOne CLI", version: "0.1.0" })
)

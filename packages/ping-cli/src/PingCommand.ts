import { Command } from "@effect/cli"
import { Array } from "effect"
import { applicationsCommand } from "./Commands/PingOne/applications/index.js"
import { createUser } from "./Commands/PingOne/CreateUser.js"
import { deleteUser } from "./Commands/PingOne/DeleteUser.js"
import { groupsCommand } from "./Commands/PingOne/groups/index.js"
import { populationsCommand } from "./Commands/PingOne/populations/index.js"
import { readUser } from "./Commands/PingOne/ReadUser.js"
import { updateUser } from "./Commands/PingOne/UpdateUser.js"
import { verifyUser } from "./Commands/PingOne/VerifyUser.js"

/**
 * PingOne CLI commands
 */
const pingCommands = Array.make(
  createUser,
  readUser,
  updateUser,
  deleteUser,
  verifyUser,
  groupsCommand,
  populationsCommand,
  applicationsCommand
)

/**
 * Main PingOne CLI command
 */
export const PingCommand = Command.make("ping-cli")

export const PingCli = PingCommand.pipe(Command.withSubcommands(pingCommands)).pipe(
  Command.run({ name: "PingOne CLI", version: "0.1.0" })
)

import { Command } from "@effect/cli"
import { Array } from "effect"
import { applicationsCommand } from "./applications/index.js"
import { createUser } from "./CreateUser.js"
import { deleteUser } from "./DeleteUser.js"
import { groupsCommand } from "./groups/index.js"
import { populationsCommand } from "./populations/index.js"
import { readUser } from "./ReadUser.js"
import { updateUser } from "./UpdateUser.js"
import { verifyUser } from "./VerifyUser.js"

/**
 * PingOne subcommands
 *
 * @since 0.0.1
 */
const p1Subcommands = Array.make(
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
 * Parent p1 command with nested subcommands
 *
 * @since 0.0.1
 */
export const p1Command = Command.make("p1").pipe(
  Command.withSubcommands(p1Subcommands)
)

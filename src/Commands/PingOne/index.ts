import { Command } from "@effect/cli"
import { Array } from "effect"
import { createUser } from "./CreateUser.js"
import { deleteUser } from "./DeleteUser.js"
import { readUser } from "./ReadUser.js"
import { updateUser } from "./UpdateUser.js"
import { verifyUser } from "./VerifyUser.js"

/**
 * PingOne subcommands
 */
const p1Subcommands = Array.make(createUser, readUser, updateUser, deleteUser, verifyUser)

/**
 * Parent p1 command with nested subcommands
 */
export const p1Command = Command.make("p1").pipe(
  Command.withSubcommands(p1Subcommands)
)

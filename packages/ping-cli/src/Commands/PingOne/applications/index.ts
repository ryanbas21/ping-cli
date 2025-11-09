import { Command } from "@effect/cli"
import { Array } from "effect"
import { createApplicationCommand } from "./CreateApplication.js"
import { deleteApplicationCommand } from "./DeleteApplication.js"
import { listApplicationsCommand } from "./ListApplications.js"
import { readApplicationCommand } from "./ReadApplication.js"
import { updateApplicationCommand } from "./UpdateApplication.js"

/**
 * Application management subcommands
 *
 * @since 0.0.1
 */
const applicationSubcommands = Array.make(
  createApplicationCommand,
  readApplicationCommand,
  listApplicationsCommand,
  updateApplicationCommand,
  deleteApplicationCommand
)

/**
 * Parent applications command with nested subcommands
 *
 * @since 0.0.1
 */
export const applicationsCommand = Command.make("applications").pipe(
  Command.withSubcommands(applicationSubcommands)
)

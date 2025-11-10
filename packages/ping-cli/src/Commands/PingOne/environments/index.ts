import { Command } from "@effect/cli"
import { Array } from "effect"
import { listEnvironmentsCommand } from "./ListEnvironments.js"
import { readEnvironmentCommand } from "./ReadEnvironment.js"

/**
 * Environment subcommands
 *
 * @since 0.0.2
 */
const environmentSubcommands = Array.make(
  listEnvironmentsCommand,
  readEnvironmentCommand
)

/**
 * Parent environments command with nested subcommands
 *
 * @since 0.0.2
 */
export const environmentsCommand = Command.make("environments").pipe(
  Command.withSubcommands(environmentSubcommands)
)

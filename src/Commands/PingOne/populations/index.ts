import { Command } from "@effect/cli"
import { Array } from "effect"
import { createPopulationCommand } from "./CreatePopulation.js"
import { deletePopulationCommand } from "./DeletePopulation.js"
import { listPopulationsCommand } from "./ListPopulations.js"
import { readPopulationCommand } from "./ReadPopulation.js"
import { updatePopulationCommand } from "./UpdatePopulation.js"

/**
 * Population subcommands
 */
const populationSubcommands = Array.make(
  createPopulationCommand,
  readPopulationCommand,
  listPopulationsCommand,
  updatePopulationCommand,
  deletePopulationCommand
)

/**
 * Parent populations command with nested subcommands
 */
export const populationsCommand = Command.make("populations").pipe(
  Command.withSubcommands(populationSubcommands)
)

import { Command } from "@effect/cli"
import { Array } from "effect"
import { runJSTests } from "./Commands/RunJSTests.js"
import { RunPublish } from "./Commands/RunPublish.js"

/**
 * CI workflow commands for JS SDK
 */
const ciCommands = Array.make(runJSTests, RunPublish)

/**
 * Main SDK CI CLI command
 */
export const SdkCiCommand = Command.make("js-sdk-ci")

export const SdkCiCli = SdkCiCommand.pipe(Command.withSubcommands(ciCommands)).pipe(
  Command.run({ name: "JS SDK CI CLI", version: "0.1.0" })
)

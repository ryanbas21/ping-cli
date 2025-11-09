import { Command } from "@effect/cli"
import * as Array from "effect/Array"
import { p1Command } from "./Commands/PingOne/index.js"
import { runJSTests } from "./Commands/RunJSTests.js"
import { RunPublish } from "./Commands/RunPublish.js"

const subcommands = Array.make(runJSTests, RunPublish, p1Command)

export const PingCommand = Command.make("pingid")

export const PingCli = PingCommand.pipe(Command.withSubcommands(subcommands)).pipe(
  Command.run({ name: "Ping SDK CLI", version: "0.0.1" })
)

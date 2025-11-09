import { NodeContext, NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { config } from "dotenv"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { PingCli } from "./PingCommand.js"

// Load .env file into process.env
config()

const layers = Layer.merge(NodeHttpClient.layer, NodeContext.layer)

PingCli(process.argv).pipe(Effect.provide(layers), NodeRuntime.runMain)

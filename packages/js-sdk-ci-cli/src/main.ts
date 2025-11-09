#!/usr/bin/env node
import { NodeContext, NodeHttpClient, NodeRuntime } from "@effect/platform-node"
import { config } from "dotenv"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { SdkCiCli } from "./SdkCiCommand.js"

// Load .env file into process.env
config()

const layers = Layer.merge(NodeHttpClient.layer, NodeContext.layer)

SdkCiCli(process.argv).pipe(Effect.provide(layers), NodeRuntime.runMain)

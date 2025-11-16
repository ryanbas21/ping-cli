import { NodeContext, NodeHttpClient } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { PingCli } from "../../../PingCommand.js"
import { MockServicesLive } from "../../../test-helpers/TestLayers.js"

const TestLayer = Layer.mergeAll(
  NodeHttpClient.layerUndici,
  NodeContext.layer,
  MockServicesLive
)

describe("ReadEnvironment Command", () => {
  it.effect("should show help for read_environment subcommand", () =>
    Effect.gen(function*() {
      const result = yield* Effect.exit(PingCli(["environments", "read_environment", "--help"]))

      assert.strictEqual(result._tag, "Success")
    }).pipe(Effect.provide(TestLayer)))
})

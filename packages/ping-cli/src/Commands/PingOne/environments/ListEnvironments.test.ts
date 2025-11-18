/**
 * Tests for ListEnvironments command functionality
 *
 * @since 0.0.1
 */
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

describe("ListEnvironments Command", () => {
  it.effect("should show help for environments command", () =>
    Effect.gen(function*() {
      const result = yield* Effect.exit(PingCli(["environments", "--help"]))

      assert.strictEqual(result._tag, "Success")
    }).pipe(Effect.provide(TestLayer)))

  it.effect("should show help for list_environments subcommand", () =>
    Effect.gen(function*() {
      const result = yield* Effect.exit(PingCli(["environments", "list_environments", "--help"]))

      assert.strictEqual(result._tag, "Success")
    }).pipe(Effect.provide(TestLayer)))
})

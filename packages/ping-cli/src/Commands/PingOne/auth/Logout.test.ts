import { assert, describe, it } from "@effect/vitest"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import { OAuthFlowError } from "../../../Errors.js"
import { OAuthService } from "../../../Services/index.js"
import { logout } from "./Logout.js"

describe("Auth Logout Command", () => {
  describe("successful logout", () => {
    it.effect("should clear authentication", () => {
      let authCleared = false

      const mockOAuthService = Layer.succeed(
        OAuthService,
        OAuthService.of({
          storeCredentials: () => Effect.void,
          getAccessToken: () => Effect.succeed("test-token"),
          getCredentials: () =>
            Effect.fail(
              new OAuthFlowError({
                message: "Not needed",
                cause: "Mock",
                step: "credential_retrieval"
              })
            ),
          clearAuth: () =>
            Effect.sync(() => {
              authCleared = true
            }),
          getAuthStatus: () =>
            Effect.succeed({
              hasCredentials: false,
              hasValidToken: false
            })
        })
      )

      return Effect.gen(function*() {
        const handler = logout.handler

        yield* handler({})

        // Verify clearAuth was called
        assert.isTrue(authCleared)
      }).pipe(Effect.provide(mockOAuthService))
    })

    it.effect("should complete successfully even when no credentials exist", () => {
      const mockOAuthService = Layer.succeed(
        OAuthService,
        OAuthService.of({
          storeCredentials: () => Effect.void,
          getAccessToken: () => Effect.succeed("test-token"),
          getCredentials: () =>
            Effect.fail(
              new OAuthFlowError({
                message: "Not needed",
                cause: "Mock",
                step: "credential_retrieval"
              })
            ),
          clearAuth: () => Effect.void,
          getAuthStatus: () =>
            Effect.succeed({
              hasCredentials: false,
              hasValidToken: false
            })
        })
      )

      return Effect.gen(function*() {
        const handler = logout.handler

        // Should succeed even if no credentials exist
        yield* handler({})

        assert.isTrue(true)
      }).pipe(Effect.provide(mockOAuthService))
    })
  })

  describe("error handling", () => {
    it.effect("should fail when credential deletion fails", () => {
      const mockOAuthService = Layer.succeed(
        OAuthService,
        OAuthService.of({
          storeCredentials: () => Effect.void,
          getAccessToken: () => Effect.succeed("test-token"),
          getCredentials: () =>
            Effect.fail(
              new OAuthFlowError({
                message: "Not needed",
                cause: "Mock",
                step: "credential_retrieval"
              })
            ),
          clearAuth: () =>
            Effect.fail(
              new OAuthFlowError({
                message: "Failed to delete credentials",
                cause: "Keychain access denied",
                step: "credential_deletion"
              })
            ),
          getAuthStatus: () =>
            Effect.succeed({
              hasCredentials: true,
              hasValidToken: false
            })
        })
      )

      return Effect.gen(function*() {
        const handler = logout.handler

        const result = yield* handler({}).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error
          assert.strictEqual(error._tag, "OAuthFlowError")
          assert.strictEqual(error.step, "credential_deletion")
        }
      }).pipe(Effect.provide(mockOAuthService))
    })
  })

  describe("state changes", () => {
    it.effect("should clear both credentials and cached tokens", () => {
      let clearAuthCallCount = 0

      const mockOAuthService = Layer.succeed(
        OAuthService,
        OAuthService.of({
          storeCredentials: () => Effect.void,
          getAccessToken: () => Effect.succeed("test-token"),
          getCredentials: () =>
            Effect.fail(
              new OAuthFlowError({
                message: "Not needed",
                cause: "Mock",
                step: "credential_retrieval"
              })
            ),
          clearAuth: () =>
            Effect.sync(() => {
              clearAuthCallCount++
            }),
          getAuthStatus: () =>
            Effect.succeed({
              hasCredentials: false,
              hasValidToken: false
            })
        })
      )

      return Effect.gen(function*() {
        const handler = logout.handler

        yield* handler({})

        // Verify clearAuth was called exactly once
        assert.strictEqual(clearAuthCallCount, 1)
      }).pipe(Effect.provide(mockOAuthService))
    })
  })
})

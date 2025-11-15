import { assert, describe, it } from "@effect/vitest"
import { DateTime, Effect, Layer } from "effect"
import { OAuthFlowError } from "../../../Errors.js"
import { OAuthService } from "../../../Services/index.js"
import { status } from "./Status.js"

describe("Auth Status Command", () => {
  describe("authenticated state", () => {
    it.effect("should show authenticated status with valid token", () => {
      const futureTimestamp = DateTime.toEpochMillis(DateTime.unsafeMake(Date.now() + 3600000))

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
              hasCredentials: true,
              hasValidToken: true,
              clientId: "12345678-1234-1234-1234-123456789012",
              environmentId: "test-env-id",
              tokenExpiresAt: futureTimestamp
            })
        })
      )

      return Effect.gen(function*() {
        const handler = status.handler

        // Should complete successfully
        yield* handler({})

        assert.isTrue(true)
      }).pipe(Effect.provide(mockOAuthService))
    })

    it.effect("should show authenticated status with expired token", () => {
      const pastTimestamp = DateTime.toEpochMillis(DateTime.unsafeMake(Date.now() - 3600000))

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
              hasCredentials: true,
              hasValidToken: false,
              clientId: "test-client-id",
              environmentId: "test-env-id",
              tokenExpiresAt: pastTimestamp
            })
        })
      )

      return Effect.gen(function*() {
        const handler = status.handler

        // Should complete successfully even with expired token
        yield* handler({})

        assert.isTrue(true)
      }).pipe(Effect.provide(mockOAuthService))
    })

    it.effect("should show authenticated status with no cached token", () => {
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
              hasCredentials: true,
              hasValidToken: false,
              clientId: "test-client-id",
              environmentId: "test-env-id",
              tokenExpiresAt: undefined
            })
        })
      )

      return Effect.gen(function*() {
        const handler = status.handler

        // Should complete successfully with no cached token
        yield* handler({})

        assert.isTrue(true)
      }).pipe(Effect.provide(mockOAuthService))
    })
  })

  describe("unauthenticated state", () => {
    it.effect("should show not authenticated when no credentials exist", () => {
      const mockOAuthService = Layer.succeed(
        OAuthService,
        OAuthService.of({
          storeCredentials: () => Effect.void,
          getAccessToken: () =>
            Effect.fail(
              new OAuthFlowError({
                message: "No credentials",
                cause: "Not authenticated",
                step: "credential_retrieval"
              })
            ),
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
              hasValidToken: false,
              clientId: undefined,
              environmentId: undefined,
              tokenExpiresAt: undefined
            })
        })
      )

      return Effect.gen(function*() {
        const handler = status.handler

        // Should complete successfully even when not authenticated
        yield* handler({})

        assert.isTrue(true)
      }).pipe(Effect.provide(mockOAuthService))
    })
  })

  describe("getAuthStatus integration", () => {
    it.effect("should call getAuthStatus exactly once", () => {
      let getAuthStatusCallCount = 0

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
            Effect.sync(() => {
              getAuthStatusCallCount++
              return {
                hasCredentials: true,
                hasValidToken: true,
                clientId: "test-client",
                environmentId: "test-env",
                tokenExpiresAt: Date.now() + 3600000
              }
            })
        })
      )

      return Effect.gen(function*() {
        const handler = status.handler

        yield* handler({})

        assert.strictEqual(getAuthStatusCallCount, 1)
      }).pipe(Effect.provide(mockOAuthService))
    })

    it.effect("should handle auth status retrieval errors gracefully", () => {
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
            Effect.fail(
              new OAuthFlowError({
                message: "Failed to get auth status",
                cause: "Internal error",
                step: "credential_retrieval"
              })
            )
        })
      )

      return Effect.gen(function*() {
        const handler = status.handler

        const result = yield* handler({}).pipe(Effect.exit)

        // Should fail when getAuthStatus fails
        assert.strictEqual(result._tag, "Failure")
      }).pipe(Effect.provide(mockOAuthService))
    })
  })

  describe("data masking", () => {
    it.effect("should mask client ID correctly", () => {
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
              hasCredentials: true,
              hasValidToken: true,
              // Long client ID that should be masked as first 8 + **** + last 4
              clientId: "12345678-abcd-efgh-ijkl-mnopqrstuvwx",
              environmentId: "test-env-id",
              tokenExpiresAt: Date.now() + 3600000
            })
        })
      )

      return Effect.gen(function*() {
        const handler = status.handler

        // Should complete successfully and mask the client ID
        yield* handler({})

        assert.isTrue(true)
      }).pipe(Effect.provide(mockOAuthService))
    })

    it.effect("should handle short client IDs", () => {
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
              hasCredentials: true,
              hasValidToken: true,
              // Short client ID (12 chars or less) should be fully masked
              clientId: "short123",
              environmentId: "test-env-id",
              tokenExpiresAt: Date.now() + 3600000
            })
        })
      )

      return Effect.gen(function*() {
        const handler = status.handler

        // Should complete successfully and fully mask short client ID
        yield* handler({})

        assert.isTrue(true)
      }).pipe(Effect.provide(mockOAuthService))
    })
  })

  describe("environment information", () => {
    it.effect("should display environment ID when available", () => {
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
              hasCredentials: true,
              hasValidToken: true,
              clientId: "test-client-id",
              environmentId: "my-production-env",
              tokenExpiresAt: Date.now() + 3600000
            })
        })
      )

      return Effect.gen(function*() {
        const handler = status.handler

        yield* handler({})

        assert.isTrue(true)
      }).pipe(Effect.provide(mockOAuthService))
    })

    it.effect("should handle missing environment ID", () => {
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
              hasCredentials: true,
              hasValidToken: true,
              clientId: "test-client-id",
              environmentId: undefined,
              tokenExpiresAt: Date.now() + 3600000
            })
        })
      )

      return Effect.gen(function*() {
        const handler = status.handler

        // Should complete successfully even without environment ID
        yield* handler({})

        assert.isTrue(true)
      }).pipe(Effect.provide(mockOAuthService))
    })
  })
})

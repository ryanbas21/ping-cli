import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer, Option, Redacted } from "effect"
import { OAuthFlowError } from "../../../Errors.js"
import { StoredCredentials } from "../../../HttpClient/OAuthSchemas.js"
import { OAuthService } from "../../../Services/index.js"
import { login } from "./Login.js"

describe("Auth Login Command", () => {
  describe("successful login", () => {
    it.effect("should store credentials and verify token acquisition", () => {
      let storedCreds: StoredCredentials | undefined

      const mockOAuthService = Layer.succeed(
        OAuthService,
        OAuthService.of({
          storeCredentials: (credentials) =>
            Effect.sync(() => {
              storedCreds = credentials
            }),
          getAccessToken: () => Effect.succeed("test-access-token"),
          getCredentials: () =>
            Effect.succeed(
              new StoredCredentials({
                clientId: "test-client-id",
                clientSecret: "test-client-secret",
                environmentId: "test-env-id",
                tokenEndpoint: "https://auth.pingone.com/test-env-id/as/token"
              })
            ),
          clearAuth: () => Effect.void,
          getAuthStatus: () =>
            Effect.succeed({
              hasCredentials: true,
              hasValidToken: true,
              clientId: "test-client-id",
              environmentId: "test-env-id",
              tokenExpiresAt: Date.now() + 3600000
            })
        })
      )

      return Effect.gen(function*() {
        const handler = login.handler

        yield* handler({
          clientId: Option.some("my-client-id"),
          clientSecret: Option.some(Redacted.make("my-client-secret")),
          environmentId: Option.some("my-env-id"),
          region: Option.some("com" as const)
        })

        // Verify credentials were stored
        assert.isDefined(storedCreds)
        assert.strictEqual(storedCreds?.clientId, "my-client-id")
        assert.strictEqual(storedCreds?.clientSecret, "my-client-secret")
        assert.strictEqual(storedCreds?.environmentId, "my-env-id")
        assert.strictEqual(
          storedCreds?.tokenEndpoint,
          "https://auth.pingone.com/my-env-id/as/token"
        )
      }).pipe(Effect.provide(mockOAuthService))
    })

    it.effect("should build correct token endpoint for EU region", () => {
      let storedCreds: StoredCredentials | undefined

      const mockOAuthService = Layer.succeed(
        OAuthService,
        OAuthService.of({
          storeCredentials: (credentials) =>
            Effect.sync(() => {
              storedCreds = credentials
            }),
          getAccessToken: () => Effect.succeed("test-access-token"),
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
        const handler = login.handler

        yield* handler({
          clientId: Option.some("eu-client"),
          clientSecret: Option.some(Redacted.make("eu-secret")),
          environmentId: Option.some("eu-env"),
          region: Option.some("eu" as const)
        })

        assert.strictEqual(
          storedCreds?.tokenEndpoint,
          "https://auth.pingone.eu/eu-env/as/token"
        )
      }).pipe(Effect.provide(mockOAuthService))
    })

    it.effect("should build correct token endpoint for Asia region", () => {
      let storedCreds: StoredCredentials | undefined

      const mockOAuthService = Layer.succeed(
        OAuthService,
        OAuthService.of({
          storeCredentials: (credentials) =>
            Effect.sync(() => {
              storedCreds = credentials
            }),
          getAccessToken: () => Effect.succeed("test-access-token"),
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
        const handler = login.handler

        yield* handler({
          clientId: Option.some("asia-client"),
          clientSecret: Option.some(Redacted.make("asia-secret")),
          environmentId: Option.some("asia-env"),
          region: Option.some("asia" as const)
        })

        assert.strictEqual(
          storedCreds?.tokenEndpoint,
          "https://auth.pingone.asia/asia-env/as/token"
        )
      }).pipe(Effect.provide(mockOAuthService))
    })

    it.effect("should build correct token endpoint for Canada region", () => {
      let storedCreds: StoredCredentials | undefined

      const mockOAuthService = Layer.succeed(
        OAuthService,
        OAuthService.of({
          storeCredentials: (credentials) =>
            Effect.sync(() => {
              storedCreds = credentials
            }),
          getAccessToken: () => Effect.succeed("test-access-token"),
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
        const handler = login.handler

        yield* handler({
          clientId: Option.some("ca-client"),
          clientSecret: Option.some(Redacted.make("ca-secret")),
          environmentId: Option.some("ca-env"),
          region: Option.some("ca" as const)
        })

        assert.strictEqual(
          storedCreds?.tokenEndpoint,
          "https://auth.pingone.ca/ca-env/as/token"
        )
      }).pipe(Effect.provide(mockOAuthService))
    })

    it.effect("should unwrap Redacted client secret correctly", () => {
      let storedCreds: StoredCredentials | undefined

      const mockOAuthService = Layer.succeed(
        OAuthService,
        OAuthService.of({
          storeCredentials: (credentials) =>
            Effect.sync(() => {
              storedCreds = credentials
            }),
          getAccessToken: () => Effect.succeed("test-access-token"),
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
        const handler = login.handler
        const secretValue = "super-secret-password-123"

        yield* handler({
          clientId: Option.some("test-client"),
          clientSecret: Option.some(Redacted.make(secretValue)),
          environmentId: Option.some("test-env"),
          region: Option.some("com" as const)
        })

        // Verify the secret was properly unwrapped from Redacted
        assert.strictEqual(storedCreds?.clientSecret, secretValue)
      }).pipe(Effect.provide(mockOAuthService))
    })
  })

  describe("error handling", () => {
    it.effect("should fail when credential storage fails", () => {
      const mockOAuthService = Layer.succeed(
        OAuthService,
        OAuthService.of({
          storeCredentials: () =>
            Effect.fail(
              new OAuthFlowError({
                message: "Failed to store credentials",
                cause: "Keychain access denied",
                step: "credential_storage"
              })
            ),
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
        const handler = login.handler

        const result = yield* handler({
          clientId: Option.some("test-client"),
          clientSecret: Option.some(Redacted.make("test-secret")),
          environmentId: Option.some("test-env"),
          region: Option.some("com" as const)
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error
          assert.strictEqual(error._tag, "OAuthFlowError")
          assert.strictEqual(error.step, "credential_storage")
        }
      }).pipe(Effect.provide(mockOAuthService))
    })

    it.effect("should fail when token verification fails", () => {
      const mockOAuthService = Layer.succeed(
        OAuthService,
        OAuthService.of({
          storeCredentials: () => Effect.void,
          getAccessToken: () =>
            Effect.fail(
              new OAuthFlowError({
                message: "Failed to acquire access token",
                cause: "Invalid client credentials",
                step: "token_exchange"
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
              hasCredentials: true,
              hasValidToken: false
            })
        })
      )

      return Effect.gen(function*() {
        const handler = login.handler

        const result = yield* handler({
          clientId: Option.some("invalid-client"),
          clientSecret: Option.some(Redacted.make("invalid-secret")),
          environmentId: Option.some("test-env"),
          region: Option.some("com" as const)
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error
          assert.strictEqual(error._tag, "OAuthFlowError")
          assert.strictEqual(error.step, "token_exchange")
        }
      }).pipe(Effect.provide(mockOAuthService))
    })
  })

  describe("token verification", () => {
    it.effect("should verify credentials by acquiring a token", () => {
      let tokenAcquired = false

      const mockOAuthService = Layer.succeed(
        OAuthService,
        OAuthService.of({
          storeCredentials: () => Effect.void,
          getAccessToken: () =>
            Effect.sync(() => {
              tokenAcquired = true
              return "test-access-token"
            }),
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
              clientId: "test-client",
              environmentId: "test-env",
              tokenExpiresAt: Date.now() + 3600000
            })
        })
      )

      return Effect.gen(function*() {
        const handler = login.handler

        yield* handler({
          clientId: Option.some("test-client"),
          clientSecret: Option.some(Redacted.make("test-secret")),
          environmentId: Option.some("test-env"),
          region: Option.some("com" as const)
        })

        // Verify token was acquired as part of login verification
        assert.isTrue(tokenAcquired)
      }).pipe(Effect.provide(mockOAuthService))
    })
  })
})

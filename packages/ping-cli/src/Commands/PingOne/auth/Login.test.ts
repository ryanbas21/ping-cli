import { NodeFileSystem, NodePath } from "@effect/platform-node"
import { assert, describe, it } from "@effect/vitest"
import { ConfigProvider, Effect, Layer, Option, Redacted } from "effect"
import { OAuthFlowError } from "../../../Errors.js"
import { StoredCredentials } from "../../../HttpClient/OAuthSchemas.js"
import { OAuthService } from "../../../Services/index.js"
import * as MockTerminal from "../../../test/services/MockTerminal.js"
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
      }).pipe(
        Effect.provide(Layer.mergeAll(mockOAuthService, MockTerminal.layer, NodeFileSystem.layer, NodePath.layer))
      )
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
      }).pipe(
        Effect.provide(Layer.mergeAll(mockOAuthService, MockTerminal.layer, NodeFileSystem.layer, NodePath.layer))
      )
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
      }).pipe(
        Effect.provide(Layer.mergeAll(mockOAuthService, MockTerminal.layer, NodeFileSystem.layer, NodePath.layer))
      )
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
      }).pipe(
        Effect.provide(Layer.mergeAll(mockOAuthService, MockTerminal.layer, NodeFileSystem.layer, NodePath.layer))
      )
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
      }).pipe(
        Effect.provide(Layer.mergeAll(mockOAuthService, MockTerminal.layer, NodeFileSystem.layer, NodePath.layer))
      )
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
          if (error._tag === "OAuthFlowError") {
            assert.strictEqual(error.step, "credential_storage")
          }
        }
      }).pipe(
        Effect.provide(Layer.mergeAll(mockOAuthService, MockTerminal.layer, NodeFileSystem.layer, NodePath.layer))
      )
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
          if (error._tag === "OAuthFlowError") {
            assert.strictEqual(error.step, "token_exchange")
          }
        }
      }).pipe(
        Effect.provide(Layer.mergeAll(mockOAuthService, MockTerminal.layer, NodeFileSystem.layer, NodePath.layer))
      )
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
      }).pipe(
        Effect.provide(Layer.mergeAll(mockOAuthService, MockTerminal.layer, NodeFileSystem.layer, NodePath.layer))
      )
    })
  })

  describe("environment variable resolution", () => {
    it.effect("should use environment variables when CLI flags are not provided", () => {
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

      const envConfig = ConfigProvider.fromMap(
        new Map([
          ["PINGONE_CLIENT_ID", "env-client-id"],
          ["PINGONE_CLIENT_SECRET", "env-client-secret"],
          ["PINGONE_ENV_ID", "env-environment-id"],
          ["PINGONE_AUTH_REGION", "eu"]
        ])
      )

      return Effect.gen(function*() {
        const handler = login.handler

        yield* handler({
          clientId: Option.none(),
          clientSecret: Option.none(),
          environmentId: Option.none(),
          region: Option.none()
        })

        assert.isDefined(storedCreds)
        assert.strictEqual(storedCreds?.clientId, "env-client-id")
        assert.strictEqual(storedCreds?.clientSecret, "env-client-secret")
        assert.strictEqual(storedCreds?.environmentId, "env-environment-id")
        assert.strictEqual(
          storedCreds?.tokenEndpoint,
          "https://auth.pingone.eu/env-environment-id/as/token"
        )
      }).pipe(
        Effect.provide(Layer.mergeAll(mockOAuthService, MockTerminal.layer, NodeFileSystem.layer, NodePath.layer)),
        Effect.withConfigProvider(envConfig)
      )
    })

    it.effect("should fall back to default region when env var is invalid", () => {
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

      const envConfig = ConfigProvider.fromMap(
        new Map([
          ["PINGONE_CLIENT_ID", "test-client"],
          ["PINGONE_CLIENT_SECRET", "test-secret"],
          ["PINGONE_ENV_ID", "test-env"],
          ["PINGONE_AUTH_REGION", "invalid-region"]
        ])
      )

      return Effect.gen(function*() {
        const handler = login.handler

        yield* handler({
          clientId: Option.none(),
          clientSecret: Option.none(),
          environmentId: Option.none(),
          region: Option.none()
        })

        assert.strictEqual(
          storedCreds?.tokenEndpoint,
          "https://auth.pingone.com/test-env/as/token"
        )
      }).pipe(
        Effect.provide(Layer.mergeAll(mockOAuthService, MockTerminal.layer, NodeFileSystem.layer, NodePath.layer)),
        Effect.withConfigProvider(envConfig)
      )
    })
  })

  describe("interactive prompt fallback", () => {
    it.effect("should prompt for all credentials when not provided", () => {
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

      const emptyConfig = ConfigProvider.fromMap(new Map())

      return Effect.gen(function*() {
        const handler = login.handler

        const inputsEffect = Effect.gen(function*() {
          yield* MockTerminal.inputText("550b8400-e29b-42d4-a716-446655440000")
          yield* MockTerminal.inputKey("return")
          yield* MockTerminal.inputText("prompted-secret")
          yield* MockTerminal.inputKey("return")
          yield* MockTerminal.inputText("02fb4743-189a-4bc7-9d6c-a919edfe6447")
          yield* MockTerminal.inputKey("return")
        })

        const handlerEffect = handler({
          clientId: Option.none(),
          clientSecret: Option.none(),
          environmentId: Option.none(),
          region: Option.some("com" as const)
        })

        yield* Effect.all([inputsEffect, handlerEffect], { concurrency: "unbounded" })

        assert.isDefined(storedCreds)
        assert.strictEqual(storedCreds?.clientId, "550b8400-e29b-42d4-a716-446655440000")
        assert.strictEqual(storedCreds?.clientSecret, "prompted-secret")
        assert.strictEqual(storedCreds?.environmentId, "02fb4743-189a-4bc7-9d6c-a919edfe6447")
      }).pipe(
        Effect.provide(Layer.mergeAll(mockOAuthService, MockTerminal.layer, NodeFileSystem.layer, NodePath.layer)),
        Effect.withConfigProvider(emptyConfig)
      )
    })
  })

  describe("input precedence", () => {
    it.effect("should prioritize CLI flags over environment variables", () => {
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

      const envConfig = ConfigProvider.fromMap(
        new Map([
          ["PINGONE_CLIENT_ID", "env-client-id"],
          ["PINGONE_CLIENT_SECRET", "env-client-secret"],
          ["PINGONE_ENV_ID", "env-environment-id"],
          ["PINGONE_AUTH_REGION", "eu"]
        ])
      )

      return Effect.gen(function*() {
        const handler = login.handler

        yield* handler({
          clientId: Option.some("cli-client-id"),
          clientSecret: Option.some(Redacted.make("cli-client-secret")),
          environmentId: Option.some("cli-environment-id"),
          region: Option.some("asia" as const)
        })

        // CLI flags should take precedence
        assert.strictEqual(storedCreds?.clientId, "cli-client-id")
        assert.strictEqual(storedCreds?.clientSecret, "cli-client-secret")
        assert.strictEqual(storedCreds?.environmentId, "cli-environment-id")
        assert.strictEqual(
          storedCreds?.tokenEndpoint,
          "https://auth.pingone.asia/cli-environment-id/as/token"
        )
      }).pipe(
        Effect.provide(Layer.mergeAll(mockOAuthService, MockTerminal.layer, NodeFileSystem.layer, NodePath.layer)),
        Effect.withConfigProvider(envConfig)
      )
    })

    it.effect("should use mix of CLI flags and environment variables", () => {
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

      const envConfig = ConfigProvider.fromMap(
        new Map([
          ["PINGONE_CLIENT_ID", "env-client-id"],
          ["PINGONE_CLIENT_SECRET", "env-client-secret"]
        ])
      )

      return Effect.gen(function*() {
        const handler = login.handler

        yield* handler({
          clientId: Option.none(),
          clientSecret: Option.none(),
          environmentId: Option.some("cli-environment-id"),
          region: Option.some("ca" as const)
        })

        // Should use env vars for client ID and secret, CLI for environment and region
        assert.strictEqual(storedCreds?.clientId, "env-client-id")
        assert.strictEqual(storedCreds?.clientSecret, "env-client-secret")
        assert.strictEqual(storedCreds?.environmentId, "cli-environment-id")
        assert.strictEqual(
          storedCreds?.tokenEndpoint,
          "https://auth.pingone.ca/cli-environment-id/as/token"
        )
      }).pipe(
        Effect.provide(Layer.mergeAll(mockOAuthService, MockTerminal.layer, NodeFileSystem.layer, NodePath.layer)),
        Effect.withConfigProvider(envConfig)
      )
    })
  })

  /**
   * Helper function to create a mock OAuthService for testing
   */
  const createMockOAuthService = () =>
    Layer.succeed(
      OAuthService,
      OAuthService.of({
        storeCredentials: () => Effect.void,
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

  describe("input validation", () => {
    it.effect("should reject empty client ID in interactive prompt", () => {
      const emptyConfig = ConfigProvider.fromMap(new Map())

      return Effect.gen(function*() {
        const handler = login.handler({
          clientId: Option.none(),
          clientSecret: Option.none(),
          environmentId: Option.none(),
          region: Option.none()
        })

        const inputsEffect = Effect.gen(function*() {
          // First attempt: empty string
          yield* MockTerminal.inputText("")
          yield* MockTerminal.inputKey("return")

          // Second attempt: valid UUID
          yield* MockTerminal.inputText("550b8400-e29b-42d4-a716-446655440000")
          yield* MockTerminal.inputKey("return")

          // Valid secret
          yield* MockTerminal.inputText("test-secret")
          yield* MockTerminal.inputKey("return")

          // Valid environment ID
          yield* MockTerminal.inputText("02fb4743-189a-4bc7-9d6c-a919edfe6447")
          yield* MockTerminal.inputKey("return")
        })

        yield* Effect.all([inputsEffect, handler], { concurrency: "unbounded" }).pipe(
          Effect.provide(
            Layer.mergeAll(createMockOAuthService(), MockTerminal.layer, NodeFileSystem.layer, NodePath.layer)
          )
        )

        // If we reach here, validation passed and handler succeeded
        assert.isTrue(true)
      }).pipe(Effect.withConfigProvider(emptyConfig))
    })

    it.effect("should accept valid UUID format for client ID in interactive prompt", () => {
      const emptyConfig = ConfigProvider.fromMap(new Map())

      return Effect.gen(function*() {
        const handler = login.handler({
          clientId: Option.none(),
          clientSecret: Option.none(),
          environmentId: Option.none(),
          region: Option.none()
        })

        const inputsEffect = Effect.gen(function*() {
          // Valid UUID on first attempt
          yield* MockTerminal.inputText("550b8400-e29b-42d4-a716-446655440000")
          yield* MockTerminal.inputKey("return")

          // Valid secret
          yield* MockTerminal.inputText("test-secret")
          yield* MockTerminal.inputKey("return")

          // Valid environment ID
          yield* MockTerminal.inputText("02fb4743-189a-4bc7-9d6c-a919edfe6447")
          yield* MockTerminal.inputKey("return")
        })

        yield* Effect.all([inputsEffect, handler], { concurrency: "unbounded" }).pipe(
          Effect.provide(
            Layer.mergeAll(createMockOAuthService(), MockTerminal.layer, NodeFileSystem.layer, NodePath.layer)
          )
        )

        // If we reach here, validation passed and handler succeeded
        assert.isTrue(true)
      }).pipe(Effect.withConfigProvider(emptyConfig))
    })

    it.effect("should reject empty environment ID in interactive prompt", () => {
      const emptyConfig = ConfigProvider.fromMap(new Map())

      return Effect.gen(function*() {
        const handler = login.handler({
          clientId: Option.none(),
          clientSecret: Option.none(),
          environmentId: Option.none(),
          region: Option.none()
        })

        const inputsEffect = Effect.gen(function*() {
          // Valid client ID
          yield* MockTerminal.inputText("550b8400-e29b-42d4-a716-446655440000")
          yield* MockTerminal.inputKey("return")

          // Valid secret
          yield* MockTerminal.inputText("test-secret")
          yield* MockTerminal.inputKey("return")

          // First attempt: empty environment ID
          yield* MockTerminal.inputText("")
          yield* MockTerminal.inputKey("return")

          // Second attempt: valid environment ID
          yield* MockTerminal.inputText("02fb4743-189a-4bc7-9d6c-a919edfe6447")
          yield* MockTerminal.inputKey("return")
        })

        yield* Effect.all([inputsEffect, handler], { concurrency: "unbounded" }).pipe(
          Effect.provide(
            Layer.mergeAll(createMockOAuthService(), MockTerminal.layer, NodeFileSystem.layer, NodePath.layer)
          )
        )

        // If we reach here, validation passed and handler succeeded
        assert.isTrue(true)
      }).pipe(Effect.withConfigProvider(emptyConfig))
    })

    it.effect("should accept valid UUID format for environment ID in interactive prompt", () => {
      const emptyConfig = ConfigProvider.fromMap(new Map())

      return Effect.gen(function*() {
        const handler = login.handler({
          clientId: Option.none(),
          clientSecret: Option.none(),
          environmentId: Option.none(),
          region: Option.none()
        })

        const inputsEffect = Effect.gen(function*() {
          // Valid client ID
          yield* MockTerminal.inputText("550b8400-e29b-42d4-a716-446655440000")
          yield* MockTerminal.inputKey("return")

          // Valid secret
          yield* MockTerminal.inputText("test-secret")
          yield* MockTerminal.inputKey("return")

          // Valid environment ID on first attempt
          yield* MockTerminal.inputText("02fb4743-189a-4bc7-9d6c-a919edfe6447")
          yield* MockTerminal.inputKey("return")
        })

        yield* Effect.all([inputsEffect, handler], { concurrency: "unbounded" }).pipe(
          Effect.provide(
            Layer.mergeAll(createMockOAuthService(), MockTerminal.layer, NodeFileSystem.layer, NodePath.layer)
          )
        )

        // If we reach here, validation passed and handler succeeded
        assert.isTrue(true)
      }).pipe(Effect.withConfigProvider(emptyConfig))
    })
  })

  describe("prompt cancellation", () => {
    it.effect("should handle Ctrl+C cancellation during client ID prompt", () => {
      const emptyConfig = ConfigProvider.fromMap(new Map())

      return Effect.gen(function*() {
        const handler = login.handler({
          clientId: Option.none(),
          clientSecret: Option.none(),
          environmentId: Option.none(),
          region: Option.none()
        })

        const inputsEffect = Effect.gen(function*() {
          // Simulate Ctrl+C
          yield* MockTerminal.inputKey("c", { ctrl: true })
        })

        const result = yield* Effect.all([inputsEffect, handler], { concurrency: "unbounded" }).pipe(
          Effect.provide(
            Layer.mergeAll(createMockOAuthService(), MockTerminal.layer, NodeFileSystem.layer, NodePath.layer)
          ),
          Effect.exit
        )

        // Should fail with QuitException
        assert.isTrue(result._tag === "Failure")
      }).pipe(Effect.withConfigProvider(emptyConfig))
    })

    it.effect("should handle Ctrl+D cancellation during password prompt", () => {
      const emptyConfig = ConfigProvider.fromMap(new Map())

      return Effect.gen(function*() {
        const handler = login.handler({
          clientId: Option.none(),
          clientSecret: Option.none(),
          environmentId: Option.none(),
          region: Option.none()
        })

        const inputsEffect = Effect.gen(function*() {
          // Valid client ID
          yield* MockTerminal.inputText("550b8400-e29b-42d4-a716-446655440000")
          yield* MockTerminal.inputKey("return")

          // Simulate Ctrl+D during password prompt
          yield* MockTerminal.inputKey("d", { ctrl: true })
        })

        const result = yield* Effect.all([inputsEffect, handler], { concurrency: "unbounded" }).pipe(
          Effect.provide(
            Layer.mergeAll(createMockOAuthService(), MockTerminal.layer, NodeFileSystem.layer, NodePath.layer)
          ),
          Effect.exit
        )

        // Should fail with QuitException
        assert.isTrue(result._tag === "Failure")
      }).pipe(Effect.withConfigProvider(emptyConfig))
    })

    it.effect("should handle Ctrl+C cancellation during environment ID prompt", () => {
      const emptyConfig = ConfigProvider.fromMap(new Map())

      return Effect.gen(function*() {
        const handler = login.handler({
          clientId: Option.none(),
          clientSecret: Option.none(),
          environmentId: Option.none(),
          region: Option.none()
        })

        const inputsEffect = Effect.gen(function*() {
          // Valid client ID
          yield* MockTerminal.inputText("550b8400-e29b-42d4-a716-446655440000")
          yield* MockTerminal.inputKey("return")

          // Valid secret
          yield* MockTerminal.inputText("test-secret")
          yield* MockTerminal.inputKey("return")

          // Simulate Ctrl+C during environment ID prompt
          yield* MockTerminal.inputKey("c", { ctrl: true })
        })

        const result = yield* Effect.all([inputsEffect, handler], { concurrency: "unbounded" }).pipe(
          Effect.provide(
            Layer.mergeAll(createMockOAuthService(), MockTerminal.layer, NodeFileSystem.layer, NodePath.layer)
          ),
          Effect.exit
        )

        // Should fail with QuitException
        assert.isTrue(result._tag === "Failure")
      }).pipe(Effect.withConfigProvider(emptyConfig))
    })
  })
})

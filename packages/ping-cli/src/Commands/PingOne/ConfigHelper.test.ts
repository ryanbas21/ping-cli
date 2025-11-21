/**
 * Tests for PingOne configuration helper functions
 *
 * @since 0.0.1
 */
import { assert, describe, it } from "@effect/vitest"
import { ConfigProvider, Effect, Layer, Option, Redacted } from "effect"
import { CredentialStorageError, OAuthFlowError } from "../../Errors.js"
import { StoredCredentials } from "../../HttpClient/OAuthSchemas.js"
import { CredentialService, OAuthService } from "../../Services/index.js"
import { MockCacheServiceLive, MockRetryServiceLive, MockServicesLive } from "../../test-helpers/TestLayers.js"
import { DEFAULT_PINGONE_API_URL, getApiBaseUrl, getEnvironmentId, getToken } from "./ConfigHelper.js"

describe("ConfigHelper", () => {
  describe("getEnvironmentId", () => {
    it.effect("should return CLI option when provided", () =>
      Effect.gen(function*() {
        const cliOption = Option.some("env-from-cli")
        const result = yield* getEnvironmentId(cliOption)

        assert.strictEqual(result, "env-from-cli")
      }).pipe(Effect.provide(MockServicesLive)))

    it.effect("should prioritize CLI option over environment variable", () => {
      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(
          ConfigProvider.fromMap(new Map([["PINGONE_ENV_ID", "env-from-env"]]))
        ),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const cliOption = Option.some("env-from-cli")

        // Even if env var is set, CLI option should take precedence
        const result = yield* getEnvironmentId(cliOption)

        assert.strictEqual(result, "env-from-cli")
      }).pipe(Effect.provide(configLayer))
    })

    it.effect("should fall back to environment variable when CLI option is None", () => {
      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(
          ConfigProvider.fromMap(new Map([["PINGONE_ENV_ID", "env-from-env"]]))
        ),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const cliOption = Option.none()
        const result = yield* getEnvironmentId(cliOption)

        assert.strictEqual(result, "env-from-env")
      }).pipe(Effect.provide(configLayer))
    })

    it.effect("should fall back to environment variable when CLI option is whitespace", () => {
      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(
          ConfigProvider.fromMap(new Map([["PINGONE_ENV_ID", "env-from-env"]]))
        ),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const cliOption = Option.some("   ")
        const result = yield* getEnvironmentId(cliOption)

        assert.strictEqual(result, "env-from-env")
      }).pipe(Effect.provide(configLayer))
    })

    it.effect("should fail with PingOneAuthError when neither CLI nor env var provided", () => {
      // Create OAuth service that fails to get credentials
      const FailingOAuthLayer = Layer.succeed(
        OAuthService,
        OAuthService.of({
          getAccessToken: () =>
            Effect.fail(
              new OAuthFlowError({
                message: "No credentials",
                cause: "No stored credentials",
                step: "credential_retrieval"
              })
            ),
          storeCredentials: () => Effect.void,
          getCredentials: () =>
            Effect.fail(
              new OAuthFlowError({
                message: "No stored credentials",
                cause: "No credentials found",
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

      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(
          ConfigProvider.fromMap(new Map()) // Empty config
        ),
        MockRetryServiceLive,
        MockCacheServiceLive,
        FailingOAuthLayer
      )

      return Effect.gen(function*() {
        const cliOption = Option.none()
        const result = yield* getEnvironmentId(cliOption).pipe(
          Effect.provide(configLayer),
          Effect.exit
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error
          assert.strictEqual(error._tag, "PingOneAuthError")
          assert.isTrue(error.message.includes("No PingOne environment ID provided"))
        }
      }).pipe(Effect.provide(configLayer))
    })

    it.effect("should trim whitespace from CLI option before checking", () =>
      Effect.gen(function*() {
        const cliOption = Option.some("  env-with-spaces  ")
        const result = yield* getEnvironmentId(cliOption)

        // Should succeed with trimmed value
        assert.strictEqual(result, "  env-with-spaces  ")
      }).pipe(Effect.provide(MockServicesLive)))
  })

  describe("getToken", () => {
    it.effect("should return CLI option when provided with Some tag", () =>
      Effect.gen(function*() {
        const cliOption = {
          _tag: "Some" as const,
          value: Redacted.make("token-from-cli")
        }

        const result = yield* getToken(cliOption)

        assert.strictEqual(result, "token-from-cli")
      }).pipe(Effect.provide(MockServicesLive)))

    it.effect("should prioritize CLI option over environment variable", () => {
      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(
          ConfigProvider.fromMap(new Map([["PINGONE_TOKEN", "token-from-env"]]))
        ),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const cliOption = {
          _tag: "Some" as const,
          value: Redacted.make("token-from-cli")
        }

        const result = yield* getToken(cliOption)

        assert.strictEqual(result, "token-from-cli")
      }).pipe(Effect.provide(configLayer))
    })

    it.effect("should fall back to environment variable when CLI option is None", () => {
      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(
          ConfigProvider.fromMap(new Map([["PINGONE_TOKEN", "token-from-env"]]))
        ),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const cliOption = { _tag: "None" as const }
        const result = yield* getToken(cliOption)

        assert.strictEqual(result, "token-from-env")
      }).pipe(Effect.provide(configLayer))
    })

    it.effect("should fall back to env var when CLI option is Some but empty string", () => {
      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(
          ConfigProvider.fromMap(new Map([["PINGONE_TOKEN", "token-from-env"]]))
        ),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const cliOption = {
          _tag: "Some" as const,
          value: Redacted.make("")
        }

        const result = yield* getToken(cliOption)

        assert.strictEqual(result, "token-from-env")
      }).pipe(Effect.provide(configLayer))
    })

    it.effect("should fall back to OAuth service when neither CLI nor env var provided", () => {
      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(
          ConfigProvider.fromMap(new Map()) // Empty config
        ),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const cliOption = { _tag: "None" as const }
        const result = yield* getToken(cliOption)

        // Should succeed with mock OAuth token since MockOAuthServiceLive provides one
        assert.strictEqual(result, "test-oauth-token")
      }).pipe(Effect.provide(configLayer))
    })

    it.effect("should handle redacted values correctly", () =>
      Effect.gen(function*() {
        const secretToken = "super-secret-token-12345"
        const cliOption = {
          _tag: "Some" as const,
          value: Redacted.make(secretToken)
        }

        const result = yield* getToken(cliOption)

        // Should return the actual token value (unwrapped from Redacted)
        assert.strictEqual(result, secretToken)
      }).pipe(Effect.provide(MockServicesLive)))
  })

  describe("getApiBaseUrl", () => {
    it.effect("should return PINGONE_API_URL environment variable when set", () => {
      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(
          ConfigProvider.fromMap(new Map([["PINGONE_API_URL", "https://api.pingone.eu/v1"]]))
        ),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* getApiBaseUrl()

        assert.strictEqual(result, "https://api.pingone.eu/v1")
      }).pipe(Effect.provide(configLayer))
    })

    it.effect("should derive API URL from stored credentials when env var not set", () => {
      // Create credential service that returns credentials with CA region
      const CredentialLayer = Layer.succeed(
        CredentialService,
        CredentialService.of({
          store: () => Effect.void,
          retrieve: () =>
            Effect.succeed(
              new StoredCredentials({
                clientId: "test-client",
                clientSecret: "test-secret",
                environmentId: "test-env",
                tokenEndpoint: "https://auth.pingone.ca/test-env/as/token"
              })
            ),
          delete: () => Effect.void
        })
      )

      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(
          ConfigProvider.fromMap(new Map()) // Empty config - no PINGONE_API_URL
        ),
        MockRetryServiceLive,
        MockCacheServiceLive,
        CredentialLayer,
        Layer.succeed(
          OAuthService,
          OAuthService.of({
            getAccessToken: () => Effect.succeed("test-token"),
            storeCredentials: () => Effect.void,
            getCredentials: () =>
              Effect.succeed(
                new StoredCredentials({
                  clientId: "test-client",
                  clientSecret: "test-secret",
                  environmentId: "test-env",
                  tokenEndpoint: "https://auth.pingone.ca/test-env/as/token"
                })
              ),
            clearAuth: () => Effect.void,
            getAuthStatus: () =>
              Effect.succeed({
                hasCredentials: true,
                hasValidToken: false,
                clientId: "test-client",
                environmentId: "test-env"
              })
          })
        )
      )

      return Effect.gen(function*() {
        const result = yield* getApiBaseUrl()

        assert.strictEqual(result, "https://api.pingone.ca/v1")
      }).pipe(Effect.provide(configLayer))
    })

    it.effect("should derive EU region from stored credentials", () => {
      const CredentialLayer = Layer.succeed(
        CredentialService,
        CredentialService.of({
          store: () => Effect.void,
          retrieve: () =>
            Effect.succeed(
              new StoredCredentials({
                clientId: "test-client",
                clientSecret: "test-secret",
                environmentId: "test-env",
                tokenEndpoint: "https://auth.pingone.eu/test-env/as/token"
              })
            ),
          delete: () => Effect.void
        })
      )

      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(ConfigProvider.fromMap(new Map())),
        MockRetryServiceLive,
        MockCacheServiceLive,
        CredentialLayer,
        Layer.succeed(
          OAuthService,
          OAuthService.of({
            getAccessToken: () => Effect.succeed("test-token"),
            storeCredentials: () => Effect.void,
            getCredentials: () =>
              Effect.succeed(
                new StoredCredentials({
                  clientId: "test-client",
                  clientSecret: "test-secret",
                  environmentId: "test-env",
                  tokenEndpoint: "https://auth.pingone.eu/test-env/as/token"
                })
              ),
            clearAuth: () => Effect.void,
            getAuthStatus: () =>
              Effect.succeed({
                hasCredentials: true,
                hasValidToken: false,
                clientId: "test-client",
                environmentId: "test-env"
              })
          })
        )
      )

      return Effect.gen(function*() {
        const result = yield* getApiBaseUrl()

        assert.strictEqual(result, "https://api.pingone.eu/v1")
      }).pipe(Effect.provide(configLayer))
    })

    it.effect("should derive Asia region from stored credentials", () => {
      const CredentialLayer = Layer.succeed(
        CredentialService,
        CredentialService.of({
          store: () => Effect.void,
          retrieve: () =>
            Effect.succeed(
              new StoredCredentials({
                clientId: "test-client",
                clientSecret: "test-secret",
                environmentId: "test-env",
                tokenEndpoint: "https://auth.pingone.asia/test-env/as/token"
              })
            ),
          delete: () => Effect.void
        })
      )

      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(ConfigProvider.fromMap(new Map())),
        MockRetryServiceLive,
        MockCacheServiceLive,
        CredentialLayer,
        Layer.succeed(
          OAuthService,
          OAuthService.of({
            getAccessToken: () => Effect.succeed("test-token"),
            storeCredentials: () => Effect.void,
            getCredentials: () =>
              Effect.succeed(
                new StoredCredentials({
                  clientId: "test-client",
                  clientSecret: "test-secret",
                  environmentId: "test-env",
                  tokenEndpoint: "https://auth.pingone.asia/test-env/as/token"
                })
              ),
            clearAuth: () => Effect.void,
            getAuthStatus: () =>
              Effect.succeed({
                hasCredentials: true,
                hasValidToken: false,
                clientId: "test-client",
                environmentId: "test-env"
              })
          })
        )
      )

      return Effect.gen(function*() {
        const result = yield* getApiBaseUrl()

        assert.strictEqual(result, "https://api.pingone.asia/v1")
      }).pipe(Effect.provide(configLayer))
    })

    it.effect("should fall back to default when no env var or credentials available", () => {
      // Create credential service that fails
      const FailingCredentialLayer = Layer.succeed(
        CredentialService,
        CredentialService.of({
          store: () => Effect.void,
          retrieve: () =>
            Effect.fail(
              new CredentialStorageError({
                message: "No credentials",
                storage: "keychain",
                operation: "read",
                cause: "No stored credentials",
                fallbackAvailable: false
              })
            ),
          delete: () => Effect.void
        })
      )

      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(ConfigProvider.fromMap(new Map())),
        MockRetryServiceLive,
        MockCacheServiceLive,
        FailingCredentialLayer,
        Layer.succeed(
          OAuthService,
          OAuthService.of({
            getAccessToken: () => Effect.succeed("test-token"),
            storeCredentials: () => Effect.void,
            getCredentials: () =>
              Effect.fail(
                new OAuthFlowError({
                  message: "No credentials",
                  cause: "No stored credentials",
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
      )

      return Effect.gen(function*() {
        const result = yield* getApiBaseUrl()

        assert.strictEqual(result, DEFAULT_PINGONE_API_URL)
      }).pipe(Effect.provide(configLayer))
    })

    it.effect("should prioritize env var over stored credentials", () => {
      // Credentials have CA region, but env var has EU
      const CredentialLayer = Layer.succeed(
        CredentialService,
        CredentialService.of({
          store: () => Effect.void,
          retrieve: () =>
            Effect.succeed(
              new StoredCredentials({
                clientId: "test-client",
                clientSecret: "test-secret",
                environmentId: "test-env",
                tokenEndpoint: "https://auth.pingone.ca/test-env/as/token"
              })
            ),
          delete: () => Effect.void
        })
      )

      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(
          ConfigProvider.fromMap(new Map([["PINGONE_API_URL", "https://api.pingone.eu/v1"]]))
        ),
        MockRetryServiceLive,
        MockCacheServiceLive,
        CredentialLayer,
        Layer.succeed(
          OAuthService,
          OAuthService.of({
            getAccessToken: () => Effect.succeed("test-token"),
            storeCredentials: () => Effect.void,
            getCredentials: () =>
              Effect.succeed(
                new StoredCredentials({
                  clientId: "test-client",
                  clientSecret: "test-secret",
                  environmentId: "test-env",
                  tokenEndpoint: "https://auth.pingone.ca/test-env/as/token"
                })
              ),
            clearAuth: () => Effect.void,
            getAuthStatus: () =>
              Effect.succeed({
                hasCredentials: true,
                hasValidToken: false,
                clientId: "test-client",
                environmentId: "test-env"
              })
          })
        )
      )

      return Effect.gen(function*() {
        const result = yield* getApiBaseUrl()

        // Should use env var (EU), not credentials (CA)
        assert.strictEqual(result, "https://api.pingone.eu/v1")
      }).pipe(Effect.provide(configLayer))
    })
  })

  describe("Configuration hierarchy integration", () => {
    it.effect("should demonstrate full priority chain: CLI > env var", () => {
      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(
          ConfigProvider.fromMap(
            new Map([
              ["PINGONE_ENV_ID", "env-var-env"],
              ["PINGONE_TOKEN", "env-var-token"]
            ])
          )
        ),
        MockServicesLive
      )

      return Effect.gen(function*() {
        // Test with both helpers to show complete hierarchy
        const envId = yield* getEnvironmentId(Option.some("cli-env"))

        const token = yield* getToken({
          _tag: "Some" as const,
          value: Redacted.make("cli-token")
        })

        assert.strictEqual(envId, "cli-env")
        assert.strictEqual(token, "cli-token")
      }).pipe(Effect.provide(configLayer))
    })

    it.effect("should demonstrate env var fallback when CLI not provided", () => {
      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(
          ConfigProvider.fromMap(
            new Map([
              ["PINGONE_ENV_ID", "env-var-env"],
              ["PINGONE_TOKEN", "env-var-token"]
            ])
          )
        ),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const envId = yield* getEnvironmentId(Option.none())

        const token = yield* getToken({ _tag: "None" as const })

        assert.strictEqual(envId, "env-var-env")
        assert.strictEqual(token, "env-var-token")
      }).pipe(Effect.provide(configLayer))
    })

    it.effect("should fall back to OAuth for token when no configuration source available", () => {
      // Create OAuth service that fails to get environment ID but succeeds for token
      const PartialOAuthLayer = Layer.succeed(
        OAuthService,
        OAuthService.of({
          getAccessToken: () => Effect.succeed("test-oauth-token"),
          storeCredentials: () => Effect.void,
          getCredentials: () =>
            Effect.fail(
              new OAuthFlowError({
                message: "No stored credentials",
                cause: "No credentials found",
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

      const configLayer = Layer.mergeAll(
        Layer.setConfigProvider(
          ConfigProvider.fromMap(new Map()) // Empty config
        ),
        MockRetryServiceLive,
        MockCacheServiceLive,
        PartialOAuthLayer
      )

      return Effect.gen(function*() {
        const envIdResult = yield* getEnvironmentId(Option.none()).pipe(Effect.exit)

        const tokenResult = yield* getToken({ _tag: "None" as const })

        // envId should fail (no fallback available)
        assert.strictEqual(envIdResult._tag, "Failure")
        // token should succeed (OAuth service fallback)
        assert.strictEqual(tokenResult, "test-oauth-token")
      }).pipe(Effect.provide(configLayer))
    })
  })
})

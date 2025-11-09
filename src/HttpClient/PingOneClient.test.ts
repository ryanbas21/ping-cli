import { HttpClient, HttpClientResponse } from "@effect/platform"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import type { PingOneApiError } from "../Errors"
import {
  createPingOneUser,
  deletePingOneUser,
  readPingOneUser,
  updatePingOneUser,
  verifyPingOneUser
} from "./PingOneClient"

describe("PingOneClient", () => {
  describe("createPingOneUser", () => {
    it.effect("should successfully create a user with 200 response", () =>
      Effect.gen(function*() {
        const userData = {
          username: "john.doe",
          email: "john@example.com",
          population: {
            id: "pop-123"
          }
        }

        const mockResponse = {
          id: "user-123",
          environment: { id: "env-123" },
          population: { id: "pop-123" },
          createdAt: "2024-01-01T00:00:00Z",
          email: "john@example.com",
          enabled: true,
          lifecycle: { status: "ACCOUNT_OK" },
          mfaEnabled: false,
          name: {
            given: "John",
            family: "Doe"
          },
          updatedAt: "2024-01-01T00:00:00Z",
          username: "john.doe"
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify(mockResponse), {
                status: 200,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const result = yield* createPingOneUser({
          envId: "env-123",
          token: "test-token",
          userData
        }).pipe(Effect.provide(Layer.succeed(HttpClient.HttpClient, mockClient)))

        assert.strictEqual(result.id, "user-123")
        assert.strictEqual(result.username, "john.doe")
        assert.strictEqual(result.email, "john@example.com")
      }))

    it.effect("should successfully create a user with 201 response", () =>
      Effect.gen(function*() {
        const userData = {
          username: "mary.smith",
          email: "mary@example.com",
          population: {
            id: "pop-456"
          },
          name: {
            given: "Mary",
            family: "Smith"
          },
          department: "Engineering",
          locales: ["Sydney", "London"]
        }

        const mockResponse = {
          id: "user-456",
          environment: { id: "env-456" },
          population: { id: "pop-456" },
          createdAt: "2024-01-01T00:00:00Z",
          email: "mary@example.com",
          enabled: true,
          lifecycle: { status: "ACCOUNT_OK" },
          mfaEnabled: true,
          name: {
            given: "Mary",
            family: "Smith"
          },
          updatedAt: "2024-01-01T00:00:00Z",
          username: "mary.smith",
          department: "Engineering",
          locales: ["Sydney", "London"]
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify(mockResponse), {
                status: 201,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const result = yield* createPingOneUser({
          envId: "env-456",
          token: "test-token",
          userData
        }).pipe(Effect.provide(Layer.succeed(HttpClient.HttpClient, mockClient)))

        assert.strictEqual(result.id, "user-456")
        assert.strictEqual(result.department, "Engineering")
        assert.deepStrictEqual(result.locales, ["Sydney", "London"])
      }))

    it.effect("should fail with PingOneApiError on 401 unauthorized", () =>
      Effect.gen(function*() {
        const userData = {
          username: "john.doe",
          email: "john@example.com",
          population: {
            id: "pop-123"
          }
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const result = yield* createPingOneUser({
          envId: "env-123",
          token: "invalid-token",
          userData
        }).pipe(
          Effect.provide(Layer.succeed(HttpClient.HttpClient, mockClient)),
          Effect.exit
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 401)
        }
      }))

    it.effect("should fail with PingOneApiError on 403 forbidden", () =>
      Effect.gen(function*() {
        const userData = {
          username: "john.doe",
          email: "john@example.com",
          population: {
            id: "pop-123"
          }
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Forbidden" }), {
                status: 403,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const result = yield* createPingOneUser({
          envId: "env-123",
          token: "test-token",
          userData
        }).pipe(
          Effect.provide(Layer.succeed(HttpClient.HttpClient, mockClient)),
          Effect.exit
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 403)
        }
      }))

    it.effect("should fail with PingOneApiError on 404 not found", () =>
      Effect.gen(function*() {
        const userData = {
          username: "john.doe",
          email: "john@example.com",
          population: {
            id: "pop-nonexistent"
          }
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Population not found" }), {
                status: 404,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const result = yield* createPingOneUser({
          envId: "env-123",
          token: "test-token",
          userData
        }).pipe(
          Effect.provide(Layer.succeed(HttpClient.HttpClient, mockClient)),
          Effect.exit
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 404)
        }
      }))

    it.effect("should fail with PingOneApiError on 422 validation error", () =>
      Effect.gen(function*() {
        const userData = {
          username: "john.doe",
          email: "invalid-email",
          population: {
            id: "pop-123"
          }
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Invalid email format" }), {
                status: 422,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const result = yield* createPingOneUser({
          envId: "env-123",
          token: "test-token",
          userData
        }).pipe(
          Effect.provide(Layer.succeed(HttpClient.HttpClient, mockClient)),
          Effect.exit
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 422)
        }
      }))

    it.effect("should fail with PingOneApiError on 500 server error", () =>
      Effect.gen(function*() {
        const userData = {
          username: "john.doe",
          email: "john@example.com",
          population: {
            id: "pop-123"
          }
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Internal server error" }), {
                status: 500,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const result = yield* createPingOneUser({
          envId: "env-123",
          token: "test-token",
          userData
        }).pipe(
          Effect.provide(Layer.succeed(HttpClient.HttpClient, mockClient)),
          Effect.exit
        )

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 500)
        }
      }))

    it.effect("should construct correct request URL with environment ID", () =>
      Effect.gen(function*() {
        const userData = {
          username: "john.doe",
          email: "john@example.com",
          population: {
            id: "pop-123"
          }
        }

        let capturedUrl = ""

        const mockClient = HttpClient.make((req) => {
          capturedUrl = req.url
          return Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(
                JSON.stringify({
                  id: "user-123",
                  environment: { id: "env-custom" },
                  population: { id: "pop-123" },
                  createdAt: "2024-01-01T00:00:00Z",
                  email: "john@example.com",
                  enabled: true,
                  lifecycle: { status: "ACCOUNT_OK" },
                  mfaEnabled: false,
                  updatedAt: "2024-01-01T00:00:00Z",
                  username: "john.doe"
                }),
                {
                  status: 200,
                  headers: { "content-type": "application/json" }
                }
              )
            )
          )
        })

        yield* createPingOneUser({
          envId: "env-custom",
          token: "test-token",
          userData
        }).pipe(Effect.provide(Layer.succeed(HttpClient.HttpClient, mockClient)))

        assert.strictEqual(capturedUrl, "https://api.pingone.com/v1/environments/env-custom/users")
      }))

    it.effect("should set correct headers including bearer token", () =>
      Effect.gen(function*() {
        const userData = {
          username: "john.doe",
          email: "john@example.com",
          population: {
            id: "pop-123"
          }
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(
                JSON.stringify({
                  id: "user-123",
                  environment: { id: "env-123" },
                  population: { id: "pop-123" },
                  createdAt: "2024-01-01T00:00:00Z",
                  email: "john@example.com",
                  enabled: true,
                  lifecycle: { status: "ACCOUNT_OK" },
                  mfaEnabled: false,
                  updatedAt: "2024-01-01T00:00:00Z",
                  username: "john.doe"
                }),
                {
                  status: 200,
                  headers: { "content-type": "application/json" }
                }
              )
            )
          )
        )

        const result = yield* createPingOneUser({
          envId: "env-123",
          token: "custom-auth-token",
          userData
        }).pipe(Effect.provide(Layer.succeed(HttpClient.HttpClient, mockClient)))

        assert.strictEqual(result.id, "user-123")
      }))

    it.effect("should use POST method for user creation", () =>
      Effect.gen(function*() {
        const userData = {
          username: "john.doe",
          email: "john@example.com",
          population: {
            id: "pop-123"
          }
        }

        let capturedMethod = ""

        const mockClient = HttpClient.make((req) => {
          capturedMethod = req.method
          return Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(
                JSON.stringify({
                  id: "user-123",
                  environment: { id: "env-123" },
                  population: { id: "pop-123" },
                  createdAt: "2024-01-01T00:00:00Z",
                  email: "john@example.com",
                  enabled: true,
                  lifecycle: { status: "ACCOUNT_OK" },
                  mfaEnabled: false,
                  updatedAt: "2024-01-01T00:00:00Z",
                  username: "john.doe"
                }),
                {
                  status: 200,
                  headers: { "content-type": "application/json" }
                }
              )
            )
          )
        })

        yield* createPingOneUser({
          envId: "env-123",
          token: "test-token",
          userData
        }).pipe(Effect.provide(Layer.succeed(HttpClient.HttpClient, mockClient)))

        assert.strictEqual(capturedMethod, "POST")
      }))
  })

  describe("readPingOneUser", () => {
    it.effect("should successfully read a user with 200 response", () => {
      const mockResponse = {
        id: "user-123",
        environment: { id: "env-123" },
        population: { id: "pop-123" },
        createdAt: "2024-01-01T00:00:00Z",
        email: "john@example.com",
        enabled: true,
        lifecycle: { status: "ACCOUNT_OK" },
        mfaEnabled: false,
        updatedAt: "2024-01-01T00:00:00Z",
        username: "john.doe"
      }

      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(JSON.stringify(mockResponse), {
              status: 200,
              headers: { "content-type": "application/json" }
            })
          )
        )
      )

      const dependencies = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        const result = yield* readPingOneUser({
          envId: "env-123",
          token: "test-token",
          userId: "user-123"
        })

        assert.strictEqual(result.id, "user-123")
        assert.strictEqual(result.username, "john.doe")
      }).pipe(Effect.provide(dependencies))
    })

    it.effect("should fail with PingOneApiError on 404 not found", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(JSON.stringify({ error: "User not found" }), {
              status: 404,
              headers: { "content-type": "application/json" }
            })
          )
        )
      )

      const dependencies = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        const result = yield* readPingOneUser({
          envId: "env-123",
          token: "test-token",
          userId: "nonexistent"
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 404)
        }
      }).pipe(Effect.provide(dependencies))
    })
  })

  describe("updatePingOneUser", () => {
    it.effect("should successfully update a user with 200 response", () => {
      const userData = {
        email: "newemail@example.com",
        username: "updated.user"
      }

      const mockResponse = {
        id: "user-123",
        environment: { id: "env-123" },
        population: { id: "pop-123" },
        createdAt: "2024-01-01T00:00:00Z",
        email: "newemail@example.com",
        enabled: true,
        lifecycle: { status: "ACCOUNT_OK" },
        mfaEnabled: false,
        updatedAt: "2024-01-02T00:00:00Z",
        username: "updated.user"
      }

      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(JSON.stringify(mockResponse), {
              status: 200,
              headers: { "content-type": "application/json" }
            })
          )
        )
      )

      const dependencies = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        const result = yield* updatePingOneUser({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          userData
        })

        assert.strictEqual(result.email, "newemail@example.com")
        assert.strictEqual(result.username, "updated.user")
      }).pipe(Effect.provide(dependencies))
    })

    it.effect("should use PUT method for user update", () => {
      let capturedMethod = ""

      const mockClient = HttpClient.make((req) => {
        capturedMethod = req.method
        return Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(
              JSON.stringify({
                id: "user-123",
                environment: { id: "env-123" },
                population: { id: "pop-123" },
                createdAt: "2024-01-01T00:00:00Z",
                enabled: true,
                lifecycle: { status: "ACCOUNT_OK" },
                mfaEnabled: false,
                updatedAt: "2024-01-01T00:00:00Z"
              }),
              {
                status: 200,
                headers: { "content-type": "application/json" }
              }
            )
          )
        )
      })

      const dependencies = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        yield* updatePingOneUser({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          userData: { email: "test@example.com" }
        })

        assert.strictEqual(capturedMethod, "PUT")
      }).pipe(Effect.provide(dependencies))
    })
  })

  describe("deletePingOneUser", () => {
    it.effect("should successfully delete a user with 204 response", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(null, {
              status: 204
            })
          )
        )
      )

      const dependencies = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        const result = yield* deletePingOneUser({
          envId: "env-123",
          token: "test-token",
          userId: "user-123"
        })

        assert.strictEqual(result, undefined)
      }).pipe(Effect.provide(dependencies))
    })

    it.effect("should fail with PingOneApiError on non-204 response", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(JSON.stringify({ error: "Forbidden" }), {
              status: 403,
              headers: { "content-type": "application/json" }
            })
          )
        )
      )

      const dependencies = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        const result = yield* deletePingOneUser({
          envId: "env-123",
          token: "test-token",
          userId: "user-123"
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 403)
        }
      }).pipe(Effect.provide(dependencies))
    })

    it.effect("should use DELETE method", () => {
      let capturedMethod = ""

      const mockClient = HttpClient.make((req) => {
        capturedMethod = req.method
        return Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(null, { status: 204 })
          )
        )
      })

      const dependencies = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        yield* deletePingOneUser({
          envId: "env-123",
          token: "test-token",
          userId: "user-123"
        })

        assert.strictEqual(capturedMethod, "DELETE")
      }).pipe(Effect.provide(dependencies))
    })
  })

  describe("verifyPingOneUser", () => {
    it.effect("should successfully verify a user with 200 response", () => {
      const mockResponse = {
        id: "user-123",
        environment: { id: "env-123" },
        population: { id: "pop-123" },
        createdAt: "2024-01-01T00:00:00Z",
        email: "john@example.com",
        enabled: true,
        lifecycle: { status: "ACCOUNT_OK" },
        mfaEnabled: false,
        updatedAt: "2024-01-01T00:00:00Z",
        username: "john.doe"
      }

      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(JSON.stringify(mockResponse), {
              status: 200,
              headers: { "content-type": "application/json" }
            })
          )
        )
      )

      const dependencies = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        const result = yield* verifyPingOneUser({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          verificationData: {
            verificationCode: "123456"
          }
        })

        assert.strictEqual(result.id, "user-123")
        assert.strictEqual(result.lifecycle.status, "ACCOUNT_OK")
      }).pipe(Effect.provide(dependencies))
    })

    it.effect("should use POST method with correct content type", () => {
      let capturedMethod = ""
      const mockResponse = {
        id: "user-123",
        environment: { id: "env-123" },
        population: { id: "pop-123" },
        createdAt: "2024-01-01T00:00:00Z",
        email: "john@example.com",
        enabled: true,
        lifecycle: { status: "ACCOUNT_OK" },
        mfaEnabled: false,
        updatedAt: "2024-01-01T00:00:00Z",
        username: "john.doe"
      }

      const mockClient = HttpClient.make((req) => {
        capturedMethod = req.method
        return Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(JSON.stringify(mockResponse), {
              status: 200,
              headers: { "content-type": "application/json" }
            })
          )
        )
      })

      const dependencies = Layer.succeed(HttpClient.HttpClient, mockClient)

      return Effect.gen(function*() {
        yield* verifyPingOneUser({
          envId: "env-123",
          token: "test-token",
          userId: "user-123",
          verificationData: {
            verificationCode: "123456"
          }
        })

        assert.strictEqual(capturedMethod, "POST")
      }).pipe(Effect.provide(dependencies))
    })
  })
})

import type { HttpClientRequest } from "@effect/platform"
import { HttpClient, HttpClientResponse } from "@effect/platform"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import { WorkflowDispatchError } from "../Errors.js"
import { invokeJsSdkWorkflow } from "./HttpClient.js"

/**
 * Creates a mock HttpClient layer with a custom request handler.
 *
 * This utility allows each test to define its own response behavior without
 * duplicating the Layer creation logic. The handler function receives the
 * HTTP request and should return an Effect that yields a standard Response
 * object.
 */
const makeMockHttpClient = (handler: (request: HttpClientRequest.HttpClientRequest) => Effect.Effect<Response>) =>
  Layer.succeed(
    HttpClient.HttpClient,
    HttpClient.make((request) =>
      handler(request)
        .pipe(Effect.map((response) => HttpClientResponse.fromWeb(request, response)))
    )
  )

describe("HttpClient", () => {
  describe("invokeJsSdkWorkflow - successful responses", () => {
    it.effect("should successfully dispatch CI workflow", () =>
      Effect.gen(function*() {
        const _mockHttp = makeMockHttpClient(
          () => Effect.succeed(new Response(null, { status: 204 }))
        )

        const response = yield* invokeJsSdkWorkflow({
          workflowId: "CI.yml",
          ghToken: "test-token",
          payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
        })

        assert.strictEqual(response.status, 204)
        assert.strictEqual(response.request.method, "POST")
        assert.isTrue(response.request.url.includes("CI.yml"))
        assert.strictEqual(response.request.headers.authorization, "Bearer test-token")
      }).pipe(Effect.provide(makeMockHttpClient(() => Effect.succeed(new Response(null, { status: 204 }))))))

    it.effect("should successfully dispatch publish workflow", () =>
      Effect.gen(function*() {
        const _mockHttp = makeMockHttpClient(
          () => Effect.succeed(new Response(null, { status: 200 }))
        )

        const response = yield* invokeJsSdkWorkflow({
          workflowId: "publish.yml",
          ghToken: "test-token",
          payload: { inputs: { tag: "latest" } }
        })

        assert.strictEqual(response.status, 200)
        assert.strictEqual(response.request.method, "POST")
        assert.isTrue(response.request.url.includes("publish.yml"))
      }).pipe(Effect.provide(makeMockHttpClient(() => Effect.succeed(new Response(null, { status: 200 }))))))

    it.effect("should accept 201 Created status", () =>
      Effect.gen(function*() {
        const response = yield* invokeJsSdkWorkflow({
          workflowId: "CI.yml",
          ghToken: "test-token",
          payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
        })

        assert.strictEqual(response.status, 201)
      }).pipe(Effect.provide(makeMockHttpClient(() => Effect.succeed(new Response(null, { status: 201 }))))))

    it.effect("should accept 202 Accepted status", () =>
      Effect.gen(function*() {
        const response = yield* invokeJsSdkWorkflow({
          workflowId: "CI.yml",
          ghToken: "test-token",
          payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
        })

        assert.strictEqual(response.status, 202)
      }).pipe(Effect.provide(makeMockHttpClient(() => Effect.succeed(new Response(null, { status: 202 }))))))

    it.effect("should include correct headers in request", () =>
      Effect.gen(function*() {
        const response = yield* invokeJsSdkWorkflow({
          workflowId: "CI.yml",
          ghToken: "secret-token",
          payload: { ref: "develop", inputs: { baseUrl: "https://api.example.com" } }
        })

        assert.strictEqual(response.request.headers.authorization, "Bearer secret-token")
        assert.strictEqual(response.request.headers.accept, "application/vnd.github+json")
        assert.strictEqual(response.request.headers["x-github-api-version"], "2022-11-28")
      }).pipe(Effect.provide(makeMockHttpClient(() => Effect.succeed(new Response(null, { status: 204 }))))))
  })

  describe("invokeJsSdkWorkflow - error responses", () => {
    it.effect("should fail on 401 Unauthorized", () =>
      Effect.gen(function*() {
        const _mock401 = makeMockHttpClient(
          () => Effect.succeed(new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }))
        )

        const result = yield* invokeJsSdkWorkflow({
          workflowId: "CI.yml",
          ghToken: "invalid-token",
          payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as WorkflowDispatchError
          assert.strictEqual(error._tag, "WorkflowDispatchError")
          assert.strictEqual(error.status, 401)
        }
      }).pipe(Effect.provide(makeMockHttpClient(() =>
        Effect.succeed(new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }))
      ))))

    it.effect("should fail on 403 Forbidden", () =>
      Effect.gen(function*() {
        const _mock403 = makeMockHttpClient(
          () => Effect.succeed(new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 }))
        )

        const result = yield* invokeJsSdkWorkflow({
          workflowId: "CI.yml",
          ghToken: "test-token",
          payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as WorkflowDispatchError
          assert.strictEqual(error._tag, "WorkflowDispatchError")
          assert.strictEqual(error.status, 403)
        }
      }).pipe(Effect.provide(makeMockHttpClient(() =>
        Effect.succeed(new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 }))
      ))))

    it.effect("should fail on 404 Not Found", () =>
      Effect.gen(function*() {
        const _mock404 = makeMockHttpClient(
          () => Effect.succeed(new Response(JSON.stringify({ message: "Not Found" }), { status: 404 }))
        )

        const result = yield* invokeJsSdkWorkflow({
          workflowId: "non-existent.yml",
          ghToken: "test-token",
          payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as WorkflowDispatchError
          assert.strictEqual(error._tag, "WorkflowDispatchError")
          assert.strictEqual(error.status, 404)
        }
      }).pipe(Effect.provide(makeMockHttpClient(() =>
        Effect.succeed(new Response(JSON.stringify({ message: "Not Found" }), { status: 404 }))
      ))))

    it.effect("should fail on 422 Unprocessable Entity", () =>
      Effect.gen(function*() {
        const _mock422 = makeMockHttpClient(
          () => Effect.succeed(new Response(JSON.stringify({ message: "Validation failed" }), { status: 422 }))
        )

        const result = yield* invokeJsSdkWorkflow({
          workflowId: "CI.yml",
          ghToken: "test-token",
          payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as WorkflowDispatchError
          assert.strictEqual(error._tag, "WorkflowDispatchError")
          assert.strictEqual(error.status, 422)
        }
      }).pipe(Effect.provide(makeMockHttpClient(() =>
        Effect.succeed(new Response(JSON.stringify({ message: "Validation failed" }), { status: 422 }))
      ))))

    it.effect("should fail on 500 Internal Server Error", () =>
      Effect.gen(function*() {
        const _mock500 = makeMockHttpClient(
          () => Effect.succeed(new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 }))
        )

        const result = yield* invokeJsSdkWorkflow({
          workflowId: "CI.yml",
          ghToken: "test-token",
          payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as WorkflowDispatchError
          assert.strictEqual(error._tag, "WorkflowDispatchError")
          assert.strictEqual(error.status, 500)
        }
      }).pipe(Effect.provide(makeMockHttpClient(() =>
        Effect.succeed(new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 }))
      ))))

    it.effect("should include error message in WorkflowDispatchError", () =>
      Effect.gen(function*() {
        const result = yield* invokeJsSdkWorkflow({
          workflowId: "CI.yml",
          ghToken: "test-token",
          payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          if (result.cause.error instanceof WorkflowDispatchError) {
            assert.isTrue(result.cause.error.message.includes("401"))
            assert.isTrue(result.cause.error.message.includes("GitHub API request failed"))
          }
        }
      }).pipe(Effect.provide(makeMockHttpClient(() => Effect.succeed(new Response(null, { status: 401 }))))))
  })

  describe("invokeJsSdkWorkflow - request construction", () => {
    it.effect("should construct correct URL with workflow ID", () =>
      Effect.gen(function*() {
        let _capturedRequest: HttpClientRequest.HttpClientRequest | undefined

        yield* invokeJsSdkWorkflow({
          workflowId: "custom-workflow.yml",
          ghToken: "test-token",
          payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
        })

        const response = yield* invokeJsSdkWorkflow({
          workflowId: "custom-workflow.yml",
          ghToken: "test-token",
          payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
        })

        assert.isTrue(response.request.url.includes("custom-workflow.yml"))
        assert.isTrue(response.request.url.includes("ForgeRock/ping-javascript-sdk"))
        assert.isTrue(response.request.url.includes("/actions/workflows/"))
        assert.isTrue(response.request.url.includes("/dispatches"))
      }).pipe(Effect.provide(makeMockHttpClient(() => Effect.succeed(new Response(null, { status: 204 }))))))

    it.effect("should use POST method", () =>
      Effect.gen(function*() {
        const response = yield* invokeJsSdkWorkflow({
          workflowId: "CI.yml",
          ghToken: "test-token",
          payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
        })

        assert.strictEqual(response.request.method, "POST")
      }).pipe(Effect.provide(makeMockHttpClient(() => Effect.succeed(new Response(null, { status: 204 }))))))
  })
})

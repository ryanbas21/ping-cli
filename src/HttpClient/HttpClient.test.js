"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const platform_1 = require("@effect/platform");
const vitest_1 = require("@effect/vitest");
const effect_1 = require("effect");
const Errors_1 = require("../Errors");
const HttpClient_1 = require("./HttpClient");
/**
 * Creates a mock HttpClient layer with a custom request handler.
 *
 * This utility allows each test to define its own response behavior without
 * duplicating the Layer creation logic. The handler function receives the
 * HTTP request and should return an Effect that yields a standard Response
 * object.
 */
const makeMockHttpClient = (handler) => effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, platform_1.HttpClient.make((request) => handler(request)
    .pipe(effect_1.Effect.map((response) => platform_1.HttpClientResponse.fromWeb(request, response)))));
(0, vitest_1.describe)("HttpClient", () => {
    (0, vitest_1.describe)("invokeJsSdkWorkflow - successful responses", () => {
        vitest_1.it.effect("should successfully dispatch CI workflow", () => effect_1.Effect.gen(function* () {
            const mockHttp = makeMockHttpClient(() => effect_1.Effect.succeed(new Response(null, { status: 204 })));
            const response = yield* (0, HttpClient_1.invokeJsSdkWorkflow)({
                workflowId: "CI.yml",
                ghToken: "test-token",
                payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
            });
            vitest_1.assert.strictEqual(response.status, 204);
            vitest_1.assert.strictEqual(response.request.method, "POST");
            vitest_1.assert.isTrue(response.request.url.includes("CI.yml"));
            vitest_1.assert.strictEqual(response.request.headers.authorization, "Bearer test-token");
        }).pipe(effect_1.Effect.provide(makeMockHttpClient(() => effect_1.Effect.succeed(new Response(null, { status: 204 }))))));
        vitest_1.it.effect("should successfully dispatch publish workflow", () => effect_1.Effect.gen(function* () {
            const mockHttp = makeMockHttpClient(() => effect_1.Effect.succeed(new Response(null, { status: 200 })));
            const response = yield* (0, HttpClient_1.invokeJsSdkWorkflow)({
                workflowId: "publish.yml",
                ghToken: "test-token",
                payload: { inputs: { tag: "latest" } }
            });
            vitest_1.assert.strictEqual(response.status, 200);
            vitest_1.assert.strictEqual(response.request.method, "POST");
            vitest_1.assert.isTrue(response.request.url.includes("publish.yml"));
        }).pipe(effect_1.Effect.provide(makeMockHttpClient(() => effect_1.Effect.succeed(new Response(null, { status: 200 }))))));
        vitest_1.it.effect("should accept 201 Created status", () => effect_1.Effect.gen(function* () {
            const response = yield* (0, HttpClient_1.invokeJsSdkWorkflow)({
                workflowId: "CI.yml",
                ghToken: "test-token",
                payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
            });
            vitest_1.assert.strictEqual(response.status, 201);
        }).pipe(effect_1.Effect.provide(makeMockHttpClient(() => effect_1.Effect.succeed(new Response(null, { status: 201 }))))));
        vitest_1.it.effect("should accept 202 Accepted status", () => effect_1.Effect.gen(function* () {
            const response = yield* (0, HttpClient_1.invokeJsSdkWorkflow)({
                workflowId: "CI.yml",
                ghToken: "test-token",
                payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
            });
            vitest_1.assert.strictEqual(response.status, 202);
        }).pipe(effect_1.Effect.provide(makeMockHttpClient(() => effect_1.Effect.succeed(new Response(null, { status: 202 }))))));
        vitest_1.it.effect("should include correct headers in request", () => effect_1.Effect.gen(function* () {
            const response = yield* (0, HttpClient_1.invokeJsSdkWorkflow)({
                workflowId: "CI.yml",
                ghToken: "secret-token",
                payload: { ref: "develop", inputs: { baseUrl: "https://api.example.com" } }
            });
            vitest_1.assert.strictEqual(response.request.headers.authorization, "Bearer secret-token");
            vitest_1.assert.strictEqual(response.request.headers.accept, "application/vnd.github+json");
            vitest_1.assert.strictEqual(response.request.headers["x-github-api-version"], "2022-11-28");
        }).pipe(effect_1.Effect.provide(makeMockHttpClient(() => effect_1.Effect.succeed(new Response(null, { status: 204 }))))));
    });
    (0, vitest_1.describe)("invokeJsSdkWorkflow - error responses", () => {
        vitest_1.it.effect("should fail on 401 Unauthorized", () => effect_1.Effect.gen(function* () {
            const mock401 = makeMockHttpClient(() => effect_1.Effect.succeed(new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 })));
            const result = yield* (0, HttpClient_1.invokeJsSdkWorkflow)({
                workflowId: "CI.yml",
                ghToken: "invalid-token",
                payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
            }).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
            if (result._tag === "Failure" && result.cause._tag === "Fail") {
                const error = result.cause.error;
                vitest_1.assert.strictEqual(error._tag, "WorkflowDispatchError");
                vitest_1.assert.strictEqual(error.status, 401);
            }
        }).pipe(effect_1.Effect.provide(makeMockHttpClient(() => effect_1.Effect.succeed(new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }))))));
        vitest_1.it.effect("should fail on 403 Forbidden", () => effect_1.Effect.gen(function* () {
            const mock403 = makeMockHttpClient(() => effect_1.Effect.succeed(new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 })));
            const result = yield* (0, HttpClient_1.invokeJsSdkWorkflow)({
                workflowId: "CI.yml",
                ghToken: "test-token",
                payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
            }).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
            if (result._tag === "Failure" && result.cause._tag === "Fail") {
                const error = result.cause.error;
                vitest_1.assert.strictEqual(error._tag, "WorkflowDispatchError");
                vitest_1.assert.strictEqual(error.status, 403);
            }
        }).pipe(effect_1.Effect.provide(makeMockHttpClient(() => effect_1.Effect.succeed(new Response(JSON.stringify({ message: "Forbidden" }), { status: 403 }))))));
        vitest_1.it.effect("should fail on 404 Not Found", () => effect_1.Effect.gen(function* () {
            const mock404 = makeMockHttpClient(() => effect_1.Effect.succeed(new Response(JSON.stringify({ message: "Not Found" }), { status: 404 })));
            const result = yield* (0, HttpClient_1.invokeJsSdkWorkflow)({
                workflowId: "non-existent.yml",
                ghToken: "test-token",
                payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
            }).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
            if (result._tag === "Failure" && result.cause._tag === "Fail") {
                const error = result.cause.error;
                vitest_1.assert.strictEqual(error._tag, "WorkflowDispatchError");
                vitest_1.assert.strictEqual(error.status, 404);
            }
        }).pipe(effect_1.Effect.provide(makeMockHttpClient(() => effect_1.Effect.succeed(new Response(JSON.stringify({ message: "Not Found" }), { status: 404 }))))));
        vitest_1.it.effect("should fail on 422 Unprocessable Entity", () => effect_1.Effect.gen(function* () {
            const mock422 = makeMockHttpClient(() => effect_1.Effect.succeed(new Response(JSON.stringify({ message: "Validation failed" }), { status: 422 })));
            const result = yield* (0, HttpClient_1.invokeJsSdkWorkflow)({
                workflowId: "CI.yml",
                ghToken: "test-token",
                payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
            }).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
            if (result._tag === "Failure" && result.cause._tag === "Fail") {
                const error = result.cause.error;
                vitest_1.assert.strictEqual(error._tag, "WorkflowDispatchError");
                vitest_1.assert.strictEqual(error.status, 422);
            }
        }).pipe(effect_1.Effect.provide(makeMockHttpClient(() => effect_1.Effect.succeed(new Response(JSON.stringify({ message: "Validation failed" }), { status: 422 }))))));
        vitest_1.it.effect("should fail on 500 Internal Server Error", () => effect_1.Effect.gen(function* () {
            const mock500 = makeMockHttpClient(() => effect_1.Effect.succeed(new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 })));
            const result = yield* (0, HttpClient_1.invokeJsSdkWorkflow)({
                workflowId: "CI.yml",
                ghToken: "test-token",
                payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
            }).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
            if (result._tag === "Failure" && result.cause._tag === "Fail") {
                const error = result.cause.error;
                vitest_1.assert.strictEqual(error._tag, "WorkflowDispatchError");
                vitest_1.assert.strictEqual(error.status, 500);
            }
        }).pipe(effect_1.Effect.provide(makeMockHttpClient(() => effect_1.Effect.succeed(new Response(JSON.stringify({ message: "Internal Server Error" }), { status: 500 }))))));
        vitest_1.it.effect("should include error message in WorkflowDispatchError", () => effect_1.Effect.gen(function* () {
            const result = yield* (0, HttpClient_1.invokeJsSdkWorkflow)({
                workflowId: "CI.yml",
                ghToken: "test-token",
                payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
            }).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
            if (result._tag === "Failure" && result.cause._tag === "Fail") {
                if (result.cause.error instanceof Errors_1.WorkflowDispatchError) {
                    vitest_1.assert.isTrue(result.cause.error.message.includes("401"));
                    vitest_1.assert.isTrue(result.cause.error.message.includes("GitHub API request failed"));
                }
            }
        }).pipe(effect_1.Effect.provide(makeMockHttpClient(() => effect_1.Effect.succeed(new Response(null, { status: 401 }))))));
    });
    (0, vitest_1.describe)("invokeJsSdkWorkflow - request construction", () => {
        vitest_1.it.effect("should construct correct URL with workflow ID", () => effect_1.Effect.gen(function* () {
            let capturedRequest;
            yield* (0, HttpClient_1.invokeJsSdkWorkflow)({
                workflowId: "custom-workflow.yml",
                ghToken: "test-token",
                payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
            });
            const response = yield* (0, HttpClient_1.invokeJsSdkWorkflow)({
                workflowId: "custom-workflow.yml",
                ghToken: "test-token",
                payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
            });
            vitest_1.assert.isTrue(response.request.url.includes("custom-workflow.yml"));
            vitest_1.assert.isTrue(response.request.url.includes("ForgeRock/ping-javascript-sdk"));
            vitest_1.assert.isTrue(response.request.url.includes("/actions/workflows/"));
            vitest_1.assert.isTrue(response.request.url.includes("/dispatches"));
        }).pipe(effect_1.Effect.provide(makeMockHttpClient(() => effect_1.Effect.succeed(new Response(null, { status: 204 }))))));
        vitest_1.it.effect("should use POST method", () => effect_1.Effect.gen(function* () {
            const response = yield* (0, HttpClient_1.invokeJsSdkWorkflow)({
                workflowId: "CI.yml",
                ghToken: "test-token",
                payload: { ref: "main", inputs: { baseUrl: "https://example.com" } }
            });
            vitest_1.assert.strictEqual(response.request.method, "POST");
        }).pipe(effect_1.Effect.provide(makeMockHttpClient(() => effect_1.Effect.succeed(new Response(null, { status: 204 }))))));
    });
});

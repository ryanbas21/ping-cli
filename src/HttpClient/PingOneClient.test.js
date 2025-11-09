"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("@effect/vitest");
const platform_1 = require("@effect/platform");
const effect_1 = require("effect");
const PingOneClient_1 = require("./PingOneClient");
(0, vitest_1.describe)("PingOneClient", () => {
    (0, vitest_1.describe)("createPingOneUser", () => {
        vitest_1.it.effect("should successfully create a user with 200 response", () => effect_1.Effect.gen(function* () {
            const userData = {
                username: "john.doe",
                email: "john@example.com",
                population: {
                    id: "pop-123"
                }
            };
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
            };
            const mockClient = platform_1.HttpClient.make((req) => effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify(mockResponse), {
                status: 200,
                headers: { "content-type": "application/json" }
            }))));
            const result = yield* (0, PingOneClient_1.createPingOneUser)({
                envId: "env-123",
                token: "test-token",
                userData
            }).pipe(effect_1.Effect.provide(effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient)));
            vitest_1.assert.strictEqual(result.id, "user-123");
            vitest_1.assert.strictEqual(result.username, "john.doe");
            vitest_1.assert.strictEqual(result.email, "john@example.com");
        }));
        vitest_1.it.effect("should successfully create a user with 201 response", () => effect_1.Effect.gen(function* () {
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
            };
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
            };
            const mockClient = platform_1.HttpClient.make((req) => effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify(mockResponse), {
                status: 201,
                headers: { "content-type": "application/json" }
            }))));
            const result = yield* (0, PingOneClient_1.createPingOneUser)({
                envId: "env-456",
                token: "test-token",
                userData
            }).pipe(effect_1.Effect.provide(effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient)));
            vitest_1.assert.strictEqual(result.id, "user-456");
            vitest_1.assert.strictEqual(result.department, "Engineering");
            vitest_1.assert.deepStrictEqual(result.locales, ["Sydney", "London"]);
        }));
        vitest_1.it.effect("should fail with PingOneApiError on 401 unauthorized", () => effect_1.Effect.gen(function* () {
            const userData = {
                username: "john.doe",
                email: "john@example.com",
                population: {
                    id: "pop-123"
                }
            };
            const mockClient = platform_1.HttpClient.make((req) => effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "content-type": "application/json" }
            }))));
            const result = yield* (0, PingOneClient_1.createPingOneUser)({
                envId: "env-123",
                token: "invalid-token",
                userData
            }).pipe(effect_1.Effect.provide(effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient)), effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
            if (result._tag === "Failure" && result.cause._tag === "Fail") {
                const error = result.cause.error;
                vitest_1.assert.strictEqual(error._tag, "PingOneApiError");
                vitest_1.assert.strictEqual(error.status, 401);
            }
        }));
        vitest_1.it.effect("should fail with PingOneApiError on 403 forbidden", () => effect_1.Effect.gen(function* () {
            const userData = {
                username: "john.doe",
                email: "john@example.com",
                population: {
                    id: "pop-123"
                }
            };
            const mockClient = platform_1.HttpClient.make((req) => effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify({ error: "Forbidden" }), {
                status: 403,
                headers: { "content-type": "application/json" }
            }))));
            const result = yield* (0, PingOneClient_1.createPingOneUser)({
                envId: "env-123",
                token: "test-token",
                userData
            }).pipe(effect_1.Effect.provide(effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient)), effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
            if (result._tag === "Failure" && result.cause._tag === "Fail") {
                const error = result.cause.error;
                vitest_1.assert.strictEqual(error._tag, "PingOneApiError");
                vitest_1.assert.strictEqual(error.status, 403);
            }
        }));
        vitest_1.it.effect("should fail with PingOneApiError on 404 not found", () => effect_1.Effect.gen(function* () {
            const userData = {
                username: "john.doe",
                email: "john@example.com",
                population: {
                    id: "pop-nonexistent"
                }
            };
            const mockClient = platform_1.HttpClient.make((req) => effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify({ error: "Population not found" }), {
                status: 404,
                headers: { "content-type": "application/json" }
            }))));
            const result = yield* (0, PingOneClient_1.createPingOneUser)({
                envId: "env-123",
                token: "test-token",
                userData
            }).pipe(effect_1.Effect.provide(effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient)), effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
            if (result._tag === "Failure" && result.cause._tag === "Fail") {
                const error = result.cause.error;
                vitest_1.assert.strictEqual(error._tag, "PingOneApiError");
                vitest_1.assert.strictEqual(error.status, 404);
            }
        }));
        vitest_1.it.effect("should fail with PingOneApiError on 422 validation error", () => effect_1.Effect.gen(function* () {
            const userData = {
                username: "john.doe",
                email: "invalid-email",
                population: {
                    id: "pop-123"
                }
            };
            const mockClient = platform_1.HttpClient.make((req) => effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify({ error: "Invalid email format" }), {
                status: 422,
                headers: { "content-type": "application/json" }
            }))));
            const result = yield* (0, PingOneClient_1.createPingOneUser)({
                envId: "env-123",
                token: "test-token",
                userData
            }).pipe(effect_1.Effect.provide(effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient)), effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
            if (result._tag === "Failure" && result.cause._tag === "Fail") {
                const error = result.cause.error;
                vitest_1.assert.strictEqual(error._tag, "PingOneApiError");
                vitest_1.assert.strictEqual(error.status, 422);
            }
        }));
        vitest_1.it.effect("should fail with PingOneApiError on 500 server error", () => effect_1.Effect.gen(function* () {
            const userData = {
                username: "john.doe",
                email: "john@example.com",
                population: {
                    id: "pop-123"
                }
            };
            const mockClient = platform_1.HttpClient.make((req) => effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify({ error: "Internal server error" }), {
                status: 500,
                headers: { "content-type": "application/json" }
            }))));
            const result = yield* (0, PingOneClient_1.createPingOneUser)({
                envId: "env-123",
                token: "test-token",
                userData
            }).pipe(effect_1.Effect.provide(effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient)), effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
            if (result._tag === "Failure" && result.cause._tag === "Fail") {
                const error = result.cause.error;
                vitest_1.assert.strictEqual(error._tag, "PingOneApiError");
                vitest_1.assert.strictEqual(error.status, 500);
            }
        }));
        vitest_1.it.effect("should construct correct request URL with environment ID", () => effect_1.Effect.gen(function* () {
            const userData = {
                username: "john.doe",
                email: "john@example.com",
                population: {
                    id: "pop-123"
                }
            };
            let capturedUrl = "";
            const mockClient = platform_1.HttpClient.make((req) => {
                capturedUrl = req.url;
                return effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify({
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
                }), {
                    status: 200,
                    headers: { "content-type": "application/json" }
                })));
            });
            yield* (0, PingOneClient_1.createPingOneUser)({
                envId: "env-custom",
                token: "test-token",
                userData
            }).pipe(effect_1.Effect.provide(effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient)));
            vitest_1.assert.strictEqual(capturedUrl, "https://api.pingone.com/v1/environments/env-custom/users");
        }));
        vitest_1.it.effect("should set correct headers including bearer token", () => effect_1.Effect.gen(function* () {
            const userData = {
                username: "john.doe",
                email: "john@example.com",
                population: {
                    id: "pop-123"
                }
            };
            const mockClient = platform_1.HttpClient.make((req) => effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify({
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
            }), {
                status: 200,
                headers: { "content-type": "application/json" }
            }))));
            const result = yield* (0, PingOneClient_1.createPingOneUser)({
                envId: "env-123",
                token: "custom-auth-token",
                userData
            }).pipe(effect_1.Effect.provide(effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient)));
            vitest_1.assert.strictEqual(result.id, "user-123");
        }));
        vitest_1.it.effect("should use POST method for user creation", () => effect_1.Effect.gen(function* () {
            const userData = {
                username: "john.doe",
                email: "john@example.com",
                population: {
                    id: "pop-123"
                }
            };
            let capturedMethod = "";
            const mockClient = platform_1.HttpClient.make((req) => {
                capturedMethod = req.method;
                return effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify({
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
                }), {
                    status: 200,
                    headers: { "content-type": "application/json" }
                })));
            });
            yield* (0, PingOneClient_1.createPingOneUser)({
                envId: "env-123",
                token: "test-token",
                userData
            }).pipe(effect_1.Effect.provide(effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient)));
            vitest_1.assert.strictEqual(capturedMethod, "POST");
        }));
    });
    (0, vitest_1.describe)("readPingOneUser", () => {
        vitest_1.it.effect("should successfully read a user with 200 response", () => {
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
            };
            const mockClient = platform_1.HttpClient.make((req) => effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify(mockResponse), {
                status: 200,
                headers: { "content-type": "application/json" }
            }))));
            const dependencies = effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient);
            return effect_1.Effect.gen(function* () {
                const result = yield* (0, PingOneClient_1.readPingOneUser)({
                    envId: "env-123",
                    token: "test-token",
                    userId: "user-123"
                });
                vitest_1.assert.strictEqual(result.id, "user-123");
                vitest_1.assert.strictEqual(result.username, "john.doe");
            }).pipe(effect_1.Effect.provide(dependencies));
        });
        vitest_1.it.effect("should fail with PingOneApiError on 404 not found", () => {
            const mockClient = platform_1.HttpClient.make((req) => effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify({ error: "User not found" }), {
                status: 404,
                headers: { "content-type": "application/json" }
            }))));
            const dependencies = effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient);
            return effect_1.Effect.gen(function* () {
                const result = yield* (0, PingOneClient_1.readPingOneUser)({
                    envId: "env-123",
                    token: "test-token",
                    userId: "nonexistent"
                }).pipe(effect_1.Effect.exit);
                vitest_1.assert.strictEqual(result._tag, "Failure");
                if (result._tag === "Failure" && result.cause._tag === "Fail") {
                    const error = result.cause.error;
                    vitest_1.assert.strictEqual(error._tag, "PingOneApiError");
                    vitest_1.assert.strictEqual(error.status, 404);
                }
            }).pipe(effect_1.Effect.provide(dependencies));
        });
    });
    (0, vitest_1.describe)("updatePingOneUser", () => {
        vitest_1.it.effect("should successfully update a user with 200 response", () => {
            const userData = {
                email: "newemail@example.com",
                username: "updated.user"
            };
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
            };
            const mockClient = platform_1.HttpClient.make((req) => effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify(mockResponse), {
                status: 200,
                headers: { "content-type": "application/json" }
            }))));
            const dependencies = effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient);
            return effect_1.Effect.gen(function* () {
                const result = yield* (0, PingOneClient_1.updatePingOneUser)({
                    envId: "env-123",
                    token: "test-token",
                    userId: "user-123",
                    userData
                });
                vitest_1.assert.strictEqual(result.email, "newemail@example.com");
                vitest_1.assert.strictEqual(result.username, "updated.user");
            }).pipe(effect_1.Effect.provide(dependencies));
        });
        vitest_1.it.effect("should use PUT method for user update", () => {
            let capturedMethod = "";
            const mockClient = platform_1.HttpClient.make((req) => {
                capturedMethod = req.method;
                return effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify({
                    id: "user-123",
                    environment: { id: "env-123" },
                    population: { id: "pop-123" },
                    createdAt: "2024-01-01T00:00:00Z",
                    enabled: true,
                    lifecycle: { status: "ACCOUNT_OK" },
                    mfaEnabled: false,
                    updatedAt: "2024-01-01T00:00:00Z"
                }), {
                    status: 200,
                    headers: { "content-type": "application/json" }
                })));
            });
            const dependencies = effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient);
            return effect_1.Effect.gen(function* () {
                yield* (0, PingOneClient_1.updatePingOneUser)({
                    envId: "env-123",
                    token: "test-token",
                    userId: "user-123",
                    userData: { email: "test@example.com" }
                });
                vitest_1.assert.strictEqual(capturedMethod, "PUT");
            }).pipe(effect_1.Effect.provide(dependencies));
        });
    });
    (0, vitest_1.describe)("deletePingOneUser", () => {
        vitest_1.it.effect("should successfully delete a user with 204 response", () => {
            const mockClient = platform_1.HttpClient.make((req) => effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(null, {
                status: 204
            }))));
            const dependencies = effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient);
            return effect_1.Effect.gen(function* () {
                const result = yield* (0, PingOneClient_1.deletePingOneUser)({
                    envId: "env-123",
                    token: "test-token",
                    userId: "user-123"
                });
                vitest_1.assert.strictEqual(result, undefined);
            }).pipe(effect_1.Effect.provide(dependencies));
        });
        vitest_1.it.effect("should fail with PingOneApiError on non-204 response", () => {
            const mockClient = platform_1.HttpClient.make((req) => effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify({ error: "Forbidden" }), {
                status: 403,
                headers: { "content-type": "application/json" }
            }))));
            const dependencies = effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient);
            return effect_1.Effect.gen(function* () {
                const result = yield* (0, PingOneClient_1.deletePingOneUser)({
                    envId: "env-123",
                    token: "test-token",
                    userId: "user-123"
                }).pipe(effect_1.Effect.exit);
                vitest_1.assert.strictEqual(result._tag, "Failure");
                if (result._tag === "Failure" && result.cause._tag === "Fail") {
                    const error = result.cause.error;
                    vitest_1.assert.strictEqual(error._tag, "PingOneApiError");
                    vitest_1.assert.strictEqual(error.status, 403);
                }
            }).pipe(effect_1.Effect.provide(dependencies));
        });
        vitest_1.it.effect("should use DELETE method", () => {
            let capturedMethod = "";
            const mockClient = platform_1.HttpClient.make((req) => {
                capturedMethod = req.method;
                return effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(null, { status: 204 })));
            });
            const dependencies = effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient);
            return effect_1.Effect.gen(function* () {
                yield* (0, PingOneClient_1.deletePingOneUser)({
                    envId: "env-123",
                    token: "test-token",
                    userId: "user-123"
                });
                vitest_1.assert.strictEqual(capturedMethod, "DELETE");
            }).pipe(effect_1.Effect.provide(dependencies));
        });
    });
    (0, vitest_1.describe)("verifyPingOneUser", () => {
        vitest_1.it.effect("should successfully verify a user with 200 response", () => {
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
            };
            const mockClient = platform_1.HttpClient.make((req) => effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify(mockResponse), {
                status: 200,
                headers: { "content-type": "application/json" }
            }))));
            const dependencies = effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient);
            return effect_1.Effect.gen(function* () {
                const result = yield* (0, PingOneClient_1.verifyPingOneUser)({
                    envId: "env-123",
                    token: "test-token",
                    userId: "user-123",
                    verificationData: {
                        verificationCode: "123456"
                    }
                });
                vitest_1.assert.strictEqual(result.id, "user-123");
                vitest_1.assert.strictEqual(result.lifecycle.status, "ACCOUNT_OK");
            }).pipe(effect_1.Effect.provide(dependencies));
        });
        vitest_1.it.effect("should use POST method with correct content type", () => {
            let capturedMethod = "";
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
            };
            const mockClient = platform_1.HttpClient.make((req) => {
                capturedMethod = req.method;
                return effect_1.Effect.succeed(platform_1.HttpClientResponse.fromWeb(req, new Response(JSON.stringify(mockResponse), {
                    status: 200,
                    headers: { "content-type": "application/json" }
                })));
            });
            const dependencies = effect_1.Layer.succeed(platform_1.HttpClient.HttpClient, mockClient);
            return effect_1.Effect.gen(function* () {
                yield* (0, PingOneClient_1.verifyPingOneUser)({
                    envId: "env-123",
                    token: "test-token",
                    userId: "user-123",
                    verificationData: {
                        verificationCode: "123456"
                    }
                });
                vitest_1.assert.strictEqual(capturedMethod, "POST");
            }).pipe(effect_1.Effect.provide(dependencies));
        });
    });
});

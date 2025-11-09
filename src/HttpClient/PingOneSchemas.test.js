"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("@effect/vitest");
const Schema = __importStar(require("effect/Schema"));
const effect_1 = require("effect");
const PingOneSchemas_1 = require("./PingOneSchemas");
(0, vitest_1.describe)("PingOneSchemas", () => {
    (0, vitest_1.describe)("PingOneUserNameSchema", () => {
        vitest_1.it.effect("should validate name with both given and family", () => effect_1.Effect.gen(function* () {
            const validName = {
                given: "John",
                family: "Doe"
            };
            const result = yield* Schema.decodeUnknown(PingOneSchemas_1.PingOneUserNameSchema)(validName);
            vitest_1.assert.deepStrictEqual(result, validName);
        }));
        vitest_1.it.effect("should validate name with only given", () => effect_1.Effect.gen(function* () {
            const validName = {
                given: "John"
            };
            const result = yield* Schema.decodeUnknown(PingOneSchemas_1.PingOneUserNameSchema)(validName);
            vitest_1.assert.deepStrictEqual(result, validName);
        }));
        vitest_1.it.effect("should validate empty name object", () => effect_1.Effect.gen(function* () {
            const emptyName = {};
            const result = yield* Schema.decodeUnknown(PingOneSchemas_1.PingOneUserNameSchema)(emptyName);
            vitest_1.assert.deepStrictEqual(result, emptyName);
        }));
    });
    (0, vitest_1.describe)("PingOnePopulationSchema", () => {
        vitest_1.it.effect("should validate population with id", () => effect_1.Effect.gen(function* () {
            const validPopulation = {
                id: "pop-123"
            };
            const result = yield* Schema.decodeUnknown(PingOneSchemas_1.PingOnePopulationSchema)(validPopulation);
            vitest_1.assert.deepStrictEqual(result, validPopulation);
        }));
        vitest_1.it.effect("should reject population without id", () => effect_1.Effect.gen(function* () {
            const invalidPopulation = {};
            const result = yield* Schema.decodeUnknown(PingOneSchemas_1.PingOnePopulationSchema)(invalidPopulation).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
        }));
    });
    (0, vitest_1.describe)("PingOneCreateUserRequest", () => {
        vitest_1.it.effect("should validate minimal user request", () => effect_1.Effect.gen(function* () {
            const minimalUser = {
                username: "john.doe",
                email: "john@example.com",
                population: {
                    id: "pop-123"
                }
            };
            const result = yield* Schema.decodeUnknown(PingOneSchemas_1.PingOneCreateUserRequest)(minimalUser);
            vitest_1.assert.deepStrictEqual(result, minimalUser);
        }));
        vitest_1.it.effect("should validate full user request with all fields", () => effect_1.Effect.gen(function* () {
            const fullUser = {
                username: "mary.smith",
                email: "mary@example.com",
                name: {
                    given: "Mary",
                    family: "Smith"
                },
                population: {
                    id: "pop-456"
                },
                department: "Engineering",
                locales: ["Sydney", "London"]
            };
            const result = yield* Schema.decodeUnknown(PingOneSchemas_1.PingOneCreateUserRequest)(fullUser);
            vitest_1.assert.deepStrictEqual(result, fullUser);
        }));
        vitest_1.it.effect("should reject user without username", () => effect_1.Effect.gen(function* () {
            const invalidUser = {
                email: "john@example.com",
                population: {
                    id: "pop-123"
                }
            };
            const result = yield* Schema.decodeUnknown(PingOneSchemas_1.PingOneCreateUserRequest)(invalidUser).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
        }));
        vitest_1.it.effect("should reject user without email", () => effect_1.Effect.gen(function* () {
            const invalidUser = {
                username: "john.doe",
                population: {
                    id: "pop-123"
                }
            };
            const result = yield* Schema.decodeUnknown(PingOneSchemas_1.PingOneCreateUserRequest)(invalidUser).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
        }));
        vitest_1.it.effect("should reject user without population", () => effect_1.Effect.gen(function* () {
            const invalidUser = {
                username: "john.doe",
                email: "john@example.com"
            };
            const result = yield* Schema.decodeUnknown(PingOneSchemas_1.PingOneCreateUserRequest)(invalidUser).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
        }));
    });
    (0, vitest_1.describe)("PingOneCreateUserResponse", () => {
        vitest_1.it.effect("should validate valid user response", () => effect_1.Effect.gen(function* () {
            const validResponse = {
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
            const result = yield* Schema.decodeUnknown(PingOneSchemas_1.PingOneCreateUserResponse)(validResponse);
            vitest_1.assert.deepStrictEqual(result, validResponse);
        }));
        vitest_1.it.effect("should validate response with optional fields", () => effect_1.Effect.gen(function* () {
            const responseWithOptionals = {
                id: "user-456",
                environment: { id: "env-456" },
                population: { id: "pop-456" },
                createdAt: "2024-01-01T00:00:00Z",
                email: "mary@example.com",
                enabled: true,
                lifecycle: { status: "ACCOUNT_OK" },
                mfaEnabled: true,
                updatedAt: "2024-01-01T00:00:00Z",
                username: "mary.smith",
                department: "Engineering",
                locales: ["Sydney", "London"]
            };
            const result = yield* Schema.decodeUnknown(PingOneSchemas_1.PingOneCreateUserResponse)(responseWithOptionals);
            vitest_1.assert.deepStrictEqual(result, responseWithOptionals);
        }));
        vitest_1.it.effect("should reject response missing required id", () => effect_1.Effect.gen(function* () {
            const invalidResponse = {
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
            const result = yield* Schema.decodeUnknown(PingOneSchemas_1.PingOneCreateUserResponse)(invalidResponse).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
        }));
    });
});

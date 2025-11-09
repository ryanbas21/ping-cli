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
const schemas_1 = require("./schemas");
(0, vitest_1.describe)("Schemas", () => {
    (0, vitest_1.describe)("PingCIWorkflow", () => {
        vitest_1.it.effect("should validate valid CI workflow payload", () => effect_1.Effect.gen(function* () {
            const validPayload = {
                ref: "main",
                inputs: {
                    baseUrl: "https://example.com"
                }
            };
            const result = yield* Schema.decodeUnknown(schemas_1.PingCIWorkflow)(validPayload);
            vitest_1.assert.deepStrictEqual(result, validPayload);
        }));
        vitest_1.it.effect("should validate CI workflow with branch ref", () => effect_1.Effect.gen(function* () {
            const payload = {
                ref: "feature/new-feature",
                inputs: {
                    baseUrl: "http://localhost:8080"
                }
            };
            const result = yield* Schema.decodeUnknown(schemas_1.PingCIWorkflow)(payload);
            vitest_1.assert.deepStrictEqual(result, payload);
        }));
        vitest_1.it.effect("should validate CI workflow with commit SHA", () => effect_1.Effect.gen(function* () {
            const payload = {
                ref: "abc123def456789",
                inputs: {
                    baseUrl: "https://api.example.com/v1"
                }
            };
            const result = yield* Schema.decodeUnknown(schemas_1.PingCIWorkflow)(payload);
            vitest_1.assert.deepStrictEqual(result, payload);
        }));
        vitest_1.it.effect("should reject CI workflow without ref", () => effect_1.Effect.gen(function* () {
            const invalidPayload = {
                inputs: {
                    baseUrl: "https://example.com"
                }
            };
            const result = yield* Schema.decodeUnknown(schemas_1.PingCIWorkflow)(invalidPayload).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
        }));
        vitest_1.it.effect("should reject CI workflow without baseUrl", () => effect_1.Effect.gen(function* () {
            const invalidPayload = {
                ref: "main",
                inputs: {}
            };
            const result = yield* Schema.decodeUnknown(schemas_1.PingCIWorkflow)(invalidPayload).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
        }));
        vitest_1.it.effect("should reject CI workflow without inputs", () => effect_1.Effect.gen(function* () {
            const invalidPayload = {
                ref: "main"
            };
            const result = yield* Schema.decodeUnknown(schemas_1.PingCIWorkflow)(invalidPayload).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
        }));
        vitest_1.it.effect("should reject CI workflow with wrong types", () => effect_1.Effect.gen(function* () {
            const invalidPayload = {
                ref: 123,
                inputs: {
                    baseUrl: true
                }
            };
            const result = yield* Schema.decodeUnknown(schemas_1.PingCIWorkflow)(invalidPayload).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
        }));
    });
    (0, vitest_1.describe)("PingPublishWorkflow", () => {
        vitest_1.it.effect("should validate empty publish workflow", () => effect_1.Effect.gen(function* () {
            const payload = {
                inputs: {}
            };
            const result = yield* Schema.decodeUnknown(schemas_1.PingPublishWorkflow)(payload);
            vitest_1.assert.deepStrictEqual(result, payload);
        }));
        vitest_1.it.effect("should validate publish workflow with ref", () => effect_1.Effect.gen(function* () {
            const payload = {
                inputs: {
                    ref: "v1.0.0"
                }
            };
            const result = yield* Schema.decodeUnknown(schemas_1.PingPublishWorkflow)(payload);
            vitest_1.assert.deepStrictEqual(result, payload);
        }));
        vitest_1.it.effect("should validate publish workflow with tag", () => effect_1.Effect.gen(function* () {
            const payload = {
                inputs: {
                    tag: "latest"
                }
            };
            const result = yield* Schema.decodeUnknown(schemas_1.PingPublishWorkflow)(payload);
            vitest_1.assert.deepStrictEqual(result, payload);
        }));
        vitest_1.it.effect("should validate publish workflow with branch", () => effect_1.Effect.gen(function* () {
            const payload = {
                inputs: {
                    branch: "main"
                }
            };
            const result = yield* Schema.decodeUnknown(schemas_1.PingPublishWorkflow)(payload);
            vitest_1.assert.deepStrictEqual(result, payload);
        }));
        vitest_1.it.effect("should validate publish workflow with prerelease", () => effect_1.Effect.gen(function* () {
            const payload = {
                inputs: {
                    prerelease: "beta.1"
                }
            };
            const result = yield* Schema.decodeUnknown(schemas_1.PingPublishWorkflow)(payload);
            vitest_1.assert.deepStrictEqual(result, payload);
        }));
        vitest_1.it.effect("should validate publish workflow with access", () => effect_1.Effect.gen(function* () {
            const payload = {
                inputs: {
                    access: "public"
                }
            };
            const result = yield* Schema.decodeUnknown(schemas_1.PingPublishWorkflow)(payload);
            vitest_1.assert.deepStrictEqual(result, payload);
        }));
        vitest_1.it.effect("should validate publish workflow with all fields", () => effect_1.Effect.gen(function* () {
            const payload = {
                inputs: {
                    ref: "v1.0.0",
                    tag: "latest",
                    branch: "main",
                    prerelease: "beta.1",
                    access: "public"
                }
            };
            const result = yield* Schema.decodeUnknown(schemas_1.PingPublishWorkflow)(payload);
            vitest_1.assert.deepStrictEqual(result, payload);
        }));
        vitest_1.it.effect("should reject publish workflow without inputs", () => effect_1.Effect.gen(function* () {
            const invalidPayload = {};
            const result = yield* Schema.decodeUnknown(schemas_1.PingPublishWorkflow)(invalidPayload).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
        }));
        vitest_1.it.effect("should reject publish workflow with wrong types", () => effect_1.Effect.gen(function* () {
            const invalidPayload = {
                inputs: {
                    ref: 123,
                    tag: true,
                    branch: [],
                    prerelease: {},
                    access: null
                }
            };
            const result = yield* Schema.decodeUnknown(schemas_1.PingPublishWorkflow)(invalidPayload).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
        }));
    });
    (0, vitest_1.describe)("GitHubDispatchSchema (Union)", () => {
        vitest_1.it.effect("should validate CI workflow variant", () => effect_1.Effect.gen(function* () {
            const ciPayload = {
                ref: "main",
                inputs: {
                    baseUrl: "https://example.com"
                }
            };
            const result = yield* Schema.decodeUnknown(schemas_1.GitHubDispatchSchema)(ciPayload);
            vitest_1.assert.deepStrictEqual(result, ciPayload);
        }));
        vitest_1.it.effect("should validate Publish workflow variant", () => effect_1.Effect.gen(function* () {
            const publishPayload = {
                inputs: {
                    tag: "latest"
                }
            };
            const result = yield* Schema.decodeUnknown(schemas_1.GitHubDispatchSchema)(publishPayload);
            vitest_1.assert.deepStrictEqual(result, publishPayload);
        }));
        vitest_1.it.effect("should validate CI workflow with full structure", () => effect_1.Effect.gen(function* () {
            const payload = {
                ref: "develop",
                inputs: {
                    baseUrl: "http://localhost:3000/api"
                }
            };
            const result = yield* Schema.decodeUnknown(schemas_1.GitHubDispatchSchema)(payload);
            vitest_1.assert.deepStrictEqual(result, payload);
        }));
        vitest_1.it.effect("should validate Publish workflow with multiple fields", () => effect_1.Effect.gen(function* () {
            const payload = {
                inputs: {
                    ref: "v2.0.0",
                    tag: "next",
                    access: "restricted"
                }
            };
            const result = yield* Schema.decodeUnknown(schemas_1.GitHubDispatchSchema)(payload);
            vitest_1.assert.deepStrictEqual(result, payload);
        }));
        vitest_1.it.effect("should reject completely invalid payloads", () => effect_1.Effect.gen(function* () {
            const invalidPayload = {
                invalid: "field"
            };
            const result = yield* Schema.decodeUnknown(schemas_1.GitHubDispatchSchema)(invalidPayload).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
        }));
        vitest_1.it.effect("should reject null values", () => effect_1.Effect.gen(function* () {
            const result = yield* Schema.decodeUnknown(schemas_1.GitHubDispatchSchema)(null).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
        }));
        vitest_1.it.effect("should reject undefined values", () => effect_1.Effect.gen(function* () {
            const result = yield* Schema.decodeUnknown(schemas_1.GitHubDispatchSchema)(undefined).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
        }));
        vitest_1.it.effect("should reject arrays", () => effect_1.Effect.gen(function* () {
            const result = yield* Schema.decodeUnknown(schemas_1.GitHubDispatchSchema)([]).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
        }));
        vitest_1.it.effect("should reject primitives", () => effect_1.Effect.gen(function* () {
            const result = yield* Schema.decodeUnknown(schemas_1.GitHubDispatchSchema)("string").pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
        }));
    });
});

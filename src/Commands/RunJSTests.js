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
exports.cli = exports.runJSTests = void 0;
const cli_1 = require("@effect/cli");
const effect_1 = require("effect");
const Console = __importStar(require("effect/Console"));
const Errors_1 = require("../Errors");
const HttpClient_js_1 = require("../HttpClient/HttpClient.js");
const baseUrl = cli_1.Args.text({ name: "tenantUrl" });
const ghToken = cli_1.Args.redacted({ name: "GH_TOKEN" });
const ref = cli_1.Args.text({ name: "ref" });
const workflowId = cli_1.Args.text({ name: "workflowId" });
exports.runJSTests = cli_1.Command.make("RunJSTests", { baseUrl, ghToken, ref, workflowId }, ({ ghToken, baseUrl, ref, workflowId }) => effect_1.Effect.gen(function* () {
    // Validate baseUrl is a valid URL
    yield* effect_1.Effect.try({
        try: () => new URL(baseUrl),
        catch: () => new Error(`Invalid tenant URL: ${baseUrl}`)
    });
    // Validate ref is not empty
    yield* effect_1.Effect.if(ref.trim().length === 0, {
        onTrue: () => effect_1.Effect.fail(new Error("Git ref cannot be empty")),
        onFalse: () => effect_1.Effect.succeed(undefined)
    });
    // Validate workflowId is not empty
    yield* effect_1.Effect.if(workflowId.trim().length === 0, {
        onTrue: () => effect_1.Effect.fail(new Error("Workflow ID cannot be empty")),
        onFalse: () => effect_1.Effect.succeed(undefined)
    });
    /**
     * If we have a GH_TOKEN environment variable, use that
     * otherwise, we should look if we passed in a `ghToken`
     * via a cli argument. If we did not, then we fail.
     */
    const token = yield* effect_1.Config.redacted("GH_TOKEN").pipe(effect_1.Config.withDefault(ghToken), effect_1.Config.map(effect_1.Redacted.value));
    return yield* effect_1.Effect.if(effect_1.Predicate.isTruthy(token), {
        onTrue: () => (0, HttpClient_js_1.invokeJsSdkWorkflow)({
            ghToken: token,
            workflowId: "CI.yml",
            payload: { inputs: { baseUrl }, ref }
        }).pipe(effect_1.Effect.flatMap((response) => Console.log(`Workflow dispatched successfully. Status: ${response.status}`)), effect_1.Effect.catchAll((error) => Console.error(`Failed to dispatch workflow: ${error}`))),
        onFalse: () => effect_1.Effect.fail(new Errors_1.NoGithubToken({
            cause: "No Github token provided. Please provide a GH_TOKEN either in your environment, or through a CLI argument."
        }))
    });
}));
exports.cli = cli_1.Command.run(exports.runJSTests, {
    name: "JS SDK Cli",
    version: "v0.0.1"
});

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
exports.RunPublish = void 0;
const cli_1 = require("@effect/cli");
const effect_1 = require("effect");
const Console = __importStar(require("effect/Console"));
const HttpClient_js_1 = require("../HttpClient/HttpClient.js");
const tag = cli_1.Args.text({ name: "dist-tag" }).pipe(cli_1.Args.optional);
const ref = cli_1.Args.text({ name: "git-ref" }).pipe(cli_1.Args.optional);
const branch = cli_1.Args.text({ name: "branch" }).pipe(cli_1.Args.optional);
const prerelease = cli_1.Args.text({ name: "prerelease" }).pipe(cli_1.Args.optional);
const access = cli_1.Args.text({ name: "npm-access" }).pipe(cli_1.Args.optional);
const ghToken = cli_1.Args.redacted({ name: "gh-token" }).pipe(cli_1.Args.optional);
exports.RunPublish = cli_1.Command.make("RunPublish", { ghToken, tag, ref, branch, prerelease, access }, ({ ghToken, tag, ref, branch, prerelease, access }) => effect_1.Effect.gen(function* () {
    const token = yield* effect_1.Effect.if(effect_1.Option.isSome(ghToken) && ghToken.pipe(effect_1.Option.getOrUndefined, effect_1.Predicate.isTruthy), {
        onTrue: () => effect_1.Effect.succeed(ghToken.pipe(effect_1.Option.getOrThrow, effect_1.Redacted.value)),
        onFalse: () => effect_1.Config.redacted("GH_TOKEN").pipe(effect_1.Config.map(effect_1.Redacted.value))
    });
    const inputs = {};
    if (effect_1.Option.isSome(ref))
        inputs.ref = ref.value;
    if (effect_1.Option.isSome(tag))
        inputs.tag = tag.value;
    if (effect_1.Option.isSome(branch))
        inputs.branch = branch.value;
    if (effect_1.Option.isSome(prerelease))
        inputs.prerelease = prerelease.value;
    if (effect_1.Option.isSome(access))
        inputs.access = access.value;
    const payload = { inputs };
    return yield* (0, HttpClient_js_1.invokeJsSdkWorkflow)({
        ghToken: token,
        workflowId: "publish.yml",
        payload
    }).pipe(effect_1.Effect.flatMap((response) => Console.log(`Workflow dispatched successfully. Status: ${response.status}`)), effect_1.Effect.catchAll((error) => Console.error(`Failed to dispatch workflow: ${error}`)));
}));

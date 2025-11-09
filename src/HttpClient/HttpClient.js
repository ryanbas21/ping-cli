"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.invokeJsSdkWorkflow = void 0;
const platform_1 = require("@effect/platform");
const HttpClient_1 = require("@effect/platform/HttpClient");
const effect_1 = require("effect");
const Errors_1 = require("../Errors");
const schemas_1 = require("./schemas");
const invokeJsSdkWorkflow = ({ workflowId, ghToken, payload }) => platform_1.HttpClientRequest.post(`https://api.github.com/repos/ForgeRock/ping-javascript-sdk/actions/workflows/${workflowId}/dispatches`)
    .pipe(platform_1.HttpClientRequest.bearerToken(ghToken), platform_1.HttpClientRequest.accept("application/vnd.github+json"), platform_1.HttpClientRequest.setHeader("X-GitHub-Api-Version", "2022-11-28"), platform_1.HttpClientRequest.schemaBodyJson(schemas_1.GitHubDispatchSchema)(payload), effect_1.Effect.flatMap((req) => HttpClient_1.HttpClient.pipe(effect_1.Effect.flatMap((client) => client.execute(req)))), effect_1.Effect.flatMap((response) => effect_1.Effect.if(response.status >= 200 && response.status < 300, {
    onTrue: () => effect_1.Effect.succeed(response),
    onFalse: () => effect_1.Effect.fail(new Errors_1.WorkflowDispatchError({
        status: response.status,
        message: `GitHub API request failed with status ${response.status}`
    }))
})));
exports.invokeJsSdkWorkflow = invokeJsSdkWorkflow;

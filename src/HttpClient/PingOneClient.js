"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPingOneUser = exports.deletePingOneUser = exports.updatePingOneUser = exports.readPingOneUser = exports.createPingOneUser = void 0;
const platform_1 = require("@effect/platform");
const HttpClient_1 = require("@effect/platform/HttpClient");
const effect_1 = require("effect");
const Errors_1 = require("../Errors");
const PingOneSchemas_1 = require("./PingOneSchemas");
/**
 * Creates a user in PingOne via API
 *
 * @param envId - PingOne environment ID
 * @param token - PingOne access token
 * @param userData - User data matching PingOneCreateUserRequest schema
 * @returns Effect that yields the created user response
 */
const createPingOneUser = ({ envId, token, userData }) => platform_1.HttpClientRequest.post(`https://api.pingone.com/v1/environments/${envId}/users`)
    .pipe(platform_1.HttpClientRequest.bearerToken(token), platform_1.HttpClientRequest.accept("application/json"), platform_1.HttpClientRequest.setHeader("Content-Type", "application/json"), platform_1.HttpClientRequest.schemaBodyJson(PingOneSchemas_1.PingOneCreateUserRequest)(userData), effect_1.Effect.flatMap((req) => HttpClient_1.HttpClient.pipe(effect_1.Effect.flatMap((client) => client.execute(req)))), effect_1.Effect.flatMap((response) => effect_1.Effect.if(response.status >= 200 && response.status < 300, {
    onTrue: () => effect_1.Effect.succeed(response),
    onFalse: () => effect_1.Effect.fail(new Errors_1.PingOneApiError({
        status: response.status,
        message: `PingOne API request failed with status ${response.status}`
    }))
})), effect_1.Effect.flatMap((response) => platform_1.HttpClientResponse.schemaBodyJson(PingOneSchemas_1.PingOneCreateUserResponse)(response)));
exports.createPingOneUser = createPingOneUser;
/**
 * Reads a user from PingOne by ID
 *
 * @param envId - PingOne environment ID
 * @param token - PingOne access token
 * @param userId - User ID to read
 * @returns Effect that yields the user data
 */
const readPingOneUser = ({ envId, token, userId }) => effect_1.Effect.gen(function* () {
    const req = platform_1.HttpClientRequest.get(`https://api.pingone.com/v1/environments/${envId}/users/${userId}?expand=population`).pipe(platform_1.HttpClientRequest.bearerToken(token), platform_1.HttpClientRequest.accept("application/json"));
    const client = yield* HttpClient_1.HttpClient;
    const response = yield* client.execute(req);
    if (response.status >= 200 && response.status < 300) {
        return yield* platform_1.HttpClientResponse.schemaBodyJson(PingOneSchemas_1.PingOneReadUserResponse)(response);
    }
    return yield* effect_1.Effect.fail(new Errors_1.PingOneApiError({
        status: response.status,
        message: `PingOne API request failed with status ${response.status}`
    }));
});
exports.readPingOneUser = readPingOneUser;
/**
 * Updates a user in PingOne via API
 *
 * @param envId - PingOne environment ID
 * @param token - PingOne access token
 * @param userId - User ID to update
 * @param userData - User data matching PingOneUpdateUserRequest schema
 * @returns Effect that yields the updated user response
 */
const updatePingOneUser = ({ envId, token, userId, userData }) => platform_1.HttpClientRequest.put(`https://api.pingone.com/v1/environments/${envId}/users/${userId}`)
    .pipe(platform_1.HttpClientRequest.bearerToken(token), platform_1.HttpClientRequest.accept("application/json"), platform_1.HttpClientRequest.setHeader("Content-Type", "application/json"), platform_1.HttpClientRequest.schemaBodyJson(PingOneSchemas_1.PingOneUpdateUserRequest)(userData), effect_1.Effect.flatMap((req) => HttpClient_1.HttpClient.pipe(effect_1.Effect.flatMap((client) => client.execute(req)))), effect_1.Effect.flatMap((response) => effect_1.Effect.if(response.status >= 200 && response.status < 300, {
    onTrue: () => effect_1.Effect.succeed(response),
    onFalse: () => effect_1.Effect.fail(new Errors_1.PingOneApiError({
        status: response.status,
        message: `PingOne API request failed with status ${response.status}`
    }))
})), effect_1.Effect.flatMap((response) => platform_1.HttpClientResponse.schemaBodyJson(PingOneSchemas_1.PingOneUpdateUserResponse)(response)));
exports.updatePingOneUser = updatePingOneUser;
/**
 * Deletes a user from PingOne
 *
 * @param envId - PingOne environment ID
 * @param token - PingOne access token
 * @param userId - User ID to delete
 * @returns Effect that yields void on success (204 No Content)
 */
const deletePingOneUser = ({ envId, token, userId }) => effect_1.Effect.gen(function* () {
    const req = platform_1.HttpClientRequest.del(`https://api.pingone.com/v1/environments/${envId}/users/${userId}`).pipe(platform_1.HttpClientRequest.bearerToken(token), platform_1.HttpClientRequest.accept("application/json"));
    const client = yield* HttpClient_1.HttpClient;
    const response = yield* client.execute(req);
    if (response.status === 204) {
        return undefined;
    }
    return yield* effect_1.Effect.fail(new Errors_1.PingOneApiError({
        status: response.status,
        message: `PingOne API request failed with status ${response.status}`
    }));
});
exports.deletePingOneUser = deletePingOneUser;
/**
 * Verifies a user account in PingOne with a verification code
 *
 * @param envId - PingOne environment ID
 * @param token - PingOne access token
 * @param userId - User ID to verify
 * @param verificationData - Verification code data
 * @returns Effect that yields the verified user response
 */
const verifyPingOneUser = ({ envId, token, userId, verificationData }) => platform_1.HttpClientRequest.post(`https://api.pingone.com/v1/environments/${envId}/users/${userId}`)
    .pipe(platform_1.HttpClientRequest.bearerToken(token), platform_1.HttpClientRequest.accept("application/json"), platform_1.HttpClientRequest.setHeader("Content-Type", "application/vnd.pingidentity.user.verify+json"), platform_1.HttpClientRequest.schemaBodyJson(PingOneSchemas_1.PingOneVerifyUserRequest)(verificationData), effect_1.Effect.flatMap((req) => HttpClient_1.HttpClient.pipe(effect_1.Effect.flatMap((client) => client.execute(req)))), effect_1.Effect.flatMap((response) => effect_1.Effect.if(response.status >= 200 && response.status < 300, {
    onTrue: () => effect_1.Effect.succeed(response),
    onFalse: () => effect_1.Effect.fail(new Errors_1.PingOneApiError({
        status: response.status,
        message: `PingOne API request failed with status ${response.status}`
    }))
})), effect_1.Effect.flatMap((response) => platform_1.HttpClientResponse.schemaBodyJson(PingOneSchemas_1.PingOneVerifyUserResponse)(response)));
exports.verifyPingOneUser = verifyPingOneUser;

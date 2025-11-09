"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getToken = exports.getEnvironmentId = void 0;
const effect_1 = require("effect");
const Errors_1 = require("../../Errors");
/**
 * Gets PingOne environment ID from CLI option or environment variable
 * Priority: CLI option > PINGONE_ENV_ID env var
 */
const getEnvironmentId = (cliOption) => effect_1.Effect.if(effect_1.Predicate.isTruthy(cliOption) && cliOption.trim().length > 0, {
    onTrue: () => effect_1.Effect.succeed(cliOption),
    onFalse: () => effect_1.Config.string("PINGONE_ENV_ID").pipe(effect_1.Effect.catchAll(() => effect_1.Effect.fail(new Errors_1.PingOneAuthError({
        cause: "No PingOne environment ID provided. Set PINGONE_ENV_ID env var or use --environment-id"
    }))))
});
exports.getEnvironmentId = getEnvironmentId;
/**
 * Gets PingOne access token from CLI option or environment variable
 * Priority: CLI option > PINGONE_TOKEN env var
 */
const getToken = (cliOption) => effect_1.Effect.gen(function* () {
    // Check if CLI option was provided
    if (cliOption._tag === "Some") {
        const tokenValue = effect_1.Redacted.value(cliOption.value);
        if (effect_1.Predicate.isTruthy(tokenValue)) {
            return tokenValue;
        }
    }
    // Fall back to environment variable
    return yield* effect_1.Config.string("PINGONE_TOKEN").pipe(effect_1.Effect.catchAll(() => effect_1.Effect.fail(new Errors_1.PingOneAuthError({
        cause: "No PingOne token provided. Set PINGONE_TOKEN env var or use --pingone-token"
    }))));
});
exports.getToken = getToken;

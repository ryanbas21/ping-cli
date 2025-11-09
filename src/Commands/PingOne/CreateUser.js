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
exports.createUser = void 0;
const cli_1 = require("@effect/cli");
const effect_1 = require("effect");
const Console = __importStar(require("effect/Console"));
const Errors_1 = require("../../Errors");
const PingOneClient_js_1 = require("../../HttpClient/PingOneClient.js");
const ConfigHelper_js_1 = require("./ConfigHelper.js");
// Required arguments
const username = cli_1.Args.text({ name: "username" });
const email = cli_1.Args.text({ name: "email" });
// Required options with environment variable fallback
const environmentId = cli_1.Options.text("environment-id").pipe(cli_1.Options.withAlias("e"));
const populationId = cli_1.Options.text("population-id").pipe(cli_1.Options.withAlias("p"));
const pingoneToken = cli_1.Options.redacted("pingone-token").pipe(cli_1.Options.withAlias("t"), cli_1.Options.optional);
// Optional user data
const givenName = cli_1.Options.text("given-name").pipe(cli_1.Options.optional);
const familyName = cli_1.Options.text("family-name").pipe(cli_1.Options.optional);
const department = cli_1.Options.text("department").pipe(cli_1.Options.optional);
const locales = cli_1.Options.text("locales").pipe(cli_1.Options.optional);
exports.createUser = cli_1.Command.make("create_user", {
    username,
    email,
    environmentId,
    populationId,
    pingoneToken,
    givenName,
    familyName,
    department,
    locales
}, ({ username, email, environmentId, populationId, pingoneToken, givenName, familyName, department, locales }) => effect_1.Effect.gen(function* () {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return yield* effect_1.Effect.fail(new Errors_1.PingOneValidationError({
            field: "email",
            message: `Invalid email format: ${email}`
        }));
    }
    // Validate username is not empty
    if (username.trim().length === 0) {
        return yield* effect_1.Effect.fail(new Errors_1.PingOneValidationError({
            field: "username",
            message: "Username cannot be empty"
        }));
    }
    // Get environment ID and token using helpers
    const envId = yield* (0, ConfigHelper_js_1.getEnvironmentId)(environmentId);
    const token = yield* (0, ConfigHelper_js_1.getToken)(pingoneToken);
    // Get population ID from config hierarchy (CLI option > env var)
    const popId = yield* effect_1.Effect.if(effect_1.Predicate.isTruthy(populationId) && populationId.trim().length > 0, {
        onTrue: () => effect_1.Effect.succeed(populationId),
        onFalse: () => effect_1.Config.string("PINGONE_POPULATION_ID").pipe(effect_1.Effect.catchAll(() => effect_1.Effect.fail(new Errors_1.PingOneAuthError({
            cause: "No PingOne population ID provided. Set PINGONE_POPULATION_ID env var or use --population-id"
        }))))
    });
    // Build user data object
    const userData = {
        username,
        email,
        population: {
            id: popId
        }
    };
    // Add optional name fields
    if (givenName._tag === "Some" || familyName._tag === "Some") {
        userData.name = {};
        if (givenName._tag === "Some") {
            ;
            userData.name.given = givenName.value;
        }
        if (familyName._tag === "Some") {
            ;
            userData.name.family = familyName.value;
        }
    }
    // Add optional department
    if (department._tag === "Some") {
        userData.department = department.value;
    }
    // Add optional locales (comma-separated string to array)
    if (locales._tag === "Some") {
        userData.locales = locales.value.split(",").map((l) => l.trim());
    }
    // Create the user
    return yield* (0, PingOneClient_js_1.createPingOneUser)({
        envId,
        token,
        userData
    }).pipe(effect_1.Effect.flatMap((user) => Console.log(`User created successfully!\nID: ${user.id}\nUsername: ${user.username}\nEmail: ${user.email}`)), effect_1.Effect.catchAll((error) => Console.error(`Failed to create user: ${error}`)));
}));

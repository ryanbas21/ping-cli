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
exports.updateUser = void 0;
const cli_1 = require("@effect/cli");
const effect_1 = require("effect");
const Console = __importStar(require("effect/Console"));
const Errors_1 = require("../../Errors");
const PingOneClient_js_1 = require("../../HttpClient/PingOneClient.js");
const ConfigHelper_js_1 = require("./ConfigHelper.js");
// Required arguments
const userId = cli_1.Args.text({ name: "userId" });
const jsonData = cli_1.Args.text({ name: "jsonData" });
// Required options with environment variable fallback
const environmentId = cli_1.Options.text("environment-id").pipe(cli_1.Options.withAlias("e"));
const pingoneToken = cli_1.Options.redacted("pingone-token").pipe(cli_1.Options.withAlias("t"), cli_1.Options.optional);
exports.updateUser = cli_1.Command.make("update_user", {
    userId,
    jsonData,
    environmentId,
    pingoneToken
}, ({ userId, jsonData, environmentId, pingoneToken }) => effect_1.Effect.gen(function* () {
    // Validate userId is not empty
    if (!effect_1.Predicate.isTruthy(userId) || userId.trim().length === 0) {
        return yield* effect_1.Effect.fail(new Errors_1.PingOneAuthError({
            cause: "User ID cannot be empty"
        }));
    }
    // Parse JSON data
    const userData = yield* effect_1.Effect.try({
        try: () => JSON.parse(jsonData),
        catch: (error) => new Errors_1.PingOneValidationError({
            field: "jsonData",
            message: `Invalid JSON format: ${error}`
        })
    });
    // Validate that at least one field is provided for update
    if (Object.keys(userData).length === 0) {
        return yield* effect_1.Effect.fail(new Errors_1.PingOneValidationError({
            field: "jsonData",
            message: "At least one field must be provided for update"
        }));
    }
    // Get environment ID and token using helpers
    const envId = yield* (0, ConfigHelper_js_1.getEnvironmentId)(environmentId);
    const token = yield* (0, ConfigHelper_js_1.getToken)(pingoneToken);
    // Update the user
    return yield* (0, PingOneClient_js_1.updatePingOneUser)({
        envId,
        token,
        userId,
        userData
    }).pipe(effect_1.Effect.flatMap((user) => Console.log(`User updated successfully!
ID: ${user.id}
Username: ${user.username ?? "N/A"}
Email: ${user.email ?? "N/A"}
Enabled: ${user.enabled}
Lifecycle Status: ${user.lifecycle.status}
Updated: ${user.updatedAt}`)), effect_1.Effect.catchAll((error) => Console.error(`Failed to update user: ${error}`)));
}));

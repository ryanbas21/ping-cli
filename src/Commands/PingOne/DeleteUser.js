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
exports.deleteUser = void 0;
const cli_1 = require("@effect/cli");
const effect_1 = require("effect");
const Console = __importStar(require("effect/Console"));
const Errors_1 = require("../../Errors");
const PingOneClient_js_1 = require("../../HttpClient/PingOneClient.js");
const ConfigHelper_js_1 = require("./ConfigHelper.js");
// Required argument
const userId = cli_1.Args.text({ name: "userId" });
// Required options with environment variable fallback
const environmentId = cli_1.Options.text("environment-id").pipe(cli_1.Options.withAlias("e"));
const pingoneToken = cli_1.Options.redacted("pingone-token").pipe(cli_1.Options.withAlias("t"), cli_1.Options.optional);
exports.deleteUser = cli_1.Command.make("delete_user", {
    userId,
    environmentId,
    pingoneToken
}, ({ userId, environmentId, pingoneToken }) => effect_1.Effect.gen(function* () {
    // Validate userId is not empty
    if (!effect_1.Predicate.isTruthy(userId) || userId.trim().length === 0) {
        return yield* effect_1.Effect.fail(new Errors_1.PingOneAuthError({
            cause: "User ID cannot be empty"
        }));
    }
    // Get environment ID and token using helpers
    const envId = yield* (0, ConfigHelper_js_1.getEnvironmentId)(environmentId);
    const token = yield* (0, ConfigHelper_js_1.getToken)(pingoneToken);
    // Delete the user
    return yield* (0, PingOneClient_js_1.deletePingOneUser)({
        envId,
        token,
        userId
    }).pipe(effect_1.Effect.flatMap(() => Console.log(`User ${userId} deleted successfully!`)), effect_1.Effect.catchAll((error) => Console.error(`Failed to delete user: ${error}`)));
}));

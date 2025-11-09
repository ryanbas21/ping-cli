"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("@effect/vitest");
const effect_1 = require("effect");
const Errors_1 = require("./Errors");
(0, vitest_1.describe)("Errors", () => {
    (0, vitest_1.describe)("NoGithubToken", () => {
        vitest_1.it.effect("should create error with cause", () => effect_1.Effect.gen(function* () {
            const error = new Errors_1.NoGithubToken({
                cause: "No Github token provided"
            });
            vitest_1.assert.strictEqual(error._tag, "NoGithubToken");
            vitest_1.assert.strictEqual(error.cause, "No Github token provided");
        }));
        vitest_1.it.effect("should be throwable as Effect", () => effect_1.Effect.gen(function* () {
            const result = yield* effect_1.Effect.fail(new Errors_1.NoGithubToken({ cause: "Token missing" })).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
            if (result._tag === "Failure" && result.cause._tag === "Fail") {
                vitest_1.assert.isTrue(result.cause.error instanceof Errors_1.NoGithubToken);
                if (result.cause.error instanceof Errors_1.NoGithubToken) {
                    vitest_1.assert.strictEqual(result.cause.error.cause, "Token missing");
                }
            }
        }));
        vitest_1.it.effect("should be catchable", () => effect_1.Effect.gen(function* () {
            const program = effect_1.Effect.fail(new Errors_1.NoGithubToken({ cause: "Missing token" })).pipe(effect_1.Effect.catchTag("NoGithubToken", (error) => effect_1.Effect.succeed(`Caught: ${error.cause}`)));
            const result = yield* program;
            vitest_1.assert.strictEqual(result, "Caught: Missing token");
        }));
    });
    (0, vitest_1.describe)("WorkflowDispatchError", () => {
        vitest_1.it.effect("should create error with status and message", () => effect_1.Effect.gen(function* () {
            const error = new Errors_1.WorkflowDispatchError({
                status: 401,
                message: "Unauthorized"
            });
            vitest_1.assert.strictEqual(error._tag, "WorkflowDispatchError");
            vitest_1.assert.strictEqual(error.status, 401);
            vitest_1.assert.strictEqual(error.message, "Unauthorized");
        }));
        vitest_1.it.effect("should support various HTTP status codes", () => effect_1.Effect.gen(function* () {
            const statusCodes = [400, 401, 403, 404, 422, 500, 502, 503];
            for (const status of statusCodes) {
                const error = new Errors_1.WorkflowDispatchError({
                    status,
                    message: `Error ${status}`
                });
                vitest_1.assert.strictEqual(error.status, status);
                vitest_1.assert.strictEqual(error.message, `Error ${status}`);
            }
        }));
        vitest_1.it.effect("should be throwable as Effect", () => effect_1.Effect.gen(function* () {
            const result = yield* effect_1.Effect.fail(new Errors_1.WorkflowDispatchError({
                status: 403,
                message: "Forbidden"
            })).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
            if (result._tag === "Failure" && result.cause._tag === "Fail") {
                vitest_1.assert.isTrue(result.cause.error instanceof Errors_1.WorkflowDispatchError);
                if (result.cause.error instanceof Errors_1.WorkflowDispatchError) {
                    vitest_1.assert.strictEqual(result.cause.error.status, 403);
                    vitest_1.assert.strictEqual(result.cause.error.message, "Forbidden");
                }
            }
        }));
        vitest_1.it.effect("should be catchable by tag", () => effect_1.Effect.gen(function* () {
            const program = effect_1.Effect.fail(new Errors_1.WorkflowDispatchError({
                status: 404,
                message: "Not Found"
            })).pipe(effect_1.Effect.catchTag("WorkflowDispatchError", (error) => effect_1.Effect.succeed(`Status: ${error.status}`)));
            const result = yield* program;
            vitest_1.assert.strictEqual(result, "Status: 404");
        }));
        vitest_1.it.effect("should preserve error details through pipe operations", () => effect_1.Effect.gen(function* () {
            const program = effect_1.Effect.fail(new Errors_1.WorkflowDispatchError({
                status: 500,
                message: "Internal Server Error"
            })).pipe(effect_1.Effect.catchTag("WorkflowDispatchError", (error) => effect_1.Effect.succeed({
                status: error.status,
                message: error.message,
                tag: error._tag
            })));
            const result = yield* program;
            vitest_1.assert.deepStrictEqual(result, {
                status: 500,
                message: "Internal Server Error",
                tag: "WorkflowDispatchError"
            });
        }));
        vitest_1.it.effect("should work with Effect.match for error handling", () => effect_1.Effect.gen(function* () {
            const program = effect_1.Effect.fail(new Errors_1.WorkflowDispatchError({
                status: 401,
                message: "GitHub API request failed with status 401"
            })).pipe(effect_1.Effect.match({
                onFailure: (error) => {
                    if (error instanceof Errors_1.WorkflowDispatchError) {
                        return `Failed with ${error.status}: ${error.message}`;
                    }
                    return "Unknown error";
                },
                onSuccess: (value) => `Success: ${value}`
            }));
            const result = yield* program;
            vitest_1.assert.strictEqual(result, "Failed with 401: GitHub API request failed with status 401");
        }));
    });
    (0, vitest_1.describe)("PingOneAuthError", () => {
        vitest_1.it.effect("should create error with cause", () => effect_1.Effect.gen(function* () {
            const error = new Errors_1.PingOneAuthError({
                cause: "No PingOne token provided"
            });
            vitest_1.assert.strictEqual(error._tag, "PingOneAuthError");
            vitest_1.assert.strictEqual(error.cause, "No PingOne token provided");
        }));
        vitest_1.it.effect("should be throwable as Effect", () => effect_1.Effect.gen(function* () {
            const result = yield* effect_1.Effect.fail(new Errors_1.PingOneAuthError({ cause: "Invalid credentials" })).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
            if (result._tag === "Failure" && result.cause._tag === "Fail") {
                const error = result.cause.error;
                vitest_1.assert.strictEqual(error._tag, "PingOneAuthError");
                vitest_1.assert.strictEqual(error.cause, "Invalid credentials");
            }
        }));
        vitest_1.it.effect("should be catchable by tag", () => effect_1.Effect.gen(function* () {
            const program = effect_1.Effect.fail(new Errors_1.PingOneAuthError({ cause: "Missing environment ID" })).pipe(effect_1.Effect.catchTag("PingOneAuthError", (error) => effect_1.Effect.succeed(`Caught: ${error.cause}`)));
            const result = yield* program;
            vitest_1.assert.strictEqual(result, "Caught: Missing environment ID");
        }));
    });
    (0, vitest_1.describe)("PingOneApiError", () => {
        vitest_1.it.effect("should create error with status and message", () => effect_1.Effect.gen(function* () {
            const error = new Errors_1.PingOneApiError({
                status: 401,
                message: "Unauthorized"
            });
            vitest_1.assert.strictEqual(error._tag, "PingOneApiError");
            vitest_1.assert.strictEqual(error.status, 401);
            vitest_1.assert.strictEqual(error.message, "Unauthorized");
        }));
        vitest_1.it.effect("should support optional error code", () => effect_1.Effect.gen(function* () {
            const error = new Errors_1.PingOneApiError({
                status: 400,
                message: "Bad Request",
                errorCode: "INVALID_VALUE"
            });
            vitest_1.assert.strictEqual(error._tag, "PingOneApiError");
            vitest_1.assert.strictEqual(error.status, 400);
            vitest_1.assert.strictEqual(error.message, "Bad Request");
            vitest_1.assert.strictEqual(error.errorCode, "INVALID_VALUE");
        }));
        vitest_1.it.effect("should support various HTTP status codes", () => effect_1.Effect.gen(function* () {
            const statusCodes = [400, 401, 403, 404, 422, 500, 502, 503];
            for (const status of statusCodes) {
                const error = new Errors_1.PingOneApiError({
                    status,
                    message: `Error ${status}`
                });
                vitest_1.assert.strictEqual(error.status, status);
                vitest_1.assert.strictEqual(error.message, `Error ${status}`);
            }
        }));
        vitest_1.it.effect("should be throwable as Effect", () => effect_1.Effect.gen(function* () {
            const result = yield* effect_1.Effect.fail(new Errors_1.PingOneApiError({
                status: 403,
                message: "Forbidden",
                errorCode: "INSUFFICIENT_PERMISSIONS"
            })).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
            if (result._tag === "Failure" && result.cause._tag === "Fail") {
                const error = result.cause.error;
                vitest_1.assert.strictEqual(error._tag, "PingOneApiError");
                vitest_1.assert.strictEqual(error.status, 403);
                vitest_1.assert.strictEqual(error.errorCode, "INSUFFICIENT_PERMISSIONS");
            }
        }));
        vitest_1.it.effect("should be catchable by tag", () => effect_1.Effect.gen(function* () {
            const program = effect_1.Effect.fail(new Errors_1.PingOneApiError({
                status: 404,
                message: "Not Found"
            })).pipe(effect_1.Effect.catchTag("PingOneApiError", (error) => effect_1.Effect.succeed(`Status: ${error.status}`)));
            const result = yield* program;
            vitest_1.assert.strictEqual(result, "Status: 404");
        }));
    });
    (0, vitest_1.describe)("PingOneValidationError", () => {
        vitest_1.it.effect("should create error with field and message", () => effect_1.Effect.gen(function* () {
            const error = new Errors_1.PingOneValidationError({
                field: "email",
                message: "Invalid email format"
            });
            vitest_1.assert.strictEqual(error._tag, "PingOneValidationError");
            vitest_1.assert.strictEqual(error.field, "email");
            vitest_1.assert.strictEqual(error.message, "Invalid email format");
        }));
        vitest_1.it.effect("should support various field validations", () => effect_1.Effect.gen(function* () {
            const validations = [
                { field: "username", message: "Username cannot be empty" },
                { field: "email", message: "Invalid email format" },
                { field: "password", message: "Password too short" },
                { field: "population", message: "Population ID required" }
            ];
            for (const validation of validations) {
                const error = new Errors_1.PingOneValidationError(validation);
                vitest_1.assert.strictEqual(error.field, validation.field);
                vitest_1.assert.strictEqual(error.message, validation.message);
            }
        }));
        vitest_1.it.effect("should be throwable as Effect", () => effect_1.Effect.gen(function* () {
            const result = yield* effect_1.Effect.fail(new Errors_1.PingOneValidationError({
                field: "username",
                message: "Username cannot be empty"
            })).pipe(effect_1.Effect.exit);
            vitest_1.assert.strictEqual(result._tag, "Failure");
            if (result._tag === "Failure" && result.cause._tag === "Fail") {
                const error = result.cause.error;
                vitest_1.assert.strictEqual(error._tag, "PingOneValidationError");
                vitest_1.assert.strictEqual(error.field, "username");
            }
        }));
        vitest_1.it.effect("should be catchable by tag", () => effect_1.Effect.gen(function* () {
            const program = effect_1.Effect.fail(new Errors_1.PingOneValidationError({
                field: "email",
                message: "Invalid email format"
            })).pipe(effect_1.Effect.catchTag("PingOneValidationError", (error) => effect_1.Effect.succeed(`Invalid ${error.field}: ${error.message}`)));
            const result = yield* program;
            vitest_1.assert.strictEqual(result, "Invalid email: Invalid email format");
        }));
    });
    (0, vitest_1.describe)("Error composition", () => {
        vitest_1.it.effect("should differentiate between different error types", () => effect_1.Effect.gen(function* () {
            const tokenError = new Errors_1.NoGithubToken({ cause: "Missing" });
            const dispatchError = new Errors_1.WorkflowDispatchError({
                status: 401,
                message: "Unauthorized"
            });
            const authError = new Errors_1.PingOneAuthError({ cause: "No token" });
            const apiError = new Errors_1.PingOneApiError({ status: 404, message: "Not Found" });
            const validationError = new Errors_1.PingOneValidationError({ field: "email", message: "Invalid" });
            vitest_1.assert.strictEqual(tokenError._tag, "NoGithubToken");
            vitest_1.assert.strictEqual(dispatchError._tag, "WorkflowDispatchError");
            vitest_1.assert.strictEqual(authError._tag, "PingOneAuthError");
            vitest_1.assert.strictEqual(apiError._tag, "PingOneApiError");
            vitest_1.assert.strictEqual(validationError._tag, "PingOneValidationError");
        }));
        vitest_1.it.effect("should support selective error handling for NoGithubToken", () => effect_1.Effect.gen(function* () {
            const program = effect_1.Effect.fail(new Errors_1.NoGithubToken({ cause: "Missing" })).pipe(effect_1.Effect.catchTag("NoGithubToken", () => effect_1.Effect.succeed("Handled NoGithubToken")));
            const result = yield* program;
            vitest_1.assert.strictEqual(result, "Handled NoGithubToken");
        }));
        vitest_1.it.effect("should support selective error handling for WorkflowDispatchError", () => effect_1.Effect.gen(function* () {
            const program = effect_1.Effect.fail(new Errors_1.WorkflowDispatchError({ status: 401, message: "Unauthorized" })).pipe(effect_1.Effect.catchTag("WorkflowDispatchError", () => effect_1.Effect.succeed("Handled WorkflowDispatchError")));
            const result = yield* program;
            vitest_1.assert.strictEqual(result, "Handled WorkflowDispatchError");
        }));
        vitest_1.it.effect("should support selective error handling for PingOne errors", () => effect_1.Effect.gen(function* () {
            const authProgram = effect_1.Effect.fail(new Errors_1.PingOneAuthError({ cause: "No token" })).pipe(effect_1.Effect.catchTag("PingOneAuthError", () => effect_1.Effect.succeed("Handled Auth")));
            const apiProgram = effect_1.Effect.fail(new Errors_1.PingOneApiError({ status: 500, message: "Server Error" })).pipe(effect_1.Effect.catchTag("PingOneApiError", () => effect_1.Effect.succeed("Handled API")));
            const validationProgram = effect_1.Effect.fail(new Errors_1.PingOneValidationError({ field: "email", message: "Invalid" })).pipe(effect_1.Effect.catchTag("PingOneValidationError", () => effect_1.Effect.succeed("Handled Validation")));
            const authResult = yield* authProgram;
            const apiResult = yield* apiProgram;
            const validationResult = yield* validationProgram;
            vitest_1.assert.strictEqual(authResult, "Handled Auth");
            vitest_1.assert.strictEqual(apiResult, "Handled API");
            vitest_1.assert.strictEqual(validationResult, "Handled Validation");
        }));
    });
});

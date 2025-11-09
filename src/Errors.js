"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PingOneValidationError = exports.PingOneApiError = exports.PingOneAuthError = exports.WorkflowDispatchError = exports.NoGithubToken = void 0;
const effect_1 = require("effect");
class NoGithubToken extends effect_1.Data.TaggedError("NoGithubToken") {
}
exports.NoGithubToken = NoGithubToken;
class WorkflowDispatchError extends effect_1.Data.TaggedError("WorkflowDispatchError") {
}
exports.WorkflowDispatchError = WorkflowDispatchError;
class PingOneAuthError extends effect_1.Data.TaggedError("PingOneAuthError") {
}
exports.PingOneAuthError = PingOneAuthError;
class PingOneApiError extends effect_1.Data.TaggedError("PingOneApiError") {
}
exports.PingOneApiError = PingOneApiError;
class PingOneValidationError extends effect_1.Data.TaggedError("PingOneValidationError") {
}
exports.PingOneValidationError = PingOneValidationError;

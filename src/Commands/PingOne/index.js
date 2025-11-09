"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.p1Command = void 0;
const cli_1 = require("@effect/cli");
const effect_1 = require("effect");
const CreateUser_js_1 = require("./CreateUser.js");
const DeleteUser_js_1 = require("./DeleteUser.js");
const ReadUser_js_1 = require("./ReadUser.js");
const UpdateUser_js_1 = require("./UpdateUser.js");
const VerifyUser_js_1 = require("./VerifyUser.js");
/**
 * PingOne subcommands
 */
const p1Subcommands = effect_1.Array.make(CreateUser_js_1.createUser, ReadUser_js_1.readUser, UpdateUser_js_1.updateUser, DeleteUser_js_1.deleteUser, VerifyUser_js_1.verifyUser);
/**
 * Parent p1 command with nested subcommands
 */
exports.p1Command = cli_1.Command.make("p1").pipe(cli_1.Command.withSubcommands(p1Subcommands));

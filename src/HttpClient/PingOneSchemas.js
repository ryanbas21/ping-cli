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
exports.PingOneVerifyUserResponse = exports.PingOneVerifyUserRequest = exports.PingOneUpdateUserResponse = exports.PingOneUpdateUserRequest = exports.PingOneAddressSchema = exports.PingOnePhotoSchema = exports.PingOneExtendedNameSchema = exports.PingOneReadUserResponse = exports.PingOneCreateUserResponse = exports.PingOneLifecycleSchema = exports.PingOneEnvironmentSchema = exports.PingOneCreateUserRequest = exports.PingOnePopulationSchema = exports.PingOneUserNameSchema = void 0;
const Schema = __importStar(require("effect/Schema"));
/**
 * Schema for user name structure in PingOne
 */
exports.PingOneUserNameSchema = Schema.Struct({
    given: Schema.optional(Schema.String),
    family: Schema.optional(Schema.String)
});
/**
 * Schema for population reference in PingOne
 */
exports.PingOnePopulationSchema = Schema.Struct({
    id: Schema.String
});
/**
 * Schema for creating a user in PingOne
 * Based on PingOne API documentation
 */
exports.PingOneCreateUserRequest = Schema.Struct({
    username: Schema.String,
    email: Schema.String,
    name: Schema.optional(exports.PingOneUserNameSchema),
    population: exports.PingOnePopulationSchema,
    department: Schema.optional(Schema.String),
    locales: Schema.optional(Schema.Array(Schema.String))
});
/**
 * Schema for environment reference in PingOne responses
 */
exports.PingOneEnvironmentSchema = Schema.Struct({
    id: Schema.String
});
/**
 * Schema for lifecycle status in PingOne responses
 */
exports.PingOneLifecycleSchema = Schema.Struct({
    status: Schema.String
});
/**
 * Schema for PingOne API response when creating a user
 */
exports.PingOneCreateUserResponse = Schema.Struct({
    id: Schema.String,
    environment: exports.PingOneEnvironmentSchema,
    population: exports.PingOnePopulationSchema,
    createdAt: Schema.String,
    email: Schema.String,
    enabled: Schema.Boolean,
    lifecycle: exports.PingOneLifecycleSchema,
    mfaEnabled: Schema.Boolean,
    name: Schema.optional(exports.PingOneUserNameSchema),
    locales: Schema.optional(Schema.Array(Schema.String)),
    updatedAt: Schema.String,
    username: Schema.String,
    department: Schema.optional(Schema.String)
});
/**
 * Schema for reading a user (same structure as create response)
 */
exports.PingOneReadUserResponse = exports.PingOneCreateUserResponse;
/**
 * Schema for extended name structure in update operations
 */
exports.PingOneExtendedNameSchema = Schema.Struct({
    formatted: Schema.optional(Schema.String),
    given: Schema.optional(Schema.String),
    middle: Schema.optional(Schema.String),
    family: Schema.optional(Schema.String),
    honorificPrefix: Schema.optional(Schema.String),
    honorificSuffix: Schema.optional(Schema.String)
});
/**
 * Schema for photo in update operations
 */
exports.PingOnePhotoSchema = Schema.Struct({
    href: Schema.String
});
/**
 * Schema for address in update operations
 */
exports.PingOneAddressSchema = Schema.Struct({
    streetAddress: Schema.optional(Schema.String),
    locality: Schema.optional(Schema.String),
    region: Schema.optional(Schema.String),
    postalCode: Schema.optional(Schema.String),
    countryCode: Schema.optional(Schema.String)
});
/**
 * Schema for updating a user in PingOne
 * Based on PingOne API documentation for PUT /users/:id
 */
exports.PingOneUpdateUserRequest = Schema.Struct({
    username: Schema.optional(Schema.String),
    name: Schema.optional(exports.PingOneExtendedNameSchema),
    nickname: Schema.optional(Schema.String),
    title: Schema.optional(Schema.String),
    preferredLanguage: Schema.optional(Schema.String),
    locale: Schema.optional(Schema.String),
    email: Schema.optional(Schema.String),
    primaryPhone: Schema.optional(Schema.String),
    mobilePhone: Schema.optional(Schema.String),
    photo: Schema.optional(exports.PingOnePhotoSchema),
    address: Schema.optional(exports.PingOneAddressSchema),
    accountId: Schema.optional(Schema.String),
    type: Schema.optional(Schema.String),
    timezone: Schema.optional(Schema.String)
});
/**
 * Schema for update user response (includes all fields from update request plus system fields)
 */
exports.PingOneUpdateUserResponse = Schema.Struct({
    id: Schema.String,
    environment: exports.PingOneEnvironmentSchema,
    population: exports.PingOnePopulationSchema,
    createdAt: Schema.String,
    email: Schema.optional(Schema.String),
    enabled: Schema.Boolean,
    lifecycle: exports.PingOneLifecycleSchema,
    mfaEnabled: Schema.Boolean,
    name: Schema.optional(exports.PingOneExtendedNameSchema),
    updatedAt: Schema.String,
    username: Schema.optional(Schema.String),
    nickname: Schema.optional(Schema.String),
    title: Schema.optional(Schema.String),
    preferredLanguage: Schema.optional(Schema.String),
    locale: Schema.optional(Schema.String),
    primaryPhone: Schema.optional(Schema.String),
    mobilePhone: Schema.optional(Schema.String),
    photo: Schema.optional(exports.PingOnePhotoSchema),
    address: Schema.optional(exports.PingOneAddressSchema),
    accountId: Schema.optional(Schema.String),
    type: Schema.optional(Schema.String),
    timezone: Schema.optional(Schema.String)
});
/**
 * Schema for verifying a user account
 */
exports.PingOneVerifyUserRequest = Schema.Struct({
    verificationCode: Schema.String
});
/**
 * Schema for verify user response (same as read user)
 */
exports.PingOneVerifyUserResponse = exports.PingOneCreateUserResponse;

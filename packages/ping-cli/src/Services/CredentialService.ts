/**
 * Credential Storage Service
 *
 * Provides secure credential storage across multiple platforms.
 * Supports keychain, encrypted file fallback, and environment variables.
 *
 * @since 0.0.3
 */
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as crypto from "node:crypto"
import * as fs from "node:fs"
import * as os from "node:os"
import * as path from "node:path"
import { CredentialStorageError } from "../Errors.js"
import { StoredCredentials } from "../HttpClient/OAuthSchemas.js"

/**
 * Credential storage service interface.
 *
 * Provides methods for storing and retrieving OAuth credentials
 * across different storage mechanisms.
 *
 * @since 0.0.3
 */
export interface CredentialService {
  /**
   * Stores OAuth credentials securely.
   *
   * Attempts storage in this order:
   * 1. System keychain (via keytar)
   * 2. Encrypted file in ~/.ping-cli/credentials.enc
   *
   * @param credentials - OAuth credentials to store
   * @returns Effect that succeeds with void or fails with CredentialStorageError
   *
   * @since 0.0.3
   */
  readonly store: (
    credentials: StoredCredentials
  ) => Effect.Effect<void, CredentialStorageError>

  /**
   * Retrieves stored OAuth credentials.
   *
   * Attempts retrieval in this order:
   * 1. Environment variables (PINGONE_CLIENT_ID, PINGONE_CLIENT_SECRET, etc.)
   * 2. System keychain (via keytar)
   * 3. Encrypted file in ~/.ping-cli/credentials.enc
   *
   * @returns Effect that succeeds with StoredCredentials or fails with CredentialStorageError
   *
   * @since 0.0.3
   */
  readonly retrieve: () => Effect.Effect<StoredCredentials, CredentialStorageError>

  /**
   * Deletes stored OAuth credentials.
   *
   * Removes credentials from:
   * - System keychain
   * - Encrypted file
   *
   * @returns Effect that succeeds with void or fails with CredentialStorageError
   *
   * @since 0.0.3
   */
  readonly delete: () => Effect.Effect<void, CredentialStorageError>
}

/**
 * Context tag for CredentialService.
 *
 * @since 0.0.3
 */
export const CredentialService = Context.GenericTag<CredentialService>(
  "@services/CredentialService"
)

/**
 * Configuration constants for credential storage.
 */
const KEYCHAIN_SERVICE = "ping-cli"
const KEYCHAIN_ACCOUNT = "oauth-credentials"
const CREDENTIAL_DIR = path.join(os.homedir(), ".ping-cli")
const CREDENTIAL_FILE = path.join(CREDENTIAL_DIR, "credentials.enc")

/**
 * Keytar type (lazy loaded).
 */
type KeytarModule = {
  setPassword: (service: string, account: string, password: string) => Promise<void>
  getPassword: (service: string, account: string) => Promise<string | null>
  deletePassword: (service: string, account: string) => Promise<boolean>
}

/**
 * Attempts to load keytar dynamically.
 *
 * Keytar is an optional dependency with native bindings.
 * Returns Effect that succeeds with keytar module or fails if unavailable.
 *
 * @returns Effect yielding keytar module or failing with CredentialStorageError
 */
const loadKeytar = (): Effect.Effect<KeytarModule, CredentialStorageError> =>
  Effect.tryPromise({
    try: () => import("keytar") as Promise<KeytarModule>,
    catch: (error) =>
      new CredentialStorageError({
        message: "Keychain not available",
        storage: "keychain",
        operation: "read",
        cause: `Keytar module failed to load: ${String(error)}`,
        fallbackAvailable: true
      })
  })

/**
 * Stores credentials in system keychain using keytar.
 *
 * @param credentials - Credentials to store
 * @returns Effect that succeeds or fails with CredentialStorageError
 */
const storeInKeychain = (
  credentials: StoredCredentials
): Effect.Effect<void, CredentialStorageError> =>
  Effect.gen(function*() {
    const keytar = yield* loadKeytar()
    const credentialsJson = JSON.stringify(credentials)

    yield* Effect.tryPromise({
      try: () => keytar.setPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT, credentialsJson),
      catch: (error) =>
        new CredentialStorageError({
          message: "Failed to store credentials in keychain",
          storage: "keychain",
          operation: "write",
          cause: String(error),
          fallbackAvailable: true
        })
    })
  })

/**
 * Retrieves credentials from system keychain using keytar.
 *
 * @returns Effect that succeeds with credentials or fails with CredentialStorageError
 */
const retrieveFromKeychain = (): Effect.Effect<
  StoredCredentials,
  CredentialStorageError
> =>
  Effect.gen(function*() {
    const keytar = yield* loadKeytar()

    const credentialsJson = yield* Effect.tryPromise({
      try: () => keytar.getPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT),
      catch: (error) =>
        new CredentialStorageError({
          message: "Failed to retrieve credentials from keychain",
          storage: "keychain",
          operation: "read",
          cause: String(error),
          fallbackAvailable: true
        })
    })

    if (!credentialsJson) {
      return yield* Effect.fail(
        new CredentialStorageError({
          message: "No credentials found in keychain",
          storage: "keychain",
          operation: "read",
          cause: "Credentials not set",
          fallbackAvailable: true
        })
      )
    }

    return JSON.parse(credentialsJson) as StoredCredentials
  })

/**
 * Deletes credentials from system keychain using keytar.
 *
 * @returns Effect that succeeds or fails with CredentialStorageError
 */
const deleteFromKeychain = (): Effect.Effect<void, CredentialStorageError> =>
  Effect.gen(function*() {
    const keytar = yield* loadKeytar()

    yield* Effect.tryPromise({
      try: () => keytar.deletePassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT),
      catch: (error) =>
        new CredentialStorageError({
          message: "Failed to delete credentials from keychain",
          storage: "keychain",
          operation: "delete",
          cause: String(error),
          fallbackAvailable: true
        })
    })
  })

/**
 * Generates an encryption key derived from machine-specific information.
 *
 * Uses hostname and home directory to create a deterministic key via scrypt KDF.
 *
 * **Security Note**: This provides obfuscation and machine-binding for the encrypted
 * file fallback, not cryptographic protection against attackers with file system access.
 * The encrypted file is primarily a convenience fallback for environments where system
 * keychain access is unavailable (e.g., minimal Linux installations without Secret Service).
 *
 * **For production environments**, use the system keychain (preferred method), which
 * provides proper OS-level credential protection:
 * - macOS: Keychain Access with encryption and access control
 * - Windows: Windows Credential Manager with DPAPI
 * - Linux: Secret Service API (GNOME Keyring, KWallet) with keyring encryption
 *
 * The encrypted file fallback is acceptable for:
 * - Development environments
 * - Minimal server installations
 * - Temporary credential storage
 *
 * @returns 32-byte encryption key derived from machine-specific data
 */
const generateEncryptionKey = (): Buffer => {
  const machineId = `${os.hostname()}-${os.homedir()}`
  return crypto.scryptSync(machineId, "ping-cli-salt", 32)
}

/**
 * Stores credentials in encrypted file.
 *
 * Encrypts credentials using AES-256-GCM with machine-specific key.
 *
 * @param credentials - Credentials to store
 * @returns Effect that succeeds or fails with CredentialStorageError
 */
const storeInEncryptedFile = (
  credentials: StoredCredentials
): Effect.Effect<void, CredentialStorageError> =>
  Effect.gen(function*() {
    yield* Effect.try({
      try: () => {
        // Ensure directory exists
        if (!fs.existsSync(CREDENTIAL_DIR)) {
          fs.mkdirSync(CREDENTIAL_DIR, { recursive: true, mode: 0o700 })
        }

        const key = generateEncryptionKey()
        const iv = crypto.randomBytes(16)
        const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)

        const credentialsJson = JSON.stringify(credentials)
        const encrypted = Buffer.concat([
          cipher.update(credentialsJson, "utf8"),
          cipher.final()
        ])

        const authTag = cipher.getAuthTag()

        // Store IV + authTag + encrypted data
        const fileContent = Buffer.concat([iv, authTag, encrypted])
        fs.writeFileSync(CREDENTIAL_FILE, fileContent, { mode: 0o600 })
      },
      catch: (error) =>
        new CredentialStorageError({
          message: "Failed to store credentials in encrypted file",
          storage: "encrypted_file",
          operation: "write",
          cause: String(error),
          fallbackAvailable: false
        })
    })
  })

/**
 * Retrieves credentials from encrypted file.
 *
 * Decrypts credentials using AES-256-GCM with machine-specific key.
 *
 * @returns Effect that succeeds with credentials or fails with CredentialStorageError
 */
const retrieveFromEncryptedFile = (): Effect.Effect<
  StoredCredentials,
  CredentialStorageError
> =>
  Effect.gen(function*() {
    if (!fs.existsSync(CREDENTIAL_FILE)) {
      return yield* Effect.fail(
        new CredentialStorageError({
          message: "No credentials file found",
          storage: "encrypted_file",
          operation: "read",
          cause: "Credentials file does not exist",
          fallbackAvailable: false
        })
      )
    }

    return yield* Effect.try({
      try: () => {
        const fileContent = fs.readFileSync(CREDENTIAL_FILE)

        // Extract IV, authTag, and encrypted data
        const iv = fileContent.subarray(0, 16)
        const authTag = fileContent.subarray(16, 32)
        const encrypted = fileContent.subarray(32)

        const key = generateEncryptionKey()
        const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv)
        decipher.setAuthTag(authTag)

        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

        return JSON.parse(decrypted.toString("utf8")) as StoredCredentials
      },
      catch: (error) =>
        new CredentialStorageError({
          message: "Failed to retrieve credentials from encrypted file",
          storage: "encrypted_file",
          operation: "read",
          cause: String(error),
          fallbackAvailable: false
        })
    })
  })

/**
 * Deletes credentials file.
 *
 * @returns Effect that succeeds or fails with CredentialStorageError
 */
const deleteEncryptedFile = (): Effect.Effect<void, CredentialStorageError> =>
  Effect.gen(function*() {
    yield* Effect.try({
      try: () => {
        if (fs.existsSync(CREDENTIAL_FILE)) {
          fs.unlinkSync(CREDENTIAL_FILE)
        }
      },
      catch: (error) =>
        new CredentialStorageError({
          message: "Failed to delete credentials file",
          storage: "encrypted_file",
          operation: "delete",
          cause: String(error),
          fallbackAvailable: false
        })
    })
  })

/**
 * Retrieves credentials from environment variables.
 *
 * Checks for:
 * - PINGONE_CLIENT_ID
 * - PINGONE_CLIENT_SECRET
 * - PINGONE_ENV_ID
 * - PINGONE_AUTH_REGION (optional, defaults to "com")
 *
 * @returns Effect that succeeds with credentials or fails with CredentialStorageError
 */
const retrieveFromEnvironment = (): Effect.Effect<
  StoredCredentials,
  CredentialStorageError
> =>
  Effect.gen(function*() {
    const clientId = process.env.PINGONE_CLIENT_ID
    const clientSecret = process.env.PINGONE_CLIENT_SECRET
    const environmentId = process.env.PINGONE_ENV_ID
    const region = process.env.PINGONE_AUTH_REGION ?? "com"

    if (!clientId || !clientSecret || !environmentId) {
      return yield* Effect.fail(
        new CredentialStorageError({
          message: "Missing required environment variables",
          storage: "environment",
          operation: "read",
          cause: "Set PINGONE_CLIENT_ID, PINGONE_CLIENT_SECRET, and PINGONE_ENV_ID environment variables",
          fallbackAvailable: true
        })
      )
    }

    return new StoredCredentials({
      clientId,
      clientSecret,
      environmentId,
      tokenEndpoint: `https://auth.pingone.${region}/${environmentId}/as/token`
    })
  })

/**
 * Live implementation of CredentialService.
 *
 * Provides secure credential storage with automatic fallback:
 * 1. Environment variables (read-only)
 * 2. System keychain (preferred for storage)
 * 3. Encrypted file (fallback)
 *
 * @since 0.0.3
 */
export const CredentialServiceLive = Layer.succeed(
  CredentialService,
  CredentialService.of({
    store: (credentials: StoredCredentials) =>
      storeInKeychain(credentials).pipe(
        Effect.catchAll(() => storeInEncryptedFile(credentials))
      ),

    retrieve: () =>
      retrieveFromEnvironment().pipe(
        Effect.catchAll(() =>
          retrieveFromKeychain().pipe(
            Effect.catchAll(() => retrieveFromEncryptedFile())
          )
        )
      ),

    delete: () =>
      Effect.all([deleteFromKeychain(), deleteEncryptedFile()], {
        concurrency: 2,
        mode: "either"
      }).pipe(Effect.map(() => undefined))
  })
)

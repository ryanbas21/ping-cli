/**
 * PingOne command module aggregating all PingOne-related CLI commands.
 *
 * @since 0.0.1
 */
import { Command } from "@effect/cli"
import { Array } from "effect"
import { applicationsCommand } from "./applications/index.js"
import { bulkDeleteUsersCommand } from "./BulkDeleteUsers.js"
import { bulkExportUsersCommand } from "./BulkExportUsers.js"
import { bulkImportUsersCommand } from "./BulkImportUsers.js"
import { createUser } from "./CreateUser.js"
import { deleteMfaDevice } from "./DeleteMfaDevice.js"
import { deleteUser } from "./DeleteUser.js"
import { disableMfa } from "./DisableMfa.js"
import { disableUser } from "./DisableUser.js"
import { enableMfa } from "./EnableMfa.js"
import { enableUser } from "./EnableUser.js"
import { groupsCommand } from "./groups/index.js"
import { listMfaDevices } from "./ListMfaDevices.js"
import { listSessions } from "./ListSessions.js"
import { listUsers } from "./ListUsers.js"
import { lockUser } from "./LockUser.js"
import { populationsCommand } from "./populations/index.js"
import { readUser } from "./ReadUser.js"
import { recoverPassword } from "./RecoverPassword.js"
import { resetPassword } from "./ResetPassword.js"
import { revokeSession } from "./RevokeSession.js"
import { setPassword } from "./SetPassword.js"
import { unlockUser } from "./UnlockUser.js"
import { updateUser } from "./UpdateUser.js"
import { verifyUser } from "./VerifyUser.js"

/**
 * PingOne subcommands
 *
 * @since 0.0.1
 */
const p1Subcommands = Array.make(
  createUser,
  readUser,
  updateUser,
  deleteUser,
  verifyUser,
  listUsers,
  enableUser,
  disableUser,
  lockUser,
  unlockUser,
  listSessions,
  revokeSession,
  enableMfa,
  disableMfa,
  listMfaDevices,
  deleteMfaDevice,
  setPassword,
  resetPassword,
  recoverPassword,
  bulkImportUsersCommand,
  bulkExportUsersCommand,
  bulkDeleteUsersCommand,
  groupsCommand,
  populationsCommand,
  applicationsCommand
)

/**
 * Parent p1 command with nested subcommands
 *
 * @since 0.0.1
 */
export const p1Command = Command.make("p1").pipe(
  Command.withSubcommands(p1Subcommands)
)

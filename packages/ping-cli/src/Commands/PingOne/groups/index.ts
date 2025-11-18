/**
 * PingOne group command exports and composition.
 *
 * @since 0.0.1
 */
import { Command } from "@effect/cli"
import { Array } from "effect"
import { addGroupMemberCommand } from "./AddGroupMember.js"
import { createGroupCommand } from "./CreateGroup.js"
import { deleteGroupCommand } from "./DeleteGroup.js"
import { listGroupMembersCommand } from "./ListGroupMembers.js"
import { listGroupsCommand } from "./ListGroups.js"
import { readGroupCommand } from "./ReadGroup.js"
import { removeGroupMemberCommand } from "./RemoveGroupMember.js"
import { updateGroupCommand } from "./UpdateGroup.js"

/**
 * Group management subcommands
 *
 * @since 0.0.1
 */
const groupSubcommands = Array.make(
  createGroupCommand,
  readGroupCommand,
  listGroupsCommand,
  updateGroupCommand,
  deleteGroupCommand,
  addGroupMemberCommand,
  removeGroupMemberCommand,
  listGroupMembersCommand
)

/**
 * Parent groups command with nested subcommands
 *
 * @since 0.0.1
 */
export const groupsCommand = Command.make("groups").pipe(
  Command.withSubcommands(groupSubcommands)
)

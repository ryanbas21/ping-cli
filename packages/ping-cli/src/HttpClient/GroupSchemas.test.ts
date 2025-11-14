import { assert, describe, it } from "@effect/vitest"
import { Effect } from "effect"
import * as Schema from "effect/Schema"
import {
  GroupMemberSchema,
  PingOneCreateGroupResponse,
  PingOneListGroupMembersResponse,
  PingOneListGroupsResponse
} from "./GroupSchemas.js"

describe("GroupSchemas", () => {
  describe("PingOneCreateGroupResponse", () => {
    it.effect("should validate minimal group", () =>
      Effect.gen(function*() {
        const minimalGroup = {
          id: "group-123",
          name: "Test Group",
          environment: {
            id: "env-123"
          }
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateGroupResponse)(minimalGroup)

        assert.strictEqual(result.id, "group-123")
        assert.strictEqual(result.name, "Test Group")
        assert.strictEqual(result.environment.id, "env-123")
      }))

    it.effect("should validate group with description", () =>
      Effect.gen(function*() {
        const groupWithDescription = {
          id: "group-456",
          name: "Admin Group",
          description: "Administrators access group",
          environment: {
            id: "env-456"
          }
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateGroupResponse)(groupWithDescription)

        assert.strictEqual(result.description, "Administrators access group")
      }))

    it.effect("should validate group with population", () =>
      Effect.gen(function*() {
        const groupWithPopulation = {
          id: "group-789",
          name: "Users Group",
          environment: {
            id: "env-789"
          },
          population: {
            id: "pop-123"
          }
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateGroupResponse)(groupWithPopulation)

        assert.deepStrictEqual(result.population, { id: "pop-123" })
      }))

    it.effect("should validate group with userFilter", () =>
      Effect.gen(function*() {
        const groupWithFilter = {
          id: "group-filter",
          name: "Filtered Group",
          environment: {
            id: "env-filter"
          },
          userFilter: "email co \"@example.com\""
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateGroupResponse)(groupWithFilter)

        assert.strictEqual(result.userFilter, "email co \"@example.com\"")
      }))

    it.effect("should validate group with externalId", () =>
      Effect.gen(function*() {
        const groupWithExternalId = {
          id: "group-ext",
          name: "External Group",
          environment: {
            id: "env-ext"
          },
          externalId: "ext-group-123"
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateGroupResponse)(groupWithExternalId)

        assert.strictEqual(result.externalId, "ext-group-123")
      }))

    it.effect("should validate group with custom field", () =>
      Effect.gen(function*() {
        const groupWithCustom = {
          id: "group-custom",
          name: "Custom Group",
          environment: {
            id: "env-custom"
          },
          custom: true
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateGroupResponse)(groupWithCustom)

        assert.strictEqual(result.custom, true)
      }))

    it.effect("should validate group without custom field (Canada region)", () =>
      Effect.gen(function*() {
        const groupWithoutCustom = {
          id: "group-nocustom",
          name: "No Custom Field",
          environment: {
            id: "env-nocustom"
          }
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateGroupResponse)(groupWithoutCustom)

        assert.strictEqual(result.custom, undefined)
      }))

    it.effect("should validate group with createdAt and updatedAt", () =>
      Effect.gen(function*() {
        const groupWithDates = {
          id: "group-dates",
          name: "Group With Dates",
          environment: {
            id: "env-dates"
          },
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z"
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateGroupResponse)(groupWithDates)

        assert.strictEqual(result.createdAt, "2024-01-01T00:00:00Z")
        assert.strictEqual(result.updatedAt, "2024-01-02T00:00:00Z")
      }))

    it.effect("should validate group with totalMemberCounts", () =>
      Effect.gen(function*() {
        const groupWithCounts = {
          id: "group-counts",
          name: "Group With Counts",
          environment: {
            id: "env-counts"
          },
          totalMemberCounts: {
            directMembers: 10,
            totalMembers: 15
          }
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateGroupResponse)(groupWithCounts)

        assert.deepStrictEqual(result.totalMemberCounts, {
          directMembers: 10,
          totalMembers: 15
        })
      }))

    it.effect("should validate group with _links", () =>
      Effect.gen(function*() {
        const groupWithLinks = {
          id: "group-links",
          name: "Group With Links",
          environment: {
            id: "env-links"
          },
          _links: {
            self: { href: "https://api.pingone.ca/v1/environments/env-links/groups/group-links" }
          }
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateGroupResponse)(groupWithLinks)

        assert.isDefined(result._links)
        if (result._links) {
          const self = result._links.self as { href: string } | undefined
          assert.strictEqual(
            self?.href,
            "https://api.pingone.ca/v1/environments/env-links/groups/group-links"
          )
        }
      }))

    it.effect("should validate full group with all optional fields", () =>
      Effect.gen(function*() {
        const fullGroup = {
          id: "group-full",
          name: "Full Group",
          description: "Complete group data",
          environment: {
            id: "env-full"
          },
          population: {
            id: "pop-full"
          },
          userFilter: "active eq true",
          externalId: "ext-full",
          custom: false,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
          totalMemberCounts: {
            directMembers: 20,
            totalMembers: 25
          },
          _links: {
            self: { href: "https://api.pingone.ca/v1/environments/env-full/groups/group-full" }
          }
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateGroupResponse)(fullGroup)

        assert.strictEqual(result.id, "group-full")
        assert.strictEqual(result.name, "Full Group")
        assert.strictEqual(result.description, "Complete group data")
        assert.strictEqual(result.custom, false)
        assert.deepStrictEqual(result.totalMemberCounts, { directMembers: 20, totalMembers: 25 })
      }))

    it.effect("should fail validation when id is missing", () =>
      Effect.gen(function*() {
        const invalidGroup = {
          name: "No ID Group",
          environment: {
            id: "env-123"
          }
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateGroupResponse)(invalidGroup).pipe(
          Effect.exit
        )

        assert.strictEqual(result._tag, "Failure")
      }))

    it.effect("should fail validation when name is missing", () =>
      Effect.gen(function*() {
        const invalidGroup = {
          id: "group-123",
          environment: {
            id: "env-123"
          }
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateGroupResponse)(invalidGroup).pipe(
          Effect.exit
        )

        assert.strictEqual(result._tag, "Failure")
      }))

    it.effect("should fail validation when environment is missing", () =>
      Effect.gen(function*() {
        const invalidGroup = {
          id: "group-123",
          name: "No Environment"
        }

        const result = yield* Schema.decodeUnknown(PingOneCreateGroupResponse)(invalidGroup).pipe(
          Effect.exit
        )

        assert.strictEqual(result._tag, "Failure")
      }))
  })

  describe("PingOneListGroupsResponse", () => {
    it.effect("should validate groups list response", () =>
      Effect.gen(function*() {
        const listResponse = {
          _embedded: {
            groups: [
              {
                id: "group-1",
                name: "Group 1",
                environment: {
                  id: "env-1"
                }
              },
              {
                id: "group-2",
                name: "Group 2",
                description: "Second group",
                environment: {
                  id: "env-1"
                },
                custom: true
              }
            ]
          }
        }

        const result = yield* Schema.decodeUnknown(PingOneListGroupsResponse)(listResponse)

        assert.strictEqual(result._embedded.groups.length, 2)
        assert.strictEqual(result._embedded.groups[0].id, "group-1")
        assert.strictEqual(result._embedded.groups[1].custom, true)
      }))

    it.effect("should validate groups list with pagination", () =>
      Effect.gen(function*() {
        const paginatedResponse = {
          _embedded: {
            groups: [
              {
                id: "group-1",
                name: "Group 1",
                environment: {
                  id: "env-1"
                }
              }
            ]
          },
          _links: {
            self: { href: "https://api.pingone.ca/v1/environments/env-1/groups" },
            next: { href: "https://api.pingone.ca/v1/environments/env-1/groups?cursor=abc" }
          },
          count: 10,
          size: 1
        }

        const result = yield* Schema.decodeUnknown(PingOneListGroupsResponse)(paginatedResponse)

        assert.strictEqual(result.count, 10)
        assert.strictEqual(result.size, 1)
        assert.strictEqual(result._links?.self?.href, "https://api.pingone.ca/v1/environments/env-1/groups")
        assert.strictEqual(
          result._links?.next?.href,
          "https://api.pingone.ca/v1/environments/env-1/groups?cursor=abc"
        )
      }))

    it.effect("should validate empty groups list", () =>
      Effect.gen(function*() {
        const emptyResponse = {
          _embedded: {
            groups: []
          }
        }

        const result = yield* Schema.decodeUnknown(PingOneListGroupsResponse)(emptyResponse)

        assert.strictEqual(result._embedded.groups.length, 0)
      }))
  })

  describe("GroupMemberSchema", () => {
    it.effect("should validate minimal group member", () =>
      Effect.gen(function*() {
        const minimalMember = {
          id: "user-123"
        }

        const result = yield* Schema.decodeUnknown(GroupMemberSchema)(minimalMember)

        assert.strictEqual(result.id, "user-123")
      }))

    it.effect("should validate group member with links", () =>
      Effect.gen(function*() {
        const memberWithLinks = {
          id: "user-456",
          _links: {
            self: { href: "https://api.pingone.ca/v1/environments/env-1/users/user-456" }
          }
        }

        const result = yield* Schema.decodeUnknown(GroupMemberSchema)(memberWithLinks)

        assert.strictEqual(result.id, "user-456")
        assert.strictEqual(
          result._links?.self?.href,
          "https://api.pingone.ca/v1/environments/env-1/users/user-456"
        )
      }))
  })

  describe("PingOneListGroupMembersResponse", () => {
    it.effect("should validate group members list", () =>
      Effect.gen(function*() {
        const membersResponse = {
          _embedded: {
            users: [
              { id: "user-1" },
              { id: "user-2" },
              { id: "user-3" }
            ]
          }
        }

        const result = yield* Schema.decodeUnknown(PingOneListGroupMembersResponse)(membersResponse)

        assert.strictEqual(result._embedded.users.length, 3)
        assert.strictEqual(result._embedded.users[0].id, "user-1")
      }))

    it.effect("should validate group members with pagination", () =>
      Effect.gen(function*() {
        const paginatedMembers = {
          _embedded: {
            users: [
              { id: "user-1" }
            ]
          },
          _links: {
            self: { href: "https://api.pingone.ca/v1/environments/env-1/groups/group-1/users" },
            next: { href: "https://api.pingone.ca/v1/environments/env-1/groups/group-1/users?cursor=xyz" }
          },
          count: 50,
          size: 1
        }

        const result = yield* Schema.decodeUnknown(PingOneListGroupMembersResponse)(paginatedMembers)

        assert.strictEqual(result.count, 50)
        assert.strictEqual(result.size, 1)
      }))

    it.effect("should validate empty members list", () =>
      Effect.gen(function*() {
        const emptyMembers = {
          _embedded: {
            users: []
          }
        }

        const result = yield* Schema.decodeUnknown(PingOneListGroupMembersResponse)(emptyMembers)

        assert.strictEqual(result._embedded.users.length, 0)
      }))
  })
})

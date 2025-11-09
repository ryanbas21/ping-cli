import { HttpClient, HttpClientResponse } from "@effect/platform"
import { assert, describe, it } from "@effect/vitest"
import { Effect, Layer } from "effect"
import type { PingOneApiError } from "../Errors.js"
import { MockServicesLive } from "../test-helpers/TestLayers.js"
import {
  addGroupMember,
  createGroup,
  deleteGroup,
  listGroupMembers,
  listGroups,
  readGroup,
  removeGroupMember,
  updateGroup
} from "./GroupClient.js"

describe("GroupClient", () => {
  describe("createGroup", () => {
    it.effect("should successfully create a group with 201 response", () =>
      Effect.gen(function*() {
        const groupData = {
          name: "Engineering Team",
          description: "All engineers",
          population: { id: "pop-123" }
        }

        const mockResponse = {
          id: "group-123",
          name: "Engineering Team",
          description: "All engineers",
          environment: { id: "env-123" },
          population: { id: "pop-123" },
          custom: false,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z"
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify(mockResponse), {
                status: 201,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const testLayer = Layer.mergeAll(
          Layer.succeed(HttpClient.HttpClient, mockClient),
          MockServicesLive
        )

        const result = yield* createGroup({
          envId: "env-123",
          token: "test-token",
          groupData
        }).pipe(Effect.provide(testLayer))

        assert.strictEqual(result.id, "group-123")
        assert.strictEqual(result.name, "Engineering Team")
        assert.strictEqual(result.description, "All engineers")
      }))

    it.effect("should fail with PingOneApiError on 403 forbidden", () =>
      Effect.gen(function*() {
        const groupData = {
          name: "Test Group"
        }

        const mockClient = HttpClient.make((req) =>
          Effect.succeed(
            HttpClientResponse.fromWeb(
              req,
              new Response(JSON.stringify({ error: "Forbidden" }), {
                status: 403,
                headers: { "content-type": "application/json" }
              })
            )
          )
        )

        const testLayer = Layer.mergeAll(
          Layer.succeed(HttpClient.HttpClient, mockClient),
          MockServicesLive
        )

        const result = yield* createGroup({
          envId: "env-123",
          token: "invalid-token",
          groupData
        }).pipe(Effect.provide(testLayer), Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 403)
        }
      }))
  })

  describe("readGroup", () => {
    it.effect("should successfully read a group", () => {
      const mockResponse = {
        id: "group-123",
        name: "Engineering Team",
        description: "All engineers",
        environment: { id: "env-123" },
        custom: false,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z"
      }

      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(JSON.stringify(mockResponse), {
              status: 200,
              headers: { "content-type": "application/json" }
            })
          )
        )
      )

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* readGroup({
          envId: "env-123",
          token: "test-token",
          groupId: "group-123"
        })

        assert.strictEqual(result.id, "group-123")
        assert.strictEqual(result.name, "Engineering Team")
      }).pipe(Effect.provide(dependencies))
    })

    it.effect("should fail with PingOneApiError on 404 not found", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(JSON.stringify({ error: "Group not found" }), {
              status: 404,
              headers: { "content-type": "application/json" }
            })
          )
        )
      )

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* readGroup({
          envId: "env-123",
          token: "test-token",
          groupId: "nonexistent"
        }).pipe(Effect.exit)

        assert.strictEqual(result._tag, "Failure")
        if (result._tag === "Failure" && result.cause._tag === "Fail") {
          const error = result.cause.error as PingOneApiError
          assert.strictEqual(error._tag, "PingOneApiError")
          assert.strictEqual(error.status, 404)
        }
      }).pipe(Effect.provide(dependencies))
    })
  })

  describe("listGroups", () => {
    it.effect("should successfully list groups", () => {
      const mockResponse = {
        _embedded: {
          groups: [
            {
              id: "group-1",
              name: "Group 1",
              environment: { id: "env-123" },
              custom: false,
              createdAt: "2024-01-01T00:00:00Z",
              updatedAt: "2024-01-01T00:00:00Z"
            },
            {
              id: "group-2",
              name: "Group 2",
              environment: { id: "env-123" },
              custom: false,
              createdAt: "2024-01-02T00:00:00Z",
              updatedAt: "2024-01-02T00:00:00Z"
            }
          ]
        },
        count: 2
      }

      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(JSON.stringify(mockResponse), {
              status: 200,
              headers: { "content-type": "application/json" }
            })
          )
        )
      )

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* listGroups({
          envId: "env-123",
          token: "test-token",
          limit: 10
        })

        assert.strictEqual(result._embedded.groups.length, 2)
        assert.strictEqual(result._embedded.groups[0].name, "Group 1")
      }).pipe(Effect.provide(dependencies))
    })
  })

  describe("updateGroup", () => {
    it.effect("should successfully update a group", () => {
      const mockResponse = {
        id: "group-123",
        name: "Updated Group Name",
        description: "Updated description",
        environment: { id: "env-123" },
        custom: false,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-02T00:00:00Z"
      }

      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(JSON.stringify(mockResponse), {
              status: 200,
              headers: { "content-type": "application/json" }
            })
          )
        )
      )

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* updateGroup({
          envId: "env-123",
          token: "test-token",
          groupId: "group-123",
          groupData: {
            name: "Updated Group Name",
            description: "Updated description"
          }
        })

        assert.strictEqual(result.name, "Updated Group Name")
        assert.strictEqual(result.description, "Updated description")
      }).pipe(Effect.provide(dependencies))
    })
  })

  describe("deleteGroup", () => {
    it.effect("should successfully delete a group with 204 response", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(HttpClientResponse.fromWeb(req, new Response(null, { status: 204 })))
      )

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* deleteGroup({
          envId: "env-123",
          token: "test-token",
          groupId: "group-123"
        })

        assert.strictEqual(result, undefined)
      }).pipe(Effect.provide(dependencies))
    })
  })

  describe("addGroupMember", () => {
    it.effect("should successfully add a member to a group", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(HttpClientResponse.fromWeb(req, new Response(null, { status: 201 })))
      )

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* addGroupMember({
          envId: "env-123",
          token: "test-token",
          groupId: "group-123",
          userId: "user-456"
        })

        assert.strictEqual(result, undefined)
      }).pipe(Effect.provide(dependencies))
    })
  })

  describe("removeGroupMember", () => {
    it.effect("should successfully remove a member from a group", () => {
      const mockClient = HttpClient.make((req) =>
        Effect.succeed(HttpClientResponse.fromWeb(req, new Response(null, { status: 204 })))
      )

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* removeGroupMember({
          envId: "env-123",
          token: "test-token",
          groupId: "group-123",
          userId: "user-456"
        })

        assert.strictEqual(result, undefined)
      }).pipe(Effect.provide(dependencies))
    })
  })

  describe("listGroupMembers", () => {
    it.effect("should successfully list group members", () => {
      const mockResponse = {
        _embedded: {
          users: [
            { id: "user-1" },
            { id: "user-2" },
            { id: "user-3" }
          ]
        },
        count: 3
      }

      const mockClient = HttpClient.make((req) =>
        Effect.succeed(
          HttpClientResponse.fromWeb(
            req,
            new Response(JSON.stringify(mockResponse), {
              status: 200,
              headers: { "content-type": "application/json" }
            })
          )
        )
      )

      const dependencies = Layer.mergeAll(
        Layer.succeed(HttpClient.HttpClient, mockClient),
        MockServicesLive
      )

      return Effect.gen(function*() {
        const result = yield* listGroupMembers({
          envId: "env-123",
          token: "test-token",
          groupId: "group-123",
          limit: 50
        })

        assert.strictEqual(result._embedded.users.length, 3)
        assert.strictEqual(result._embedded.users[0].id, "user-1")
      }).pipe(Effect.provide(dependencies))
    })
  })
})

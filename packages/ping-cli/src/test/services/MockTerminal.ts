import type * as Terminal from "@effect/platform/Terminal"
import * as Array from "effect/Array"
import * as Console from "effect/Console"
import * as Context from "effect/Context"
import * as Effect from "effect/Effect"
import * as Layer from "effect/Layer"
import * as Mailbox from "effect/Mailbox"
import * as Option from "effect/Option"

/**
 * Mock Terminal for testing interactive prompts in Effect applications.
 *
 * Provides programmatic input simulation for testing Prompt.text() and Prompt.password()
 * without requiring actual user interaction. Supports both text input and special key sequences.
 *
 * @example
 * ```ts
 * import { Effect, Layer } from "effect"
 * import { Prompt } from "@effect/cli"
 * import * as MockTerminal from "./test/services/MockTerminal.js"
 *
 * // Test interactive prompt with simulated user input
 * const program = Effect.gen(function*() {
 *   // Simulate typing "test-value" and pressing Enter
 *   yield* MockTerminal.inputText("test-value")
 *   yield* MockTerminal.inputKey("return")
 *
 *   // Prompt will receive the simulated input
 *   const result = yield* Prompt.text({
 *     message: "Enter value:"
 *   }).pipe(Prompt.run)
 *
 *   return result // "test-value"
 * }).pipe(Effect.provide(MockTerminal.layer))
 * ```
 *
 * @example
 * ```ts
 * import { Effect } from "effect"
 * import { Prompt } from "@effect/cli"
 * import * as MockTerminal from "./test/services/MockTerminal.js"
 *
 * // Test Ctrl+C cancellation behavior
 * const program = Effect.gen(function*() {
 *   // Simulate Ctrl+C key press
 *   yield* MockTerminal.inputKey("c", { ctrl: true })
 *
 *   // Prompt will be interrupted with QuitException
 *   const result = yield* Prompt.text({
 *     message: "Enter value:"
 *   }).pipe(Prompt.run)
 * }).pipe(Effect.provide(MockTerminal.layer))
 * ```
 *
 * @since 0.0.3
 */
export interface MockTerminal extends Terminal.Terminal {
  /**
   * Simulates typing text character by character.
   *
   * Each character in the string is converted to a separate key input event.
   * Use this for simulating user typing text into prompts.
   *
   * @param text - The text to input as individual key presses
   * @returns An Effect that completes when all characters are queued
   *
   * @example
   * ```ts
   * import { Effect } from "effect"
   * import * as MockTerminal from "./test/services/MockTerminal.js"
   *
   * const simulateInput = Effect.gen(function*() {
   *   yield* MockTerminal.inputText("hello")
   *   yield* MockTerminal.inputKey("return")
   * })
   * ```
   *
   * @since 0.0.3
   */
  readonly inputText: (text: string) => Effect.Effect<void>

  /**
   * Simulates pressing a specific key with optional modifiers.
   *
   * Use this for special keys (Enter, Escape, etc.) or key combinations (Ctrl+C).
   * Supports ctrl, meta, and shift modifiers.
   *
   * @param key - The key name (e.g., "return", "escape", "c", "d")
   * @param modifiers - Optional key modifiers (ctrl, meta, shift)
   * @returns An Effect that completes when the key press is queued
   *
   * @example
   * ```ts
   * import { Effect } from "effect"
   * import * as MockTerminal from "./test/services/MockTerminal.js"
   *
   * const simulateKeyPress = Effect.gen(function*() {
   *   // Press Enter key
   *   yield* MockTerminal.inputKey("return")
   *
   *   // Press Ctrl+C (triggers cancellation)
   *   yield* MockTerminal.inputKey("c", { ctrl: true })
   *
   *   // Press Ctrl+D (also triggers cancellation)
   *   yield* MockTerminal.inputKey("d", { ctrl: true })
   * })
   * ```
   *
   * @since 0.0.3
   */
  readonly inputKey: (
    key: string,
    modifiers?: Partial<MockTerminal.Modifiers>
  ) => Effect.Effect<void>
}

export declare namespace MockTerminal {
  /**
   * Key modifier flags for simulating key combinations.
   *
   * @since 0.0.3
   */
  export interface Modifiers {
    /**
     * Control key modifier (Ctrl on Windows/Linux, Control on Mac)
     * @since 0.0.3
     */
    readonly ctrl: boolean

    /**
     * Meta key modifier (Command key on Mac, Windows key on Windows)
     * @since 0.0.3
     */
    readonly meta: boolean

    /**
     * Shift key modifier
     * @since 0.0.3
     */
    readonly shift: boolean
  }
}

/**
 * Context tag for MockTerminal service.
 *
 * Implements the Terminal.Terminal interface for testing purposes.
 *
 * @since 0.0.3
 */
export const MockTerminal = Context.GenericTag<Terminal.Terminal, MockTerminal>(
  "@effect/platform/Terminal"
)

/**
 * Creates a MockTerminal instance with input simulation capabilities.
 *
 * Sets up a mailbox queue for user input events and provides methods
 * to programmatically simulate text input and key presses.
 *
 * @returns An Effect that provides a MockTerminal instance
 *
 * @example
 * ```ts
 * import { Effect, Layer } from "effect"
 * import * as MockTerminal from "./test/services/MockTerminal.js"
 *
 * const program = Effect.gen(function*() {
 *   const terminal = yield* MockTerminal.make
 *   yield* terminal.inputText("test-input")
 *   yield* terminal.inputKey("return")
 * }).pipe(Effect.scoped)
 * ```
 *
 * @since 0.0.3
 */
export const make = Effect.gen(function*() {
  const queue = yield* Effect.acquireRelease(
    Mailbox.make<Terminal.UserInput>(),
    (_) => _.shutdown
  )

  const inputText: MockTerminal["inputText"] = (text: string) => {
    const inputs = Array.map(text.split(""), (key) => toUserInput(key))
    return queue.offerAll(inputs).pipe(Effect.asVoid)
  }

  const inputKey: MockTerminal["inputKey"] = (
    key: string,
    modifiers?: Partial<MockTerminal.Modifiers>
  ) => {
    const input = toUserInput(key, modifiers)
    return shouldQuit(input) ? queue.end : queue.offer(input).pipe(Effect.asVoid)
  }

  const display: MockTerminal["display"] = (input) => Console.log(input)

  const readInput: MockTerminal["readInput"] = Effect.succeed(queue)

  return MockTerminal.of({
    columns: Effect.succeed(80),
    display,
    readInput,
    readLine: Effect.succeed(""),
    inputKey,
    inputText
  })
})

/**
 * MockTerminal Layer for dependency injection.
 *
 * Use this layer to provide MockTerminal to your test programs.
 * Automatically manages resource lifecycle (mailbox creation/cleanup).
 *
 * @example
 * ```ts
 * import { Effect, Layer } from "effect"
 * import { Prompt } from "@effect/cli"
 * import * as MockTerminal from "./test/services/MockTerminal.js"
 *
 * const testLayer = Layer.mergeAll(
 *   MockTerminal.layer,
 *   // ... other test layers
 * )
 *
 * const program = Effect.gen(function*() {
 *   yield* MockTerminal.inputText("user-input")
 *   yield* MockTerminal.inputKey("return")
 *
 *   const result = yield* Prompt.text({
 *     message: "Enter value:"
 *   }).pipe(Prompt.run)
 *
 *   return result
 * }).pipe(Effect.provide(testLayer))
 * ```
 *
 * @since 0.0.3
 */
export const layer = Layer.scoped(MockTerminal, make)

/**
 * Service constant accessors for MockTerminal.
 *
 * @since 0.0.3
 */
export const { columns, readInput, readLine } = Effect.serviceConstants(MockTerminal)

/**
 * Service function accessors for MockTerminal input simulation.
 *
 * @since 0.0.3
 */
export const { inputKey, inputText } = Effect.serviceFunctions(MockTerminal)

/**
 * Checks if terminal input should trigger quit/cancellation.
 *
 * Ctrl+C and Ctrl+D both trigger quit behavior, which causes
 * prompts to throw QuitException from @effect/platform/Terminal.
 *
 * @param input - The terminal user input to check
 * @returns true if the input should trigger quit
 *
 * @internal
 * @since 0.0.3
 */
const shouldQuit = (input: Terminal.UserInput): boolean =>
  input.key.ctrl && (input.key.name === "c" || input.key.name === "d")

/**
 * Converts a key press with optional modifiers to Terminal.UserInput.
 *
 * @param key - The key name (e.g., "return", "c", "d")
 * @param modifiers - Optional key modifiers (ctrl, meta, shift)
 * @returns Terminal.UserInput event
 *
 * @internal
 * @since 0.0.3
 */
const toUserInput = (
  key: string,
  modifiers: Partial<MockTerminal.Modifiers> = {}
): Terminal.UserInput => {
  const { ctrl = false, meta = false, shift = false } = modifiers
  return {
    input: Option.some(key),
    key: { name: key, ctrl, meta, shift }
  }
}

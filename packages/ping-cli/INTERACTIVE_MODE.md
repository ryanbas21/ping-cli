# Interactive Mode & Wizard Guide

The p1-cli supports interactive prompts through @effect/cli's built-in `--wizard` flag and the `Prompt` module.

## Built-in Wizard Mode

@effect/cli automatically provides a `--wizard` flag for all commands, which creates an interactive guided interface.

### Using Wizard Mode

```bash
# Activate wizard mode for any command
p1-cli create_user --wizard

# Or for subcommands
p1-cli groups create_group --wizard
p1-cli populations create_population --wizard
```

### How Wizard Mode Works

When you use `--wizard`, the CLI:
1. Prompts you step-by-step for each required argument
2. Shows you the command being constructed
3. Asks for confirmation before executing
4. Executes the command with your inputs

This makes it easy to use commands without memorizing all the arguments and flags.

### Example: Creating a User with Wizard

```bash
$ p1-cli create_user --wizard

# The wizard will prompt for:
# - Username
# - Email
# - Environment ID (can use PINGONE_ENV_ID env var)
# - Population ID (can use PINGONE_POPULATION_ID env var)
# - Token (can use PINGONE_TOKEN env var)
# - Optional fields (given name, family name, etc.)

# Then confirms before creating the user
```

## Custom Interactive Prompts (Future Enhancement)

The `@effect/cli` `Prompt` module provides building blocks for custom interactive flows:

### Available Prompt Types

```typescript
import { Prompt } from "@effect/cli"

// Text input
const name = yield* Prompt.text({ message: "Enter your name:" })

// Password (hidden input)
const password = yield* Prompt.password({ message: "Enter password:" })

// Select from options
const choice = yield* Prompt.select({
  message: "Choose option:",
  choices: ["Option A", "Option B", "Option C"]
})

// Multi-select (checkbox)
const selected = yield* Prompt.multiSelect({
  message: "Select features:",
  choices: ["Feature 1", "Feature 2", "Feature 3"]
})

// Confirmation
const confirmed = yield* Prompt.confirm({
  message: "Are you sure?",
  initial: true
})

// Number input
const count = yield* Prompt.integer({ message: "Enter count:" })
const price = yield* Prompt.float({ message: "Enter price:" })

// Date input
const date = yield* Prompt.date({ message: "Select date:" })

// File selection
const file = yield* Prompt.file({ message: "Select file:" })

// Toggle (yes/no)
const enabled = yield* Prompt.toggle({
  message: "Enable feature?",
  active: "yes",
  inactive: "no"
})
```

### Input Validation

Prompts support custom validation:

```typescript
const email = yield* Prompt.text({
  message: "Enter email:",
  validate: (input) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(input)) {
      return Effect.fail("Invalid email format")
    }
    return Effect.succeed(input)
  }
})
```

### Creating Custom Interactive Commands

To create a custom interactive command, you can use the Prompt module in your command handler:

```typescript
import { Command, Prompt } from "@effect/cli"
import { Effect } from "effect"
import * as Console from "effect/Console"

export const interactiveCommand = Command.make(
  "interactive_demo",
  {},
  () => Effect.gen(function*() {
    // Prompt for information
    const name = yield* Prompt.text({ message: "What's your name?" })

    const likesCLIs = yield* Prompt.confirm({
      message: "Do you like CLI applications?",
      initial: true
    })

    const favoriteColor = yield* Prompt.select({
      message: "Pick your favorite color:",
      choices: ["Red", "Blue", "Green", "Yellow"]
    })

    // Display results
    yield* Console.log(`\\nHello ${name}!`)
    yield* Console.log(`Likes CLIs: ${likesCLIs ? "Yes" : "No"}`)
    yield* Console.log(`Favorite color: ${favoriteColor}`)
  })
)
```

## When to Use Interactive Mode

**Use --wizard mode when:**
- Users are unfamiliar with command syntax
- Commands have many required arguments
- You want a guided, step-by-step experience
- Building commands interactively is preferred

**Use custom Prompt-based commands when:**
- You need complex multi-step workflows
- Conditional logic based on user responses
- Custom validation or business logic
- Integration with external services or APIs

## Current Support

**Currently Available:**
- ✅ Built-in `--wizard` flag for all commands
- ✅ Automatic prompting for all command arguments
- ✅ Environment variable integration in wizard mode
- ✅ Confirmation before execution

**Future Enhancements:**
- 🔜 Custom interactive wizard for create_user with better UX
- 🔜 Interactive group management workflows
- 🔜 Multi-user batch operations with prompts
- 🔜 Interactive configuration setup

## Testing Interactive Prompts

For testing commands with interactive prompts, use `MockTerminal` from `@effect/platform`:

```typescript
import { MockTerminal } from "@effect/platform/Terminal"
import { Effect, Layer } from "effect"

// In tests
const testInteractiveCommand = Effect.gen(function*() {
  // Simulate user input
  yield* MockTerminal.inputText("John Doe\\n")
  yield* MockTerminal.inputKey("Enter")

  // Run command
  const result = yield* myInteractiveCommand

  // Assert results
  expect(result).toBe(expected)
}).pipe(
  Effect.provide(MockTerminal.layer)
)
```

## Examples

### Quick User Creation (Non-Interactive)

```bash
# Traditional command-line style
p1-cli create_user john john@example.com \\
  --environment-id env-123 \\
  --population-id pop-456 \\
  --pingone-token "token-here" \\
  --given-name "John" \\
  --family-name "Doe"
```

### Guided User Creation (Interactive)

```bash
# Let the wizard guide you
p1-cli create_user --wizard

# You'll be prompted for each field:
# ? Enter username: john
# ? Enter email: john@example.com
# ? Use environment ID from PINGONE_ENV_ID (env-123)? Yes
# ? Use population ID from PINGONE_POPULATION_ID (pop-456)? Yes
# ? Use token from PINGONE_TOKEN? Yes
# ? Add optional user details? Yes
# ? Enter given name: John
# ? Enter family name: Doe
# ? Enter department: Engineering
#
# Summary:
#   Username: john
#   Email: john@example.com
#   Environment: env-123
#   Population: pop-456
#   Given Name: John
#   Family Name: Doe
#   Department: Engineering
#
# ? Create this user? Yes
# ✅ User created successfully!
```

## Resources

- [@effect/cli Documentation](https://effect.website/docs/cli)
- [Effect-TS Examples](https://github.com/Effect-TS/examples)
- [Prompt API Reference](https://effect-ts.github.io/effect/docs/cli/Prompt)

## Contributing

If you'd like to contribute custom interactive workflows:

1. Create a new command using `Prompt` module
2. Add tests using `MockTerminal`
3. Update this documentation
4. Submit a pull request

See `CONTRIBUTING.md` for more details.

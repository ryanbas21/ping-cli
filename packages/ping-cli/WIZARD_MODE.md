# Wizard Mode Guide

The p1-cli provides an interactive wizard mode that guides you through building commands step-by-step. This makes it easy to use the CLI without memorizing all the arguments and flags.

## What is Wizard Mode?

Wizard mode is an interactive, guided interface that:
- Prompts you for each required argument one at a time
- Shows the command being built as you go
- Lets you confirm before executing
- Makes it easy to discover available options

## How to Use Wizard Mode

Simply add the `--wizard` flag to any command:

```bash
p1-cli <command> --wizard
```

The wizard will guide you through providing all required arguments and options.

## User Commands with Wizard

### Create User

```bash
p1-cli create_user --wizard
```

**What the wizard will ask for:**
1. `username` - The username for the new user
2. `email` - Email address for the user
3. `--environment-id` - PingOne environment ID (or press Enter to use `PINGONE_ENV_ID` env var)
4. `--population-id` - Population ID (or press Enter to use `PINGONE_POPULATION_ID` env var)
5. `--pingone-token` - Access token (or press Enter to use `PINGONE_TOKEN` env var)
6. `--given-name` - (Optional) User's first name
7. `--family-name` - (Optional) User's last name
8. `--department` - (Optional) User's department
9. `--locales` - (Optional) Comma-separated list of locales (e.g., "en,es,fr")

**Example interaction:**
```
$ p1-cli create_user --wizard

? Enter username: john.doe
? Enter email: john.doe@example.com
? Enter environment-id [optional]:  ← Press Enter to use PINGONE_ENV_ID
? Enter population-id [optional]:   ← Press Enter to use PINGONE_POPULATION_ID
? Enter pingone-token [optional]:   ← Press Enter to use PINGONE_TOKEN
? Enter given-name [optional]: John
? Enter family-name [optional]: Doe
? Enter department [optional]: Engineering
? Enter locales [optional]: en,es

COMMAND: create_user john.doe john.doe@example.com --given-name John --family-name Doe --department Engineering --locales en,es

? Execute this command? (Y/n)
```

### Read User

```bash
p1-cli read_user --wizard
```

**What the wizard will ask for:**
1. `userId` - The ID of the user to retrieve
2. `--environment-id` - PingOne environment ID
3. `--pingone-token` - (Optional) Access token

### Update User

```bash
p1-cli update_user --wizard
```

**What the wizard will ask for:**
1. `userId` - The ID of the user to update
2. `jsonData` - JSON string with fields to update
3. `--environment-id` - PingOne environment ID
4. `--pingone-token` - (Optional) Access token

**Example JSON data:**
```json
{"email":"newemail@example.com","username":"new.username"}
```

### Delete User

```bash
p1-cli delete_user --wizard
```

**What the wizard will ask for:**
1. `userId` - The ID of the user to delete
2. `--environment-id` - PingOne environment ID
3. `--pingone-token` - (Optional) Access token

### Verify User

```bash
p1-cli verify_user --wizard
```

**What the wizard will ask for:**
1. `userId` - The ID of the user to verify
2. `verificationCode` - The verification code sent to the user
3. `--environment-id` - PingOne environment ID
4. `--pingone-token` - (Optional) Access token

## Group Commands with Wizard

### Create Group

```bash
p1-cli groups create_group --wizard
```

**What the wizard will ask for:**
1. `name` - Name for the new group
2. `--environment-id` - PingOne environment ID
3. `--pingone-token` - (Optional) Access token
4. `--description` - (Optional) Group description
5. `--population-id` - (Optional) Population ID to associate
6. `--user-filter` - (Optional) SCIM filter for automatic membership
7. `--external-id` - (Optional) External identifier

### Read Group

```bash
p1-cli groups read_group --wizard
```

**What the wizard will ask for:**
1. `groupId` - The ID of the group to retrieve
2. `--environment-id` - PingOne environment ID
3. `--pingone-token` - (Optional) Access token
4. `--expand` - (Optional) Expand related resources

### List Groups

```bash
p1-cli groups list_groups --wizard
```

**What the wizard will ask for:**
1. `--environment-id` - PingOne environment ID
2. `--pingone-token` - (Optional) Access token
3. `--limit` - (Optional) Maximum number of groups to return
4. `--filter` - (Optional) SCIM filter expression
5. `--expand` - (Optional) Expand related resources

### Update Group

```bash
p1-cli groups update_group --wizard
```

**What the wizard will ask for:**
1. `groupId` - The ID of the group to update
2. `--environment-id` - PingOne environment ID
3. `--pingone-token` - (Optional) Access token
4. `--name` - (Optional) New group name
5. `--description` - (Optional) New description
6. `--user-filter` - (Optional) New user filter
7. `--external-id` - (Optional) New external ID

### Delete Group

```bash
p1-cli groups delete_group --wizard
```

### Add Group Member

```bash
p1-cli groups add_member --wizard
```

**What the wizard will ask for:**
1. `groupId` - The ID of the group
2. `userId` - The ID of the user to add
3. `--environment-id` - PingOne environment ID
4. `--pingone-token` - (Optional) Access token

### Remove Group Member

```bash
p1-cli groups remove_member --wizard
```

### List Group Members

```bash
p1-cli groups list_members --wizard
```

**What the wizard will ask for:**
1. `groupId` - The ID of the group
2. `--environment-id` - PingOne environment ID
3. `--pingone-token` - (Optional) Access token
4. `--limit` - (Optional) Maximum number of members to return

## Population Commands with Wizard

### Create Population

```bash
p1-cli populations create_population --wizard
```

**What the wizard will ask for:**
1. `name` - Name for the new population
2. `--environment-id` - PingOne environment ID
3. `--pingone-token` - (Optional) Access token
4. `--description` - (Optional) Population description

### Read Population

```bash
p1-cli populations read_population --wizard
```

**What the wizard will ask for:**
1. `populationId` - The ID of the population to retrieve
2. `--environment-id` - PingOne environment ID
3. `--pingone-token` - (Optional) Access token

### List Populations

```bash
p1-cli populations list_populations --wizard
```

**What the wizard will ask for:**
1. `--environment-id` - PingOne environment ID
2. `--pingone-token` - (Optional) Access token
3. `--limit` - (Optional) Maximum number to return
4. `--filter` - (Optional) SCIM filter expression

### Update Population

```bash
p1-cli populations update_population --wizard
```

**What the wizard will ask for:**
1. `populationId` - The ID of the population to update
2. `--environment-id` - PingOne environment ID
3. `--pingone-token` - (Optional) Access token
4. `--name` - (Optional) New population name
5. `--description` - (Optional) New description

### Delete Population

```bash
p1-cli populations delete_population --wizard
```

## Application Commands with Wizard

### Create Application

```bash
p1-cli applications create_application --wizard
```

**What the wizard will ask for:**
1. `name` - Name for the new application
2. `--environment-id` - PingOne environment ID
3. `--pingone-token` - (Optional) Access token
4. `--description` - (Optional) Application description
5. `--type` - (Optional) Application type (default: WEB_APP)
6. `--protocol` - (Optional) Protocol type (default: OPENID_CONNECT)
7. `--enabled` - (Optional) Enable the application (flag, no value needed)

### Read Application

```bash
p1-cli applications read_application --wizard
```

**What the wizard will ask for:**
1. `applicationId` - The ID of the application to retrieve
2. `--environment-id` - PingOne environment ID
3. `--pingone-token` - (Optional) Access token

### List Applications

```bash
p1-cli applications list_applications --wizard
```

**What the wizard will ask for:**
1. `--environment-id` - PingOne environment ID
2. `--pingone-token` - (Optional) Access token
3. `--limit` - (Optional) Maximum number to return
4. `--filter` - (Optional) SCIM filter expression

### Update Application

```bash
p1-cli applications update_application --wizard
```

**What the wizard will ask for:**
1. `applicationId` - The ID of the application to update
2. `--environment-id` - PingOne environment ID
3. `--pingone-token` - (Optional) Access token
4. `--name` - (Optional) New application name
5. `--description` - (Optional) New description
6. `--enabled` - (Optional) Enable/disable flag

### Delete Application

```bash
p1-cli applications delete_application --wizard
```

## Tips for Using Wizard Mode

### 1. Use Environment Variables for Common Values

Set up your `.env` file or export environment variables:

```bash
export PINGONE_ENV_ID="your-environment-id"
export PINGONE_TOKEN="your-access-token"
export PINGONE_POPULATION_ID="your-default-population"
```

When the wizard prompts for these values, just press **Enter** to use the environment variable.

### 2. Skip Optional Fields

For optional fields (shown as `[optional]`), press **Enter** to skip them.

### 3. Review Before Executing

The wizard shows you the complete command before executing. This helps you:
- Verify all arguments are correct
- Learn the command syntax for future manual use
- Cancel if something looks wrong

### 4. Copy the Command for Later

The wizard displays the full command it will execute. You can copy this command to:
- Save it for future reference
- Use it in scripts
- Share it with team members
- Document your workflows

### 5. Use Tab Completion (if available)

Some terminals support tab completion for command names. After typing `p1-cli`, press **Tab** to see available commands.

## Example Workflow: Creating a New User

Here's a complete example of using wizard mode to create a user:

```bash
# Step 1: Set up environment (one-time setup)
export PINGONE_ENV_ID="abc-123-env"
export PINGONE_TOKEN="secret-token-here"
export PINGONE_POPULATION_ID="def-456-pop"

# Step 2: Start the wizard
$ p1-cli create_user --wizard

# Step 3: Follow the prompts
? Enter username: jane.smith
? Enter email: jane.smith@company.com
? Enter environment-id [optional]:     ← Press Enter (uses PINGONE_ENV_ID)
? Enter population-id [optional]:      ← Press Enter (uses PINGONE_POPULATION_ID)
? Enter pingone-token [optional]:      ← Press Enter (uses PINGONE_TOKEN)
? Enter given-name [optional]: Jane
? Enter family-name [optional]: Smith
? Enter department [optional]: Marketing
? Enter locales [optional]: en

# Step 4: Review and confirm
COMMAND: create_user jane.smith jane.smith@company.com --given-name Jane --family-name Smith --department Marketing --locales en

? Execute this command? (Y/n) y

# Step 5: See the result
✅ User created successfully!
User ID: user-789-xyz
Username: jane.smith
Email: jane.smith@company.com
```

## Troubleshooting

### Wizard Not Starting

If the wizard doesn't start, ensure you're using the `--wizard` flag:
```bash
p1-cli create_user --wizard  # ✅ Correct
p1-cli create_user wizard     # ❌ Wrong
```

### Cancelled by Accident

If you cancel the wizard (Ctrl+C or select "No" to execute), just run the command again:
```bash
p1-cli create_user --wizard
```

### Want to Use Command Line Instead

If you prefer the command-line syntax, you can skip wizard mode:
```bash
p1-cli create_user john john@example.com \
  --environment-id env-123 \
  --population-id pop-456 \
  --given-name John
```

Both approaches work equally well - choose what's most convenient for you!

## Benefits of Wizard Mode

1. **No Need to Memorize** - Don't need to remember all flags and arguments
2. **Guided Experience** - Prompts tell you exactly what's needed
3. **Learn as You Go** - See the final command to learn the CLI syntax
4. **Fewer Errors** - Step-by-step reduces typos and mistakes
5. **Environment Variable Integration** - Seamlessly uses env vars when available
6. **Safe Confirmation** - Review before executing prevents accidents

## Comparison: Wizard vs Command Line

### Wizard Mode (Interactive)
```bash
p1-cli create_user --wizard
# Then answer prompts interactively
```

**Pros:**
- ✅ Easy for beginners
- ✅ No need to memorize syntax
- ✅ Guided experience
- ✅ Can review before executing

**Cons:**
- ❌ Not suitable for scripts
- ❌ Requires interactive terminal

### Command Line Mode (Direct)
```bash
p1-cli create_user john john@example.com \
  --environment-id env-123 \
  --population-id pop-456
```

**Pros:**
- ✅ Perfect for scripts
- ✅ Fast for experienced users
- ✅ Can be automated
- ✅ Works in CI/CD pipelines

**Cons:**
- ❌ Need to know all arguments
- ❌ More prone to syntax errors

## Next Steps

1. Try wizard mode with a simple command:
   ```bash
   p1-cli --help  # See available commands
   p1-cli read_user --wizard
   ```

2. Set up your environment variables to make wizard mode even faster

3. Once comfortable with wizard mode, try the command-line syntax for scripting

4. Check out `MANUAL_TESTING.md` for more examples and testing scenarios

5. See `INTERACTIVE_MODE.md` for advanced interactive features

## Related Documentation

- `README.md` - Full CLI documentation with command examples
- `MANUAL_TESTING.md` - Manual testing guide with configuration examples
- `INTERACTIVE_MODE.md` - Advanced interactive features and Prompt API
- `docs/API.md` - Complete API reference

## Feedback

Have suggestions for improving wizard mode? Open an issue or contribute at:
https://github.com/ryanbas21/ping-cli

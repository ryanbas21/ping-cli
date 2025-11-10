#!/usr/bin/env node
/**
 * Post-docgen script to add content to generated index pages
 *
 * @effect/docgen generates empty index.md files which cause 404s on GitHub Pages.
 * This script adds proper content to those index pages.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const API_DOCS_DIR = join(__dirname, '../../../api_docs')

const HOME_CONTENT = `---
title: Home
nav_order: 1
---

# p1-cli API Documentation

Welcome to the p1-cli API documentation. This is a command-line tool for managing PingOne resources via the PingOne Management API.

## Quick Links

- [Modules](/ping-cli/docs/modules) - Browse all API modules
- [GitHub Repository](https://github.com/ryanbas21/ping-cli) - Source code and issues

## Overview

p1-cli provides a type-safe, Effect-based CLI for interacting with PingOne services. Key features include:

- **User Management** - Full CRUD operations for PingOne users
- **Bulk Operations** - Import, export, and delete users in bulk
- **Groups Management** - Create and manage user groups
- **Populations Management** - Manage user populations
- **Applications Management** - OAuth/OIDC application management
- **Type-Safe** - Built with Effect library for robust error handling
- **Schema Validation** - Request/response validation using Effect Schema

## Getting Started

### Installation

\`\`\`bash
# Install globally
npm install -g p1-cli

# Or use with npx
npx p1-cli --help
\`\`\`

### Configuration

Create a \`.env\` file with your PingOne credentials:

\`\`\`bash
PINGONE_ENV_ID=your-environment-id
PINGONE_TOKEN=your-access-token
\`\`\`

### Usage Example

\`\`\`bash
# Create a user
p1-cli p1 create_user john.doe john@example.com \\
  --environment-id <env-id> \\
  --pingone-token <token> \\
  --population-id <pop-id> \\
  --given-name "John" \\
  --family-name "Doe"
\`\`\`

## Documentation

Browse the [Modules](/ping-cli/docs/modules) section to explore the complete API documentation.
`

const MODULES_CONTENT = `---
title: Modules
has_children: true
permalink: /docs/modules
nav_order: 2
---

# API Modules

This section contains the API documentation for all modules in the p1-cli package.

## Available Modules

Browse the modules in the sidebar to explore the API documentation for:

- **Commands** - CLI command implementations for PingOne operations
- **Errors** - Structured error types for comprehensive error handling
- **PingCommand** - Core command abstraction and utilities
- **Test Helpers** - Testing utilities and mock services

Each module page includes:
- Overview and description
- Exported types, classes, and functions
- Code examples and usage patterns
- Type signatures

---

Select a module from the sidebar to view its documentation.
`

function fixIndexFile(filepath, content) {
  try {
    const current = readFileSync(filepath, 'utf-8')

    // Check if file only has frontmatter (less than 100 chars or just whitespace after frontmatter)
    const lines = current.split('\n')
    const frontmatterEnd = lines.slice(1).indexOf('---') + 1
    const bodyContent = lines.slice(frontmatterEnd + 1).join('\n').trim()

    if (bodyContent.length < 50) {
      console.log(`Fixing ${filepath} (empty or minimal content)`)
      writeFileSync(filepath, content, 'utf-8')
    } else {
      console.log(`Skipping ${filepath} (already has content)`)
    }
  } catch (error) {
    console.error(`Error fixing ${filepath}:`, error.message)
  }
}

// Fix the main index page
fixIndexFile(join(API_DOCS_DIR, 'index.md'), HOME_CONTENT)

// Fix the modules index page
fixIndexFile(join(API_DOCS_DIR, 'modules', 'index.md'), MODULES_CONTENT)

console.log('✓ Documentation index pages fixed')

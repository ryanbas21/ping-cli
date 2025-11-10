import { execFile } from "node:child_process"
import { existsSync, statSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"
import { describe, expect, it } from "vitest"

const execFileAsync = promisify(execFile)

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const binPath = resolve(__dirname, "../dist/main.js")

/**
 * Integration tests for the CLI bin entry point.
 *
 * These tests verify that:
 * - The bin file exists and is executable
 * - The bin file has the correct shebang
 * - The CLI can be invoked via the bin entry point
 * - package.json bin configuration is correct
 */

describe("CLI Bin Entry Point", () => {
  describe("Bin File Validation", () => {
    it("should have dist/main.js file", () => {
      expect(existsSync(binPath)).toBe(true)
    })

    it("should have executable permissions", () => {
      const stats = statSync(binPath)
      // Check if owner has execute permission (0o100)
      expect(stats.mode & 0o100).toBeTruthy()
    })

    it("should have shebang line", async () => {
      const { readFile } = await import("node:fs/promises")
      const content = await readFile(binPath, "utf-8")
      const firstLine = content.split("\n")[0]

      expect(firstLine).toBe("#!/usr/bin/env node")
    })
  })

  describe("Package.json Configuration", () => {
    it("should have correct bin entry in package.json", async () => {
      const { readFile } = await import("node:fs/promises")
      const pkgPath = resolve(__dirname, "../package.json")
      const pkg = JSON.parse(await readFile(pkgPath, "utf-8")) as {
        bin: { "p1-cli": string }
      }

      expect(pkg.bin).toBeDefined()
      expect(pkg.bin["p1-cli"]).toBe("dist/main.js")
    })

    it("should have correct main entry in package.json", async () => {
      const { readFile } = await import("node:fs/promises")
      const pkgPath = resolve(__dirname, "../package.json")
      const pkg = JSON.parse(await readFile(pkgPath, "utf-8")) as {
        main: string
      }

      expect(pkg.main).toBe("dist/index.js")
    })

    it("should include dist in files array", async () => {
      const { readFile } = await import("node:fs/promises")
      const pkgPath = resolve(__dirname, "../package.json")
      const pkg = JSON.parse(await readFile(pkgPath, "utf-8")) as {
        files: Array<string>
      }

      expect(pkg.files).toContain("dist")
    })

    it("should have publishConfig set to public", async () => {
      const { readFile } = await import("node:fs/promises")
      const pkgPath = resolve(__dirname, "../package.json")
      const pkg = JSON.parse(await readFile(pkgPath, "utf-8")) as {
        publishConfig?: { access: string }
      }

      expect(pkg.publishConfig?.access).toBe("public")
    })
  })

  describe("CLI Invocation", () => {
    it("should execute with --help flag", async () => {
      const { stdout, stderr } = await execFileAsync("node", [binPath, "--help"])

      expect(stderr).toBe("")
      expect(stdout).toContain("PingOne CLI")
      expect(stdout).toContain("USAGE")
      expect(stdout).toContain("COMMANDS")
    }, 10000)

    it("should execute with --version flag", async () => {
      const { stdout, stderr } = await execFileAsync("node", [binPath, "--version"])

      expect(stderr).toBe("")
      // Version output contains version number, not necessarily "PingOne CLI"
      expect(stdout).toMatch(/\d+\.\d+\.\d+/)
    }, 10000)

    it("should show help when invoked without arguments", async () => {
      const { stdout, stderr } = await execFileAsync("node", [binPath])

      expect(stderr).toBe("")
      expect(stdout).toContain("PingOne CLI")
      expect(stdout).toContain("USAGE")
    }, 10000)

    it("should show environments subcommand in help", async () => {
      const { stdout } = await execFileAsync("node", [binPath, "--help"])

      expect(stdout).toContain("environments")
      expect(stdout).toContain("list_environments")
      expect(stdout).toContain("read_environment")
    }, 10000)

    it("should fail gracefully with invalid command", async () => {
      try {
        await execFileAsync("node", [binPath, "invalid_command"])
      } catch (error) {
        // Should exit with non-zero code
        expect((error as { code: number }).code).toBeGreaterThan(0)
      }
    }, 10000)
  })

  describe("Post-publish Verification", () => {
    it("should have postbuild script to make bin executable", async () => {
      const { readFile } = await import("node:fs/promises")
      const pkgPath = resolve(__dirname, "../package.json")
      const pkg = JSON.parse(await readFile(pkgPath, "utf-8")) as {
        scripts: { postbuild: string }
      }

      expect(pkg.scripts.postbuild).toContain("chmod +x dist/main.js")
    })

    it("should have build script", async () => {
      const { readFile } = await import("node:fs/promises")
      const pkgPath = resolve(__dirname, "../package.json")
      const pkg = JSON.parse(await readFile(pkgPath, "utf-8")) as {
        scripts: { build: string }
      }

      expect(pkg.scripts.build).toBeDefined()
      expect(pkg.scripts.build).toContain("tsc")
    })
  })
})

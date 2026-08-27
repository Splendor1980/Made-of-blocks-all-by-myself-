import { spawn } from "node:child_process";
import { join } from "node:path";
import { tool } from "@opencode-ai/plugin";

export default tool({
  description:
    "Launch the Skin Studio companion Electron window (template cards, 3D preview, region paint, export). " +
    "This is the companion UI to OpenCode Desktop, not a separate product.",
  args: {},
  async execute(_args, ctx) {
    const appDir = join(ctx.worktree, "packages", "app");
    const child = spawn("npm", ["start"], {
      cwd: appDir,
      detached: true,
      stdio: "ignore",
    });
    child.unref();
    return `Launched Skin Studio from ${appDir} (pid ${child.pid}). On this machine the window opens via the Desktop/agent; in a headless session the process starts without a visible frame.`;
  },
});

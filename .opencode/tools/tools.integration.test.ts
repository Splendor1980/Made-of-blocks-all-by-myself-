import { describe, it, expect, beforeAll } from "vitest";
import { mkdtemp, mkdir, copyFile, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { decodePng, validateSkin } from "@mc-agent/core";

import validateSkinTool from "./validate_skin";
import recolorTemplateTool from "./recolor_template";
import importSkinTool from "./import_skin";
import editRegionTool from "./edit_skin_region";
import generateSkinTool from "./generate_skin";

let worktree = "";
const ctx = {
  sessionID: "t",
  messageID: "t",
  agent: "skins",
  directory: "",
  worktree: "",
  abort: new AbortController().signal,
  metadata: () => {},
  ask: async () => {},
} as any;

beforeAll(async () => {
  worktree = await mkdtemp(join(tmpdir(), "mc-agent-"));
  ctx.worktree = worktree;
  ctx.directory = worktree;
  await mkdir(join(worktree, "assets", "templates"), { recursive: true });
  await copyFile(
    join(process.cwd(), "assets", "templates", "knight.png"),
    join(worktree, "assets", "templates", "knight.png"),
  );
  await copyFile(
    join(process.cwd(), "assets", "templates", "knight.slots.json"),
    join(worktree, "assets", "templates", "knight.slots.json"),
  );
});

describe("skins agent tools", () => {
  it("validate_skin reports a valid 64x64 skin", async () => {
    const out = await validateSkinTool.execute({ path: "assets/templates/knight.png" }, ctx);
    expect(out).toMatch(/valid/);
  });

  it("recolor_template writes a valid recolored PNG", async () => {
    const res = await recolorTemplateTool.execute(
      { templateId: "knight", part: "head", partColor: "#ff0000", output: "out/red-head.png" },
      ctx,
    );
    expect(res).toMatch(/Wrote/);
    const img = decodePng(await readFile(join(worktree, "out/red-head.png")));
    expect(validateSkin(img).valid).toBe(true);
  });

  it("import_skin normalizes and writes output", async () => {
    const res = await importSkinTool.execute(
      { path: "assets/templates/knight.png", model: "auto", strict: false, output: "out/imported.png" },
      ctx,
    );
    expect(res).toMatch(/Imported as classic/);
  });

  it("edit_skin_region paints a region", async () => {
    const res = await editRegionTool.execute(
      {
        path: "assets/templates/knight.png",
        region: "torso",
        color: "#00ff00",
        output: "out/torso-green.png",
      },
      ctx,
    );
    expect(res).toMatch(/Edited torso/);
    const img = decodePng(await readFile(join(worktree, "out/torso-green.png")));
    expect(validateSkin(img).valid).toBe(true);
  });

  it("generate_skin creates a valid skin from a prompt", async () => {
    const res = await generateSkinTool.execute(
      { prompt: "glowing ice mage", templateId: "knight", output: "out/ice-mage.png" },
      ctx,
    );
    expect(res).toMatch(/Generated/);
    const img = decodePng(await readFile(join(worktree, "out/ice-mage.png")));
    expect(validateSkin(img).valid).toBe(true);
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import craftDatapack from "./craft_datapack";

async function ctxFor(worktree: string) {
  return {
    worktree,
    sessionId: "test",
    transcriptPath: join(worktree, "transcript.json"),
    model: "test",
    tools: {},
    permissions: {},
    services: {},
  } as any;
}

const has = (files: string[], sub: string) => files.some((f) => f.split(/[/\\]/).join("/").includes(sub));

describe("craft_datapack (integration)", () => {
  let wt: string;
  beforeEach(() => {
    wt = mkdtempSync(join(tmpdir(), "cdp-"));
  });
  afterEach(() => rmSync(wt, { recursive: true, force: true }));

  it("builds a datapack with embedded structure + recipe + function", async () => {
    const ctx = await ctxFor(wt);
    const out: any = await craftDatapack.execute(
      {
        name: "pack",
        namespace: "demo",
        output: "pack_out",
        structure: { type: "pyramid", block: "minecraft:sandstone", size: 3 },
        recipes: [
          {
            type: "shaped",
            id: "gem",
            pattern: ["XX"],
            key: { X: "minecraft:emerald" },
            result: { item: "minecraft:emerald_block", count: 1 },
          },
        ],
        functions: [{ id: "hi", commands: ["say hi"] }],
      },
      ctx,
    );
    const res = JSON.parse(out.output ?? out);
    expect(res.structure.id).toBe("pyramid_3");
    expect(has(res.datapack.files, "pack.mcmeta")).toBe(true);
    expect(has(res.datapack.files, "structures/pyramid_3.nbt")).toBe(true);
    expect(has(res.datapack.files, "recipes/gem.json")).toBe(true);
    expect(has(res.datapack.files, "functions/hi.mcfunction")).toBe(true);
  });

  it("writes an on-disk datapack folder", async () => {
    const ctx = await ctxFor(wt);
    await craftDatapack.execute(
      { name: "pack", namespace: "demo", output: "pack_out", functions: [{ id: "f", commands: ["say x"] }] } as any,
      ctx,
    );
    expect(existsSync(join(wt, "pack_out", "pack", "pack.mcmeta"))).toBe(true);
    expect(existsSync(join(wt, "pack_out", "pack", "data", "demo", "functions", "f.mcfunction"))).toBe(true);
  });
});

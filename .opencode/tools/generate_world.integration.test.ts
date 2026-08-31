import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import generateWorld from "./generate_world";

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

describe("generate_world (integration)", () => {
  let wt: string;
  beforeEach(() => {
    wt = mkdtempSync(join(tmpdir(), "gw-"));
  });
  afterEach(() => rmSync(wt, { recursive: true, force: true }));

  for (const type of ["house", "box", "tower", "pyramid", "fence", "wall"]) {
    it(`creates a datapack with embedded structure for type=${type}`, async () => {
      const ctx = await ctxFor(wt);
      const out: any = await generateWorld.execute(
        { type, block: "minecraft:oak_planks", size: 4, name: "pack", namespace: "gen", output: "pack_out" },
        ctx,
      );
      const res = JSON.parse(out.output ?? out);
      expect(res.type).toBe(type);
      expect(res.nbt.bytes).toBeGreaterThan(0);
      expect(has(res.datapack.files, "pack.mcmeta")).toBe(true);
      expect(has(res.datapack.files, `structures/${type}_4.nbt`)).toBe(true);
      expect(res.loadInGame).toContain(`/function gen:build_${type}`);
    });
  }

  it("accepts a valid explicit block state", async () => {
    const ctx = await ctxFor(wt);
    const out: any = await generateWorld.execute(
      { type: "house", block: "minecraft:oak_log", state: "axis=y", size: 3, name: "pack", namespace: "gen", output: "pack_out" },
      ctx,
    );
    const res = JSON.parse(out.output ?? out);
    expect(res.error).toBeUndefined();
    expect(res.datapack.files.length).toBeGreaterThan(0);
  });

  it("rejects an invalid block state with a readable error", async () => {
    const ctx = await ctxFor(wt);
    const out: any = await generateWorld.execute(
      { type: "house", block: "minecraft:oak_log", state: "axis=warp", size: 3, output: "pack_out" },
      ctx,
    );
    const res = JSON.parse(out.output ?? out);
    expect(res.error).toMatch(/invalid block id or state/i);
  });

  it("writes an on-disk datapack + nbt loadable in-game", async () => {
    const ctx = await ctxFor(wt);
    await generateWorld.execute({ type: "pyramid", size: 3, name: "pack", output: "pack_out" } as any, ctx);
    expect(existsSync(join(wt, "pack_out", "pack", "pack.mcmeta"))).toBe(true);
    expect(existsSync(join(wt, "pack_out", "pack", "data", "genmod", "structures", "pyramid_3.nbt"))).toBe(true);
    expect(existsSync(join(wt, "pack_out", "pack", "data", "genmod", "functions", "build_pyramid.mcfunction"))).toBe(true);
  });
});

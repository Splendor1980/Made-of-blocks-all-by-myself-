import { describe, it, expect, beforeAll } from "vitest";
import { mkdtemp, readFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import buildMcfunction from "./build_mcfunction";
import buildNbt from "./build_nbt";
import datapackCreate from "./datapack_create";

let worktree = "";
const ctx = {
  sessionID: "t",
  messageID: "t",
  agent: "crafter",
  directory: "",
  worktree: "",
  abort: new AbortController().signal,
  metadata: () => {},
  ask: async () => {},
} as any;

beforeAll(async () => {
  worktree = await mkdtemp(join(tmpdir(), "mc-crafter-"));
  ctx.worktree = worktree;
  ctx.directory = worktree;
});

describe("crafter agent tools", () => {
  it("build_mcfunction generates commands and writes a file", async () => {
    const res = JSON.parse(
      (await buildMcfunction.execute(
        {
          size: [2, 1, 1],
          voxels: [
            { x: 0, y: 0, z: 0, id: "stone" },
            { x: 1, y: 0, z: 0, id: "dirt" },
          ],
          output: "out/b.mcfunction",
        },
        ctx,
      )) as string,
    );
    expect(res.commandCount).toBe(2);
    expect(res.violations).toHaveLength(0);
    const txt = await readFile(join(worktree, "out/b.mcfunction"), "utf8");
    expect(txt).toContain("setblock");
  });

  it("build_nbt writes a structure buffer", async () => {
    const res = JSON.parse(
      (await buildNbt.execute(
        { size: [1, 1, 1], voxels: [{ x: 0, y: 0, z: 0, id: "stone" }], output: "out/s.nbt" },
        ctx,
      )) as string,
    );
    expect(res.bytes).toBeGreaterThan(0);
  });

  it("datapack_create builds a valid textureless pack", async () => {
    const res = JSON.parse(
      (await datapackCreate.execute(
        {
          name: "p",
          namespace: "demo",
          recipes: [
            {
              type: "shaped",
              id: "t",
              pattern: ["XX"],
              key: { X: "minecraft:stone" },
              result: { item: "minecraft:stone", count: 1 },
            },
          ],
          functions: [{ id: "f", commands: ["setblock 0 0 0 stone"] }],
          output: "out/dp",
        },
        ctx,
      )) as string,
    );
    expect(res.valid).toBe(true);
    expect(res.files.some((f: string) => f.endsWith("pack.mcmeta"))).toBe(true);
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeStructureNbt, box } from "@mc-agent/core";
import craftDatapack from "./craft_datapack";
import importStructure from "./import_structure";

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

describe("craft_datapack scenes + import_structure", () => {
  let wt: string;
  beforeEach(() => {
    wt = mkdtempSync(join(tmpdir(), "scene-"));
  });
  afterEach(() => rmSync(wt, { recursive: true, force: true }));

  it("embeds multiple primitive structures into one datapack", async () => {
    const ctx = await ctxFor(wt);
    const out: any = JSON.parse(
      (await craftDatapack.execute(
        {
          name: "scene",
          namespace: "demo",
          output: "scene_out",
          structures: [
            { type: "box", block: "minecraft:stone", size: 3, id: "base" },
            { type: "pyramid", block: "minecraft:sand", size: 3, id: "top" },
          ],
        },
        ctx,
      )) as string,
    );
    expect(out.structures.map((s: any) => s.id).sort()).toEqual(["base", "top"]);
    expect(has(out.datapack.files, "structures/base.nbt")).toBe(true);
    expect(has(out.datapack.files, "structures/top.nbt")).toBe(true);
    expect(has(out.datapack.files, "functions/build_base.mcfunction")).toBe(true);
    expect(has(out.datapack.files, "functions/build_top.mcfunction")).toBe(true);
  });

  it("imports an existing .nbt and wraps it into a datapack", async () => {
    const ctx = await ctxFor(wt);
    const nbt = writeStructureNbt(box(4, "minecraft:diamond_block", false));
    writeFileSync(join(wt, "mybuild.nbt"), nbt);

    const out: any = JSON.parse(
      (await importStructure.execute(
        { path: "mybuild.nbt", output: "imp_out", name: "imp", namespace: "imp" },
        ctx,
      )) as string,
    );
    expect(out.id).toBe("mybuild");
    expect(out.blockCount).toBeGreaterThan(0);
    expect(has(out.datapack.files, "structures/mybuild.nbt")).toBe(true);
    expect(out.loadInGame).toContain("build_mybuild");
    expect(existsSync(join(wt, "imp_out", "imp", "data", "imp", "structures", "mybuild.nbt"))).toBe(true);
  });

  it("import_structure reports info without output", async () => {
    const ctx = await ctxFor(wt);
    const nbt = writeStructureNbt(box(3, "minecraft:stone", false));
    writeFileSync(join(wt, "info.nbt"), nbt);
    const out: any = JSON.parse((await importStructure.execute({ path: "info.nbt" }, ctx)) as string);
    expect(out.blockCount).toBe(27);
    expect(out.datapack).toBeUndefined();
  });
});

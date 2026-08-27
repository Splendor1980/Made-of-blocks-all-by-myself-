import { describe, it, expect } from "vitest";
import { mkdtemp, readFile, rm, mkdir, readdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createDatapack, Datapack } from "../src/datapack/index.js";
import { writeStructureNbt } from "../src/build/index.js";

describe("Datapack", () => {
  it("rejects invalid namespace", () => {
    expect(() => new Datapack({ name: "x", namespace: "Bad NS" })).toThrow();
  });

  it("builds a valid textureless pack (recipes/functions/advancement/loot)", async () => {
    const dp = createDatapack({ name: "demo_pack", namespace: "demo", description: "test" });
    dp.addShapedRecipe({
      id: "test_block",
      pattern: ["XX", "XX"],
      key: { X: "minecraft:stone" },
      result: { item: "minecraft:stone", count: 4 },
    });
    dp.addShapelessRecipe({
      id: "unpack",
      ingredients: ["minecraft:stone"],
      result: { item: "minecraft:cobblestone" },
    });
    dp.addStonecutterRecipe({
      id: "cut",
      input: "minecraft:stone",
      result: { item: "minecraft:stone_slab" },
    });
    dp.addFunction({ id: "setup", commands: ["setblock 0 0 0 stone", "say done"] });
    dp.addAdvancement({ id: "first", title: "First", description: "hi" });
    dp.addLootTable({ id: "common", pools: [{ entries: ["minecraft:stick"], rolls: 1 }] });
    dp.addStructureRef("my_house");

    const v = dp.validate();
    expect(v.valid).toBe(true);

    const json = dp.toJSON() as any;
    expect(json.recipes.length).toBe(3);
    expect(json.functions[0].commands).toContain("say done");
    expect(json.structures).toContain("demo:my_house");

    const dir = await mkdtemp(join(tmpdir(), "dp-"));
    const files = await dp.build(dir);
    const has = (p: string) => files.some((f) => f.endsWith(p));
    expect(has("pack.mcmeta")).toBe(true);
    expect(has(join("data", "demo", "recipes", "test_block.json"))).toBe(true);
    expect(has(join("data", "demo", "functions", "setup.mcfunction"))).toBe(true);
    await rm(dir, { recursive: true, force: true });
  });

  it("reports function security violations on validate", () => {
    const dp = createDatapack({ name: "bad", namespace: "bad" });
    dp.addFunction({ id: "evil", commands: ["op @a", "execute run say x"] });
    const v = dp.validate();
    expect(v.valid).toBe(false);
    expect(v.errors.join(" ")).toMatch(/op|execute/);
  });

  it("embeds a real structure .nbt written by the build core", async () => {
    const dp = createDatapack({ name: "struct_pack", namespace: "structmod", description: "t" });
    const grid = { width: 3, height: 3, depth: 3, blocks: new Array(27).fill("minecraft:stone") };
    const nbt = writeStructureNbt(grid);
    dp.addStructure("tower", nbt);
    expect(() => dp.addStructure("bad", Buffer.alloc(0))).toThrow();

    const dir = await mkdtemp(join(tmpdir(), "dp-struct-"));
    const files = await dp.build(dir);
    const nbtPath = join(dir, "struct_pack", "data", "structmod", "structures", "tower.nbt");
    expect(files.some((f) => f.endsWith("tower.nbt"))).toBe(true);
    const onDisk = await readFile(nbtPath);
    expect(onDisk.length).toBe(nbt.length);
    await rm(dir, { recursive: true, force: true });
  });
});

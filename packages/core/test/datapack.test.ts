import { describe, it, expect } from "vitest";
import { mkdtemp, readFile, rm, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createDatapack, Datapack } from "../src/datapack/index.js";

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
});

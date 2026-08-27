import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createDatapack, writeStructureNbt, box, pyramid, wall } from "../packages/core/dist/index.js";

const EXAMPLES = join(process.cwd(), "examples");

function grid(type, block, size) {
  switch (type) {
    case "house":
    case "box":
      return box(size, block, type !== "box");
    case "tower":
    case "pyramid":
      return pyramid(size, block);
    case "fence":
    case "wall":
      return wall(size, Math.max(2, Math.floor(size / 2)), block);
    default:
      throw new Error("unknown type " + type);
  }
}

async function build(name, opts) {
  const dp = createDatapack({ name, namespace: opts.namespace, description: opts.description });
  if (opts.structure) {
    const g = grid(opts.structure.type, opts.structure.block, opts.structure.size);
    const id = opts.structure.id ?? `${opts.structure.type}_${opts.structure.size}`;
    dp.addStructure(id, writeStructureNbt(g));
    dp.addFunction({
      id: `build_${opts.structure.type}`,
      commands: [`structure load ${opts.namespace}:${id} ~ ~ ~`, `say ${name} placed`],
    });
  }
  if (opts.recipe) dp.addShapedRecipe(opts.recipe);
  if (opts.advancement) dp.addAdvancement(opts.advancement);
  if (opts.loot) dp.addLootTable(opts.loot);
  for (const f of opts.functions ?? []) dp.addFunction(f);
  const v = dp.validate();
  if (!v.valid) throw new Error(`${name}: ${v.errors.join("; ")}`);
  await mkdir(EXAMPLES, { recursive: true });
  const files = await dp.build(join(EXAMPLES, name));
  console.log(`examples/${name}: ${files.length} files`);
}

await build("example_house", {
  namespace: "examples",
  description: "Starter house (oak).",
  structure: { type: "house", block: "minecraft:oak_planks", size: 6 },
});

await build("example_pyramid", {
  namespace: "examples",
  description: "Sandstone pyramid.",
  structure: { type: "pyramid", block: "minecraft:sandstone", size: 5 },
});

await build("example_tower", {
  namespace: "examples",
  description: "Stone-brick tower.",
  structure: { type: "tower", block: "minecraft:stone_bricks", size: 8 },
});

await build("example_starter_kit", {
  namespace: "kit",
  description: "Structure + recipe + advancement + loot (demo).",
  structure: { type: "box", block: "minecraft:diamond_block", size: 3 },
  recipe: {
    type: "shaped",
    id: "gem",
    pattern: ["XX", "XX"],
    key: { X: "minecraft:emerald" },
    result: { item: "minecraft:emerald_block", count: 1 },
  },
  advancement: {
    id: "first_build",
    title: "First Build",
    description: "You placed a demo structure.",
    icon: "minecraft:diamond",
    trigger: "minecraft:placed_block",
  },
  loot: {
    id: "demo_chest",
    pools: [{ entries: ["minecraft:diamond"], rolls: 1 }],
  },
  functions: [{ id: "hello", commands: ["say Hello from the starter kit"] }],
});

console.log("Done. Copy any examples/<name> folder into saves/<world>/datapacks/.");

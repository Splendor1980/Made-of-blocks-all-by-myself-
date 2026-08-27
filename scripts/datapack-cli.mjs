import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createDatapack } from "../packages/core/dist/datapack/index.js";

function parseArgs(argv) {
  const out = { out: "out/datapack" };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--out") out.out = argv[++i];
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv);

  const dp = createDatapack({
    name: "demo_pack",
    namespace: "demomod",
    description: "Headless demo datapack from mc-agent",
  });

  dp.addShapedRecipe({
    id: "magic_block",
    pattern: ["A", "A", "A"],
    key: { A: "minecraft:diamond" },
    result: { item: "minecraft:emerald_block", count: 1 },
  });
  dp.addStonecutterRecipe({
    id: "stone_to_glass",
    input: "minecraft:stone",
    result: { item: "minecraft:glass", count: 4 },
  });
  dp.addShapelessRecipe({
    id: "dye_mix",
    ingredients: ["minecraft:red_dye", "minecraft:blue_dye"],
    result: { item: "minecraft:purple_dye", count: 2 },
  });
  const fnViolations = dp.addFunction({
    id: "greet",
    commands: [
      "say Hello from mc-agent datapack",
      "titleraw @a title {\"rawtext\":[{\"text\":\"Demo\"}]}",
    ],
  });
  dp.addAdvancement({
    id: "first",
    title: "Demo Done",
    description: "A headless demo advancement",
    icon: "minecraft:diamond",
  });
  dp.addLootTable({
    id: "chest",
    pools: [{ entries: ["minecraft:diamond", "minecraft:emerald"], rolls: 1 }],
  });

  const v = dp.validate();
  if (!v.valid) {
    console.error("DATAPACK INVALID: " + v.errors.join("; "));
    process.exit(1);
  }
  console.log("datapack valid: true");
  if (fnViolations.length) console.log("function violations: " + fnViolations.map((x) => x.reason).join("; "));

  const written = await dp.build(args.out);
  await mkdir(args.out, { recursive: true });
  const manifest = join(args.out, "datapack.manifest.json");
  await writeFile(manifest, JSON.stringify(dp.toJSON(), null, 2));
  written.push(manifest);
  console.log("wrote " + written.length + " files to " + args.out + ":");
  for (const p of written) console.log("  " + p);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

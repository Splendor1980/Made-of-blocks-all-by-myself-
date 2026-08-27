import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createDatapack } from "../packages/core/dist/datapack/index.js";
import { writeStructureNbt, box, pyramid, wall } from "../packages/core/dist/build/index.js";

function parseArgs(argv) {
  const o = {
    type: "house",
    block: "minecraft:oak_planks",
    size: 5,
    name: "generated_pack",
    namespace: "genmod",
    out: "out/world",
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--type") o.type = argv[++i];
    else if (a === "--block") o.block = argv[++i];
    else if (a === "--size") o.size = parseInt(argv[++i], 10) || 5;
    else if (a === "--name") o.name = argv[++i];
    else if (a === "--namespace") o.namespace = argv[++i];
    else if (a === "--out") o.out = argv[++i];
  }
  return o;
}

function generateGrid(type, block, size) {
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
      throw new Error(`unknown type: ${type} (house|box|tower|pyramid|fence|wall)`);
  }
}

async function main() {
  const o = parseArgs(process.argv);
  const grid = generateGrid(o.type, o.block, o.size);
  const structureId = `${o.type}_${o.size}`;
  const dp = createDatapack({ name: o.name, namespace: o.namespace, description: `mc-agent ${o.type} (${o.block})` });
  dp.addStructure(structureId, writeStructureNbt(grid));
  dp.addFunction({
    id: `build_${o.type}`,
    commands: [`structure load ${o.namespace}:${structureId} ~ ~ ~`, `say ${o.type} placed`],
  });
  const v = dp.validate();
  if (!v.valid) {
    console.error("INVALID: " + v.errors.join("; "));
    process.exit(1);
  }
  await mkdir(o.out, { recursive: true });
  const files = await dp.build(o.out);
  const manifest = join(o.out, "manifest.json");
  await writeFile(manifest, JSON.stringify(dp.toJSON(), null, 2));
  files.push(manifest);
  console.log(`generated ${o.type} (${o.block}, size ${o.size}) -> ${o.out}`);
  console.log(`load in-game: /function ${o.namespace}:build_${o.type}`);
  console.log(`files: ${files.length}`);
  for (const f of files) console.log("  " + f);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});

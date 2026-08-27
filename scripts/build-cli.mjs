import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  gridToMcfunction,
  writeStructureNbt,
  createBlockRegistry,
} from "../packages/core/dist/build/index.js";

function parseArgs(argv) {
  const out = { out: "out/build", size: 5, block: "minecraft:stone" };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--out") out.out = argv[++i];
    else if (argv[i] === "--size") out.size = parseInt(argv[++i], 10) || 5;
    else if (argv[i] === "--block") out.block = argv[++i];
  }
  return out;
}

// Build a hollow box of `block` at the given size (walls only, interior air).
function hollowBox(size, block) {
  const blocks = new Array(size * size * size).fill(null);
  const idx = (x, y, z) => (y * size + z) * size + x;
  for (let y = 0; y < size; y++) {
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const edge = x === 0 || y === 0 || z === 0 || x === size - 1 || y === size - 1 || z === size - 1;
        if (edge) blocks[idx(x, y, z)] = block;
      }
    }
  }
  const grid = { width: size, height: size, depth: size, blocks };
  return grid;
}

async function main() {
  const args = parseArgs(process.argv);
  const registry = createBlockRegistry();
  const grid = hollowBox(args.size, args.block);

  const { commands, violations } = gridToMcfunction(grid, { registry });
  if (violations.length) {
    console.error("BUILD VIOLATIONS: " + violations.map((v) => v.reason).join("; "));
    process.exit(1);
  }
  const nbt = writeStructureNbt(grid);
  await mkdir(args.out, { recursive: true });
  const mcPath = join(args.out, "structure.mcfunction");
  const nbtPath = join(args.out, "structure.nbt");
  await writeFile(mcPath, commands.join("\n") + "\n");
  await writeFile(nbtPath, nbt);

  console.log(`structure ${args.size}^3, block=${args.block}`);
  console.log(`mcfunction: ${commands.length} commands -> ${mcPath}`);
  console.log(`nbt: ${nbt.length} bytes -> ${nbtPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

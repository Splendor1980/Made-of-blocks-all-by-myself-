import { join } from "node:path";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { tool } from "@opencode-ai/plugin";
import { readStructureNbt } from "@mc-agent/core";
import datapackCreate from "./datapack_create";

export default tool({
  description:
    "Import an EXISTING Minecraft structure .nbt (Java structure-block format, gzip-aware), report its dimensions, " +
    "and optionally wrap it into a new datapack with a load function. Never writes into an existing save.",
  args: {
    path: tool.schema.string().describe("Path to the .nbt structure file, relative to project root."),
    id: tool.schema.string().optional().describe("Structure id inside the datapack (default: derived from filename)."),
    output: tool.schema.string().optional().describe("Output directory for a datapack; if omitted, only reports info."),
    name: tool.schema.string().optional().describe("Datapack folder name (default: imported_pack)."),
    namespace: tool.schema.string().optional().describe("Namespace (default: imported)."),
  },
  async execute(input, ctx) {
    const abs = join(ctx.worktree, input.path);
    const buf = await readFile(abs);
    const grid = readStructureNbt(buf);
    const blockCount = grid.blocks.filter(Boolean).length;
    const baseId = input.id ?? input.path.split(/[\\/]/).pop()!.replace(/\.nbt$/i, "");
    const id = baseId.replace(/[^a-z0-9_]/gi, "_").toLowerCase();

    if (!input.output) {
      return JSON.stringify({
        id,
        size: [grid.width, grid.height, grid.depth],
        blockCount,
        note: "pass `output` to wrap into a datapack",
      });
    }

    const nbtRel = join("out", `${id}.nbt`);
    await mkdir(join(ctx.worktree, "out"), { recursive: true });
    await writeFile(join(ctx.worktree, nbtRel), buf);

    const dpRes = JSON.parse(
      (await datapackCreate.execute(
        {
          name: input.name ?? "imported_pack",
          namespace: input.namespace ?? "imported",
          embeddedStructures: [{ id, nbtPath: nbtRel }],
          functions: [
            { id: `build_${id}`, commands: [`structure load ${input.namespace ?? "imported"}:${id} ~ ~ ~`, `say imported ${id}`] },
          ],
          output: input.output,
        },
        ctx,
      )) as string,
    );

    return JSON.stringify({
      id,
      size: [grid.width, grid.height, grid.depth],
      blockCount,
      datapack: dpRes,
      loadInGame: `/function ${input.namespace ?? "imported"}:build_${id}`,
    });
  },
});

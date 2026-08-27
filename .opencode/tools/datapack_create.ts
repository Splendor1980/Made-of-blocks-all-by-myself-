import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { tool } from "@opencode-ai/plugin";
import { createDatapack } from "@mc-agent/core";

export default tool({
  description:
    "Create a textureless Minecraft datapack (recipes, functions, advancements, " +
    "loot tables, structures) from a declarative spec. Functions are security-scanned.",
  args: {
    name: tool.schema.string().describe("Datapack folder name."),
    namespace: tool.schema.string().describe("Lowercase namespace, e.g. 'demo'."),
    description: tool.schema.string().optional(),
    recipes: tool.schema
      .array(tool.schema.any())
      .optional()
      .describe("Recipe specs (shaped/shapeless/stonecutter)."),
    functions: tool.schema
      .array(tool.schema.object({ id: tool.schema.string(), commands: tool.schema.array(tool.schema.string()) }))
      .optional()
      .describe("Functions to sanitize and write."),
    advancements: tool.schema
      .array(tool.schema.object({ id: tool.schema.string(), title: tool.schema.string(), description: tool.schema.string(), icon: tool.schema.string().optional(), trigger: tool.schema.string().optional() }))
      .optional(),
    loot: tool.schema
      .array(tool.schema.object({ id: tool.schema.string(), pools: tool.schema.array(tool.schema.object({ entries: tool.schema.array(tool.schema.string()), rolls: tool.schema.number().optional() })) }))
      .optional(),
    structures: tool.schema.array(tool.schema.string()).optional().describe("Structure ids (.nbt produced elsewhere)."),
    embeddedStructures: tool.schema
      .array(tool.schema.object({ id: tool.schema.string(), nbtPath: tool.schema.string() }))
      .optional()
      .describe("Embed real .nbt files (produced by build_nbt) into the pack as placeable structures."),
    output: tool.schema.string().describe("Output directory, relative to project root."),
  },
  async execute(input, ctx) {
    const dp = createDatapack({
      name: input.name,
      namespace: input.namespace,
      description: input.description,
    });
    for (const r of input.recipes ?? []) {
      if (r.type === "shaped") dp.addShapedRecipe(r);
      else if (r.type === "shapeless") dp.addShapelessRecipe(r);
      else if (r.type === "stonecutter") dp.addStonecutterRecipe(r);
    }
    for (const f of input.functions ?? []) dp.addFunction(f);
    for (const a of input.advancements ?? []) dp.addAdvancement(a);
    for (const l of input.loot ?? []) dp.addLootTable(l);
    for (const s of input.structures ?? []) dp.addStructureRef(s);
    for (const e of input.embeddedStructures ?? []) {
      const buf = await readFile(join(ctx.worktree, e.nbtPath));
      dp.addStructure(e.id, buf);
    }

    const v = dp.validate();
    if (!v.valid) return JSON.stringify({ valid: false, errors: v.errors });
    const files = await dp.build(join(ctx.worktree, input.output));
    return JSON.stringify({ valid: true, files: files.map((f) => f.replace(ctx.worktree, "").replace(/^[/\\]/, "")) });
  },
});

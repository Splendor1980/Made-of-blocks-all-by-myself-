import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { sanitizeFunction } from "../build/mcfunction.js";
import type { ScanViolation } from "../build/security.js";

const NS_RE = /^[a-z0-9._-]+$/;
const ID_RE = /^[a-z0-9._/-]+$/;

export interface DatapackMeta {
  name: string;
  namespace: string;
  description?: string;
  /** pack_format for the target game version (1.20.x = 15). */
  format?: number;
}

export interface DatapackValidation {
  valid: boolean;
  errors: string[];
}

type Json = Record<string, unknown>;

export class Datapack {
  readonly meta: DatapackMeta;
  private recipes: { path: string; json: Json }[] = [];
  private functions: { path: string; commands: string[]; violations: ScanViolation[] }[] = [];
  private advancements: { path: string; json: Json }[] = [];
  private lootTables: { path: string; json: Json }[] = [];
  private structures: { id: string; nbt: Buffer | null }[] = [];

  constructor(meta: DatapackMeta) {
    if (!NS_RE.test(meta.namespace)) {
      throw new Error(`Invalid namespace: ${meta.namespace}`);
    }
    this.meta = { format: 15, description: meta.name, ...meta };
  }

  private q(id: string): string {
    return id.includes(":") ? id : `${this.meta.namespace}:${id}`;
  }

  addShapedRecipe(opts: {
    id: string;
    pattern: string[];
    key: Record<string, string>;
    result: { item: string; count?: number };
  }): void {
    const keyJson: Record<string, Json> = {};
    for (const [k, v] of Object.entries(opts.key)) keyJson[k] = { item: v };
    this.recipes.push({
      path: opts.id,
      json: {
        type: "minecraft:crafting_shaped",
        pattern: opts.pattern,
        key: keyJson,
        result: { item: opts.result.item, count: opts.result.count ?? 1 },
      },
    });
  }

  addShapelessRecipe(opts: { id: string; ingredients: string[]; result: { item: string; count?: number } }): void {
    this.recipes.push({
      path: opts.id,
      json: {
        type: "minecraft:crafting_shapeless",
        ingredients: opts.ingredients.map((i) => ({ item: i })),
        result: { item: opts.result.item, count: opts.result.count ?? 1 },
      },
    });
  }

  addStonecutterRecipe(opts: { id: string; input: string; result: { item: string; count?: number } }): void {
    this.recipes.push({
      path: opts.id,
      json: {
        type: "minecraft:stonecutting",
        ingredient: { item: opts.input },
        result: opts.result.item,
        count: opts.result.count ?? 1,
      },
    });
  }

  addFunction(opts: { id: string; commands: string[] }): ScanViolation[] {
    const { commands, violations } = sanitizeFunction(opts.commands);
    this.functions.push({ path: opts.id, commands, violations });
    return violations;
  }

  addAdvancement(opts: { id: string; title: string; description: string; icon?: string; trigger?: string }): void {
    const trigger = opts.trigger ?? "minecraft:tick";
    this.advancements.push({
      path: opts.id,
      json: {
        display: {
          title: opts.title,
          description: opts.description,
          icon: { item: opts.icon ?? "minecraft:paper" },
        },
        criteria: { trigger: { trigger } },
      },
    });
  }

  addLootTable(opts: { id: string; pools: { entries: string[]; rolls?: number }[] }): void {
    this.lootTables.push({
      path: opts.id,
      json: {
        pools: opts.pools.map((p) => ({
          rolls: p.rolls ?? 1,
          entries: p.entries.map((e) => ({ type: "minecraft:item", name: e })),
        })),
      },
    });
  }

  /** Registers a reference to a structure produced by the build core (.nbt). */
  addStructureRef(id: string): void {
    if (!ID_RE.test(id)) throw new Error(`Invalid structure id: ${id}`);
    this.structures.push({ id, nbt: null });
  }

  /** Embeds a real structure `.nbt` (e.g. from `writeStructureNbt`) into the pack. */
  addStructure(id: string, nbt: Buffer): void {
    if (!ID_RE.test(id)) throw new Error(`Invalid structure id: ${id}`);
    if (!Buffer.isBuffer(nbt) || nbt.length === 0) throw new Error(`Invalid structure nbt: ${id}`);
    this.structures.push({ id, nbt });
  }

  validate(): DatapackValidation {
    const errors: string[] = [];
    if (typeof this.meta.format !== "number") errors.push("pack_format must be a number");
    for (const f of this.functions) {
      if (f.violations.length) errors.push(`function ${f.path}: ${f.violations.map((v) => v.reason).join("; ")}`);
    }
    for (const r of [...this.recipes, ...this.advancements, ...this.lootTables]) {
      if (!ID_RE.test(r.path)) errors.push(`bad id: ${r.path}`);
    }
    return { valid: errors.length === 0, errors };
  }

  toJSON(): Json {
    return {
      meta: this.meta,
      recipes: this.recipes.map((r) => ({ id: this.q(r.path), ...r.json })),
      functions: this.functions.map((f) => ({ id: this.q(f.path), commands: f.commands })),
      advancements: this.advancements.map((a) => ({ id: this.q(a.path), ...a.json })),
      lootTables: this.lootTables.map((l) => ({ id: this.q(l.path), ...l.json })),
      structures: this.structures.map((s) => `${this.meta.namespace}:${s.id}`),
    };
  }

  async build(outputDir: string): Promise<string[]> {
    const root = join(outputDir, this.meta.name);
    const data = join(root, "data", this.meta.namespace);
    const written: string[] = [];
    const put = async (rel: string, content: string | Buffer) => {
      const p = join(root, rel);
      await mkdir(join(p, ".."), { recursive: true });
      await writeFile(p, content);
      written.push(p);
    };
    await put(
      "pack.mcmeta",
      JSON.stringify(
        { pack: { pack_format: this.meta.format, description: this.meta.description ?? this.meta.name } },
        null,
        2,
      ),
    );
    for (const r of this.recipes) await put(`data/${this.meta.namespace}/recipes/${r.path}.json`, JSON.stringify(r.json, null, 2));
    for (const f of this.functions) await put(`data/${this.meta.namespace}/functions/${f.path}.mcfunction`, f.commands.join("\n") + "\n");
    for (const a of this.advancements) await put(`data/${this.meta.namespace}/advancements/${a.path}.json`, JSON.stringify(a.json, null, 2));
    for (const l of this.lootTables) await put(`data/${this.meta.namespace}/loot_tables/${l.path}.json`, JSON.stringify(l.json, null, 2));
    for (const s of this.structures) {
      if (s.nbt) await put(`data/${this.meta.namespace}/structures/${s.id}.nbt`, s.nbt);
      else await put(`data/${this.meta.namespace}/structures/${s.id}.nbt.placeholder`, "");
    }
    return written;
  }
}

export function createDatapack(meta: DatapackMeta): Datapack {
  return new Datapack(meta);
}

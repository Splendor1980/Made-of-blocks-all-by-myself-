import { createBlockRegistry, type BlockRegistry } from "./blocks.js";
import { scanCommands, scanLine, type ScanViolation } from "./security.js";
import { validateFillLine } from "./fillparse.js";

export interface VoxelGrid {
  width: number;
  height: number;
  depth: number;
  /** Length = width*height*depth, row-major (x fastest, then z, then y). null/"" = air. */
  blocks: (string | null)[];
}

export interface McfunctionOptions {
  origin?: [number, number, number];
  registry?: BlockRegistry;
}

export interface McfunctionResult {
  commands: string[];
  violations: ScanViolation[];
}

function idx(g: VoxelGrid, x: number, y: number, z: number): number {
  return (y * g.depth + z) * g.width + x;
}

/**
 * Converts a voxel grid into a minimal set of `fill`/`setblock` commands using
 * run-length encoding along X. Every emitted block id is validated against the
 * registry; invalid ids are skipped and reported. Output is then scanned for
 * denied commands/command-blocks.
 */
export function gridToMcfunction(
  grid: VoxelGrid,
  opts: McfunctionOptions = {},
): McfunctionResult {
  const [ox, oy, oz] = opts.origin ?? [0, 0, 0];
  const reg = opts.registry ?? createBlockRegistry();
  const commands: string[] = [];
  const violations: ScanViolation[] = [];

  for (let y = 0; y < grid.height; y++) {
    for (let z = 0; z < grid.depth; z++) {
      let runStart = -1;
      let runBlock: string | null = null;
      const flush = (endX: number) => {
        if (runBlock == null) return;
        const norm = reg.normalize(runBlock);
        if (!norm) {
          violations.push({
            line: commands.length + 1,
            command: runBlock,
            reason: `unknown block id: ${runBlock}`,
          });
          runStart = -1;
          runBlock = null;
          return;
        }
        const x0 = ox + runStart;
        const x1 = ox + endX;
        const wy = oy + y;
        const wz = oz + z;
        if (x0 === x1) {
          commands.push(`setblock ${x0} ${wy} ${wz} ${norm}`);
        } else {
          commands.push(`fill ${x0} ${wy} ${wz} ${x1} ${wy} ${wz} ${norm}`);
        }
        runStart = -1;
        runBlock = null;
      };
      for (let x = 0; x < grid.width; x++) {
        const b = grid.blocks[idx(grid, x, y, z)];
        if (b && b !== "air" && b !== "") {
          if (runBlock === b) continue;
          if (runBlock !== null) flush(x - 1);
          runStart = x;
          runBlock = b;
        } else {
          if (runBlock !== null) flush(x - 1);
        }
      }
      flush(grid.width - 1);
    }
  }

  violations.push(...scanCommands(commands));
  return { commands, violations };
}

/** Sanitizes an arbitrary list of function commands. */
export function sanitizeFunction(
  lines: string[],
  registry?: BlockRegistry,
): { commands: string[]; violations: ScanViolation[] } {
  const reg = registry ?? createBlockRegistry();
  const violations = scanCommands(lines);
  lines.forEach((l, i) => {
    const fillErr = validateFillLine(l);
    if (fillErr && scanLine(l, 0) === null) {
      violations.push({ line: i + 1, command: l.trim(), reason: `fill: ${fillErr}` });
    }
  });
  const commands = lines.filter((l) => {
    const v = scanLine(l, 0);
    return !v;
  });
  return { commands, violations };
}

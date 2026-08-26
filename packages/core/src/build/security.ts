export interface ScanViolation {
  line: number;
  command: string;
  reason: string;
}

/** Commands that change world/rules, permissions, or chain execution. */
const DENY_KEYWORDS = new Set([
  "op",
  "deop",
  "ban",
  "ban-ip",
  "pardon",
  "pardon-ip",
  "kick",
  "stop",
  "execute",
  "function",
  "gamerule",
  "gamemode",
  "reload",
]);

const COMMAND_BLOCK_RE =
  /command_block|chain_command_block|repeating_command_block/;

export function scanLine(line: string, lineNumber: number): ScanViolation | null {
  const raw = line.trim().replace(/^\//, "");
  if (!raw || raw.startsWith("#")) return null;
  const head = raw.split(/\s+/)[0].toLowerCase().replace(/^minecraft:/, "");
  if (DENY_KEYWORDS.has(head)) {
    return { line: lineNumber, command: raw, reason: `denied command: ${head}` };
  }
  if (COMMAND_BLOCK_RE.test(raw)) {
    return { line: 1, command: raw, reason: "command blocks are not allowed" };
  }
  return null;
}

export function scanCommands(lines: string[]): ScanViolation[] {
  const out: ScanViolation[] = [];
  lines.forEach((l, i) => {
    const v = scanLine(l, i + 1);
    if (v) out.push(v);
  });
  return out;
}

import { describe, it, expect } from "vitest";
import { emptyState, recordLaunch, recordPng, gateStatus } from "./metricsCore.js";

function day(n: number) {
  // deterministic dates, 1 day apart
  return new Date(2026, 0, 1 + n, 12, 0, 0);
}

describe("metricsCore", () => {
  it("counts launches and distinct return days", () => {
    let s = emptyState();
    s = recordLaunch(s, day(0));
    s = recordLaunch(s, day(0)); // same day, no new return
    s = recordLaunch(s, day(1)); // new day -> return
    s = recordLaunch(s, day(2)); // new day -> return
    expect(s.launches).toBe(4);
    expect(s.returns).toBe(2);
    expect(s.days.length).toBe(3);
  });

  it("counts png exports", () => {
    let s = emptyState();
    s = recordPng(s);
    s = recordPng(s);
    expect(s.png).toBe(2);
  });

  it("gate passes only when all thresholds met", () => {
    let s = emptyState();
    for (let i = 0; i < 25; i++) s = recordLaunch(s, day(i)); // 25 launches, 25 distinct days -> 24 returns
    for (let i = 0; i < 12; i++) s = recordPng(s); // 12 png
    const g = gateStatus(s);
    expect(g.passed).toBe(true);
    expect(g.launches).toBe(25);
    expect(g.png).toBe(12);
    expect(g.returns).toBe(24);
  });

  it("gate fails below thresholds", () => {
    const s = recordLaunch(emptyState(), day(0));
    expect(gateStatus(s).passed).toBe(false);
  });
});

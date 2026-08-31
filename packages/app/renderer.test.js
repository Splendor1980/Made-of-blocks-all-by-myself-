// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const fakeCtx = { imageSmoothingEnabled: false, clearRect() {}, drawImage() {} };
HTMLCanvasElement.prototype.getContext = () => fakeCtx;
global.alert = vi.fn();

function makeApi() {
  return {
    listTemplates: vi.fn(async () => [
      { id: "knight", displayName: "Knight" },
      { id: "mage", displayName: "Mage" },
      { id: "robot", displayName: "Robot" },
    ]),
    recolorTemplate: vi.fn(async () => "data:image/png;base64,AAA"),
    importSkin: vi.fn(async () => ({ model: "classic", dataUrl: "data:image/png;base64,BBB" })),
    getMetrics: vi.fn(async () => ({ launches: 20, png: 2, returns: 1 })),
    getGateStatus: vi.fn(async () => ({
      launches: 20, png: 2, returns: 1, passed: false,
      thresholds: { launches: 20, png: 10, returns: 5 },
    })),
    export: vi.fn(async () => ({ ok: true, path: "x.png" })),
    saveProject: vi.fn(async () => ({ ok: true, path: "p.mcskin.json" })),
    previewWorld: vi.fn(async () => ({ dataUrl: "data:image/png;base64,PRV" })),
    previewImport: vi.fn(async () => ({ dataUrl: "data:image/png;base64,IMP", size: [3, 3, 3], blockCount: 5 })),
    importNbt: vi.fn(async () => ({
      id: "castle", blockCount: 5, command: "/function imp:build_castle",
      files: ["data/imp/structures/castle.nbt"], outDir: "/out",
    })),
    generateWorld: vi.fn(async () => ({
      command: "/function genmod:build_house", files: ["pack.mcmeta"], outDir: "/out",
    })),
    openPath: vi.fn(async () => ({ ok: true })),
    paintSkin: vi.fn(async (url) => url),
    tintSkin: vi.fn(async (url) => url),
  };
}

let api;

beforeAll(async () => {
  api = makeApi();
  window.mcApi = api;
  const html = readFileSync(join(process.cwd(), "packages/app/index.html"), "utf8");
  const body = html.match(/<body>([\s\S]*?)<\/body>/)[1].replace(/<script[\s\S]*?<\/script>/g, "");
  document.body.innerHTML = body;
  window.FileReader = class {
    readAsDataURL() {
      this.result = "data:application/octet-stream;base64,SU5CVA==";
      if (this.onload) this.onload();
    }
  };
  await import("./renderer.js");
  await new Promise((r) => setTimeout(r, 100));
});

describe("Skin Studio renderer wiring", () => {
  it("renders the 3 built-in templates", () => {
    expect(document.getElementById("templates").children.length).toBe(3);
  });
  it("renders the idea cards + How-to-wear", () => {
    expect(document.getElementById("ideas").children.length).toBe(7); // 6 ideas + evil card
    expect(document.querySelector("details").textContent).toMatch(/How to wear/i);
  });
  it("idea card click applies template and tints via IPC", async () => {
    const first = document.querySelector(".idea button");
    first.click();
    await new Promise((r) => setTimeout(r, 40));
    expect(api.recolorTemplate).toHaveBeenCalled();
    expect(api.tintSkin).toHaveBeenCalled();
  });
  it("shows live metrics", () => {
    expect(document.getElementById("metrics").textContent).toContain("launches: 20");
  });
  it("wires the Gate 0 status text", () => {
    expect(document.getElementById("worldsGate").textContent).toContain("Gate 0");
  });
  it("shows a honest return-nudge while the gate is not passed", () => {
    expect(document.getElementById("worldsGateShift").textContent).toMatch(/вернётесь/);
  });
  it("preset click triggers generateWorld with parsed args", () => {
    document.querySelector('.preset[data-type="house"]').click();
    expect(api.generateWorld).toHaveBeenCalled();
    expect(api.generateWorld.mock.calls[0][0].type).toBe("house");
  });
  it("export button calls api.export", () => {
    document.getElementById("export").click();
    expect(api.export).toHaveBeenCalled();
  });
  it("save project builds a .mcskin.json blob", () => {
    document.getElementById("saveProject").click();
    expect(api.saveProject).toHaveBeenCalled();
    const dataUrl = api.saveProject.mock.calls[0][0];
    expect(dataUrl).toContain("data:application/json;base64,");
    const json = JSON.parse(atob(dataUrl.split(",")[1]));
    expect(json.app).toBe("mc-agent-skin");
    expect(json.current).toBeTruthy();
  });
  it("import .nbt flow calls previewImport then importNbt", async () => {
    const input = document.getElementById("worldImport");
    const file = new File(["nbt-bytes"], "castle.nbt");
    Object.defineProperty(input, "files", { value: [file], configurable: true });
    input.dispatchEvent(new Event("change"));
    await new Promise((r) => setTimeout(r, 60));
    expect(api.previewImport).toHaveBeenCalled();
    document.getElementById("worldImportBtn").click();
    await new Promise((r) => setTimeout(r, 60));
    expect(api.importNbt).toHaveBeenCalled();
    expect(document.getElementById("worldImportInfo").textContent).toContain("blocks");
  });
});

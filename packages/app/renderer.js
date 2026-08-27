const api = window.mcApi;

const PARTS = [
  { key: "head", label: "Head" },
  { key: "torso", label: "Torso" },
  { key: "rightArm", label: "Right Arm" },
  { key: "leftArm", label: "Left Arm" },
  { key: "rightLeg", label: "Right Leg" },
  { key: "leftLeg", label: "Left Leg" },
];

let current = { templateId: null, colors: {}, imported: null, skinUrl: null };
let viewer = null;
let using3D = true;
let editorCanvas = null;
let editorCtx = null;
let brushPart = "head";
let brushColor = "#ff4444";
let brushSize = 1;
let drawing = false;
const SCALE = 4;

function initViewer() {
  const canvas = document.getElementById("preview");
  try {
    if (!window.skinview3d) throw new Error("skinview3d bundle not loaded");
    viewer = new window.skinview3d.SkinViewer({ canvas, width: 320, height: 420 });
    viewer.animation = new window.skinview3d.IdleAnimation();
    viewer.controls.enableRotate = true;
    viewer.controls.enableZoom = false;
    console.log("3D preview ready");
  } catch (e) {
    using3D = false;
    const img = document.createElement("img");
    img.id = "preview";
    img.className = "preview";
    canvas.replaceWith(img);
    console.warn("3D preview unavailable, falling back to 2D:", e.message);
  }
}

function drawFlat(url) {
  if (!editorCanvas) return;
  const img = new Image();
  img.onload = () => {
    editorCtx.clearRect(0, 0, editorCanvas.width, editorCanvas.height);
    editorCtx.drawImage(img, 0, 0, 64, 64, 0, 0, editorCanvas.width, editorCanvas.height);
  };
  img.src = url;
}

function setPreview(url) {
  current.skinUrl = url;
  drawFlat(url);
  if (!using3D || !viewer) {
    const el = document.getElementById("preview");
    if (el) el.src = url;
    return;
  }
  viewer.loadSkin(url).catch((err) => console.warn("loadSkin failed:", err));
}

async function recolor() {
  if (current.imported) return; // imported skins use direct edit flow (out of scope for stub)
  if (!current.templateId) return;
  const url = await api.recolorTemplate(current.templateId, current.colors, null, null);
  setPreview(url);
}

async function selectTemplate(id) {
  current = { templateId: id, colors: {}, imported: null };
  document.getElementById("templateName").textContent = id;
  // reset color pickers to template default slots
  const defaults = await api.recolorTemplate(id, {}, null, null);
  setPreview(defaults);
}

function buildEditor() {
  editorCanvas = document.getElementById("editor");
  editorCtx = editorCanvas.getContext("2d");
  editorCtx.imageSmoothingEnabled = false;

  const parts2 = document.getElementById("parts2");
  for (const p of PARTS) {
    const lab = document.createElement("label");
    lab.className = "row";
    const radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "brushPart";
    radio.value = p.key;
    radio.checked = p.key === brushPart;
    radio.onchange = () => { brushPart = p.key; };
    const span = document.createElement("span");
    span.textContent = p.label;
    lab.append(radio, span);
    parts2.appendChild(lab);
  }

  const colorInput = document.getElementById("brushColor");
  brushColor = colorInput.value;
  colorInput.oninput = () => { brushColor = colorInput.value; };
  const sizeInput = document.getElementById("brushSize");
  sizeInput.oninput = () => { brushSize = parseInt(sizeInput.value, 10) || 1; };

  const paintAt = (e) => {
    if (!current.skinUrl) return;
    const rect = editorCanvas.getBoundingClientRect();
    const ox = (e.clientX - rect.left) * (editorCanvas.width / rect.width);
    const oy = (e.clientY - rect.top) * (editorCanvas.height / rect.height);
    const px = Math.floor(ox / SCALE);
    const py = Math.floor(oy / SCALE);
    if (px < 0 || py < 0 || px >= 64 || py >= 64) return;
    api.paintSkin(current.skinUrl, brushPart, px, py, brushColor, brushSize)
      .then((res) => setPreview(res))
      .catch((err) => console.warn("paintSkin failed:", err));
  };

  editorCanvas.addEventListener("pointerdown", (e) => {
    drawing = true;
    try { editorCanvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    paintAt(e);
  });
  editorCanvas.addEventListener("pointermove", (e) => { if (drawing) paintAt(e); });
  editorCanvas.addEventListener("pointerup", () => { drawing = false; });
  editorCanvas.addEventListener("pointerleave", () => { drawing = false; });
}

async function init() {
  initViewer();
  const templates = await api.listTemplates();
  const host = document.getElementById("templates");
  host.innerHTML = "";
  if (templates.length === 0) {
    host.textContent = "No templates in repo (add assets/templates/*.slots.json). Use Import.";
  }
  for (const t of templates) {
    const card = document.createElement("button");
    card.className = "card";
    card.textContent = t.displayName;
    card.onclick = () => {
      [...host.children].forEach((c) => c.classList.remove("sel"));
      card.classList.add("sel");
      selectTemplate(t.id);
    };
    host.appendChild(card);
  }
  if (templates[0]) {
    host.firstChild.classList.add("sel");
    await selectTemplate(templates[0].id);
  }

  // part color controls
  const parts = document.getElementById("parts");
  for (const p of PARTS) {
    const row = document.createElement("div");
    row.className = "row";
    const label = document.createElement("span");
    label.textContent = p.label;
    const input = document.createElement("input");
    input.type = "color";
    input.value = "#8b5a2b";
    input.oninput = async () => {
      current.colors[p.key] = input.value;
      const url = await api.recolorTemplate(current.templateId, current.colors, p.key, input.value);
      setPreview(url);
    };
    row.append(label, input);
    parts.appendChild(row);
  }

  document.getElementById("import").onchange = async (e) => {
    const errEl = document.getElementById("importError");
    errEl.textContent = "";
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await new Promise((r) => {
      const fr = new FileReader();
      fr.onload = () => r(fr.result);
      fr.readAsDataURL(file);
    });
    try {
      const res = await api.importSkin(dataUrl);
      current = { templateId: null, colors: {}, imported: res.dataUrl };
      document.getElementById("templateName").textContent = `Imported (${res.model})`;
      setPreview(res.dataUrl);
    } catch (err) {
      errEl.textContent = "Import failed: " + (err && err.message ? err.message : err);
    }
  };

  document.getElementById("export").onclick = async () => {
    const url = current.skinUrl || document.getElementById("preview").src;
    const res = await api.export(url);
    if (res.ok) alert("Saved: " + res.path);
  };

  buildEditor();

  const m = await api.getMetrics();
  document.getElementById("metrics").textContent =
    `launches: ${m.launches} · png: ${m.png} · returns: ${m.returns}`;

  initWorlds();
}

async function initWorlds() {
  const lockedEl = document.getElementById("worldsLocked");
  const controls = document.getElementById("worldsControls");
  lockedEl.style.display = "none";
  controls.style.display = "block";
  const gate = await api.getGateStatus().catch(() => null);
  if (gate) {
    document.getElementById("worldsGate") &&
      (document.getElementById("worldsGate").textContent =
        `Gate 0: launches ${gate.launches}/${gate.thresholds.launches}, png ${gate.png}/${gate.thresholds.png}, returns ${gate.returns}/${gate.thresholds.returns}`);
  }
  document.getElementById("worldGen").onclick = async () => {
    const type = document.getElementById("worldType").value;
    const block = document.getElementById("worldBlock").value;
    const size = parseInt(document.getElementById("worldSize").value, 10) || 5;
    const out = document.getElementById("worldOut").value;
    const res = await api
      .generateWorld({ type, block, size, out })
      .catch((e) => ({ error: (e && e.message) || String(e) }));
    const el = document.getElementById("worldResult");
    if (res.error) {
      el.textContent = "Error: " + res.error;
      return;
    }
    el.textContent =
      `Generated ${type} (${block}, size ${size})\n` +
      `In-game: ${res.command}\n` +
      `Drop folder into saves/<world>/datapacks/ :\n` +
      res.files.map((f) => "  " + f).join("\n");
  };
}

init();

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
  if (window.__markEvil) window.__markEvil();
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
  buildOnboarding();
  buildIdeas();
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
      if (window.__markEvil) window.__markEvil();
    } catch (err) {
      errEl.textContent = "Import failed: " + (err && err.message ? err.message : err);
    }
  };

  document.getElementById("export").onclick = async () => {
    const url = current.skinUrl || document.getElementById("preview").src;
    const res = await api.export(url);
    if (res.ok) alert("Saved: " + res.path);
  };

  document.getElementById("saveProject").onclick = async () => {
    const project = { version: 1, app: "mc-agent-skin", current };
    const json = JSON.stringify(project);
    const b64 = btoa(unescape(encodeURIComponent(json)));
    const res = await api.saveProject(
      `data:application/json;base64,${b64}`,
      `skin-project-${Date.now()}.mcskin.json`,
    );
    if (res.ok) alert("Project saved: " + res.path);
  };

  const loadInput = document.getElementById("loadProjectFile");
  document.getElementById("loadProject").onclick = () => loadInput.click();
  loadInput.onchange = async () => {
    const file = loadInput.files && loadInput.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const proj = JSON.parse(text);
      if (!proj.current || !proj.current.skinUrl) throw new Error("not a skin project file");
      current = proj.current;
      document.getElementById("templateName").textContent = current.templateId || "Loaded project";
      setPreview(current.skinUrl);
    } catch (err) {
      alert("Load failed: " + (err && err.message ? err.message : err));
    }
    loadInput.value = "";
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
  document.getElementById("worldGen").onclick = () => generateWorld();

  document.querySelectorAll(".preset").forEach((btn) => {
    btn.onclick = () => {
      document.getElementById("worldType").value = btn.dataset.type;
      document.getElementById("worldBlock").value = btn.dataset.block;
      document.getElementById("worldSize").value = btn.dataset.size;
      generateWorld();
    };
  });

  const updatePreview = () => {
    const type = document.getElementById("worldType").value;
    const block = document.getElementById("worldBlock").value;
    const size = parseInt(document.getElementById("worldSize").value, 10) || 5;
    api.previewWorld({ type, block, size }).then((r) => {
      if (r && r.dataUrl) document.getElementById("worldPreview").src = r.dataUrl;
    });
  };
  ["worldType", "worldBlock", "worldSize"].forEach((id) =>
    document.getElementById(id).addEventListener("change", updatePreview),
  );
  updatePreview();

  let importData = null;
  let importId = null;
  const importInput = document.getElementById("worldImport");
  importInput.onchange = async () => {
    const file = importInput.files && importInput.files[0];
    const info = document.getElementById("worldImportInfo");
    const btn = document.getElementById("worldImportBtn");
    if (!file) return;
    importId = file.name.replace(/\.nbt$/i, "");
    const dataUrl = await new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result);
      fr.readAsDataURL(file);
    });
    importData = dataUrl.replace(/^data:.*;base64,/, "");
    info.textContent = "Reading…";
    const r = await api.previewImport({ data: importData }).catch((e) => ({ error: e.message }));
    if (r.error) {
      info.textContent = "Import failed: " + r.error;
      btn.style.display = "none";
      return;
    }
    document.getElementById("worldPreview").src = r.dataUrl;
    info.textContent = `Size ${r.size.join("×")}, ${r.blockCount} blocks`;
    btn.style.display = "inline-block";
  };
  document.getElementById("worldImportBtn").onclick = async () => {
    const status = document.getElementById("worldStatus");
    const el = document.getElementById("worldResult");
    if (!importData) return;
    status.textContent = "Importing…";
    const res = await api
      .importNbt({ data: importData, id: importId, out: "out/imported" })
      .catch((e) => ({ error: (e && e.message) || String(e) }));
    if (res.error) {
      status.textContent = "";
      el.textContent = "Error: " + res.error;
      return;
    }
    status.textContent = "Imported.";
    el.textContent =
      `Imported ${res.id} (${res.blockCount} blocks)\n` +
      `In-game: ${res.command}\n` +
      `Drop folder into saves/<world>/datapacks/ :\n` +
      res.files.map((f) => "  " + f).join("\n");
    const openBtn = document.getElementById("worldOpen");
    openBtn.style.display = "inline-block";
    openBtn.onclick = () => api.openPath(res.outDir);
    const list = document.getElementById("worldList");
    const item = document.createElement("div");
    item.textContent = `• imported ${res.id} → ${res.command}`;
    list.prepend(item);
    document.getElementById("worldZip").style.display = "inline-block";
    const importArgs = { data: importData, id: importId, out: "out/imported" };
    wireZipButton(() => api.importNbt({ ...importArgs, zip: true }));
  };
}

function wireZipButton(maker) {
  document.getElementById("worldZip").onclick = async () => {
    const status = document.getElementById("worldStatus");
    const el = document.getElementById("worldResult");
    status.textContent = "Packing zip…";
    const res = await maker()
      .catch((e) => ({ error: (e && e.message) || String(e) }));
    if (res.error) {
      status.textContent = "";
      el.textContent = "Error: " + res.error;
      return;
    }
    const openBtn = document.getElementById("worldOpen");
    openBtn.style.display = "inline-block";
    openBtn.onclick = () => api.openPath(res.outDir);
    el.textContent =
      `Packed .zip:\n${res.zipPath}\n` +
      `Copy the .zip into saves/<world>/datapacks/ (or unzip into the datapacks folder).`;
  };
}

async function generateWorld() {
  const type = document.getElementById("worldType").value;
  const block = document.getElementById("worldBlock").value;
  const size = parseInt(document.getElementById("worldSize").value, 10) || 5;
  const out = document.getElementById("worldOut").value;
  const status = document.getElementById("worldStatus");
  const el = document.getElementById("worldResult");
  const openBtn = document.getElementById("worldOpen");
  status.textContent = "Generating…";
  openBtn.style.display = "none";
  const res = await api
    .generateWorld({ type, block, size, out })
    .catch((e) => ({ error: (e && e.message) || String(e) }));
  if (res.error) {
    status.textContent = "";
    el.textContent = "Error: " + res.error;
    return;
  }
  status.textContent = "Done.";
  const pv = await api.previewWorld({ type, block, size }).catch(() => null);
  if (pv && pv.dataUrl) document.getElementById("worldPreview").src = pv.dataUrl;
  el.textContent =
    `Generated ${type} (${block}, size ${size})\n` +
    `In-game: ${res.command}\n` +
    `Drop folder into saves/<world>/datapacks/ :\n` +
    res.files.map((f) => "  " + f).join("\n");
  openBtn.style.display = "inline-block";
  openBtn.onclick = () => api.openPath(res.outDir);
  const list = document.getElementById("worldList");
  const item = document.createElement("div");
  item.textContent = `• ${type} (${size}) → ${res.command}`;
  list.prepend(item);
  document.getElementById("worldZip").style.display = "inline-block";
  wireZipButton(() => api.generateWorld({ type, block, size, out, zip: true }));
}

const IDEAS = [
  { id: "mage", color: "#7fdbff", label: "Ice Mage" },
  { id: "robot", color: "#8a93a0", label: "Steel Robot" },
  { id: "knight", color: "#e6c63c", label: "Sun Knight" },
  { id: "mage", color: "#1f6fdb", label: "Ocean Explorer" },
  { id: "knight", color: "#3aa64a", label: "Forest Spirit" },
  { id: "robot", color: "#2b2b33", label: "Neon Shadow" },
];

function buildOnboarding() {
  const el = document.getElementById("onboarding");
  const consented = (cb) => cb && cb.checked;
  const okBtn = document.getElementById("onboardingOk");
  const skipBtn = document.getElementById("onboardingSkip");
  const consent = document.getElementById("ageConsent");
  const finish = () => {
    el.classList.add("hidden");
    localStorage.setItem("mc_agent_onboarding_done", "1");
  };
  if (localStorage.getItem("mc_agent_onboarding_done") === "1") {
    el.classList.add("hidden");
    return;
  }
  consent.onchange = () => { okBtn.disabled = !consent.checked; };
  okBtn.onclick = finish;
  skipBtn.onclick = finish;
}

async function themedPreview(id, color) {
  const base = await api.recolorTemplate(id, {}, null, null);
  return api.tintSkin(base, color, 0.45);
}

async function applyIdea(id, color) {
  await selectTemplate(id);
  const themed = await themedPreview(id, color);
  setPreview(themed);
  current.skinUrl = themed;
}

function buildIdeas() {
  const host = document.getElementById("ideas");
  host.innerHTML = "";
  const cards = [];
  for (const idea of IDEAS) {
    const wrap = document.createElement("div");
    wrap.className = "idea";
    const img = document.createElement("img");
    img.alt = idea.label;
    themedPreview(idea.id, idea.color).then((url) => { img.src = url; }).catch(() => {});
    const btn = document.createElement("button");
    btn.textContent = idea.label;
    btn.onclick = () => applyIdea(idea.id, idea.color);
    wrap.append(img, btn);
    host.appendChild(wrap);
  }
  // Evil version of MY skin — works on the current template OR an imported skin.
  const evil = document.createElement("div");
  evil.className = "idea";
  const evilBtn = document.createElement("button");
  evilBtn.textContent = "Evil version of MY skin";
  const doEvil = async () => {
    if (!current.skinUrl) { alert("Load a skin first (pick a template or import a PNG)."); return; }
    const tinted = await api.tintSkin(current.skinUrl, "#5a0f1a", 0.55);
    setPreview(tinted);
    current.skinUrl = tinted;
  };
  evilBtn.onclick = doEvil;
  const mark = () => {
    if (!current.skinUrl) { evil.classList.add("disabled"); evilBtn.disabled = true; }
    else { evil.classList.remove("disabled"); evilBtn.disabled = false; }
  };
  mark();
  window.__markEvil = mark;
  evil.append(evilBtn);
  host.appendChild(evil);
}

init();

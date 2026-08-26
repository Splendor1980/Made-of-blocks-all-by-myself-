const api = window.mcApi;

const PARTS = [
  { key: "head", label: "Head" },
  { key: "torso", label: "Torso" },
  { key: "rightArm", label: "Right Arm" },
  { key: "leftArm", label: "Left Arm" },
  { key: "rightLeg", label: "Right Leg" },
  { key: "leftLeg", label: "Left Leg" },
];

let current = { templateId: null, colors: {}, imported: null };

function setPreview(url) {
  document.getElementById("preview").src = url;
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

async function init() {
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
    const file = e.target.files[0];
    if (!file) return;
    const dataUrl = await new Promise((r) => {
      const fr = new FileReader();
      fr.onload = () => r(fr.result);
      fr.readAsDataURL(file);
    });
    const res = await api.importSkin(dataUrl);
    current = { templateId: null, colors: {}, imported: res.dataUrl };
    document.getElementById("templateName").textContent = `Imported (${res.model})`;
    setPreview(res.dataUrl);
  };

  document.getElementById("export").onclick = async () => {
    const url = document.getElementById("preview").src;
    const res = await api.export(url);
    if (res.ok) alert("Saved: " + res.path);
  };

  const m = await api.getMetrics();
  document.getElementById("metrics").textContent =
    `launches: ${m.launches} · png: ${m.png} · returns: ${m.returns}`;
}

init();

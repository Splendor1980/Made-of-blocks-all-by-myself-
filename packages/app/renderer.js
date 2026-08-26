const api = window.mcApi;
let selectedPart = null;

async function refresh() {
  const url = await api.recolor(selectedPart || "head", "#000000");
  document.getElementById("preview").src = url;
}

async function init() {
  const parts = await api.getParts();
  const host = document.getElementById("parts");
  for (const p of parts) {
    const b = document.createElement("button");
    b.textContent = p;
    b.className = "part";
    b.onclick = () => {
      selectedPart = p;
      [...host.children].forEach((c) => (c.style.outline = "none"));
      b.style.outline = "2px solid #5ad";
      refresh();
    };
    host.appendChild(b);
  }
  if (parts[0]) {
    selectedPart = parts[0];
    host.firstChild.style.outline = "2px solid #5ad";
  }

  document.getElementById("apply").onclick = async () => {
    const color = document.getElementById("color").value;
    await api.recolor(selectedPart, color);
    refresh();
  };
  document.getElementById("reset").onclick = async () => {
    await api.reset();
    refresh();
  };
  document.getElementById("export").onclick = async () => {
    const url = document.getElementById("preview").src;
    const res = await api.export(url);
    if (res.ok) alert("Saved: " + res.path);
  };

  const sc = await api.sidecarStatus();
  document.getElementById("sidecar").textContent = sc.state;
  refresh();
}

init();

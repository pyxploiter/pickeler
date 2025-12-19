const vscode = acquireVsCodeApi();

const output = document.getElementById("output");
const button = document.getElementById("full");
const header = document.getElementById("header");
const subtitle = document.getElementById("subtitle");

button.onclick = () => {
  vscode.postMessage({ type: "requestFull" });
};

// -------------------------
// UI state helpers
// -------------------------
function setSafeModeUI() {
  header.textContent = "Pickler — Safe View";
  subtitle.textContent =
    "Shows pickle structure using pickletools. No code execution.";
  button.style.display = "inline-block";
}

function setFullModeUI() {
  header.textContent = "Pickler — Full View (Unsafe)";
  subtitle.textContent =
    "Shows full unpickled content. Only enabled after explicit user consent.";
  button.style.display = "none";
}

// -------------------------
// HTML escaping
// -------------------------
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// -------------------------
// Recursive renderer
// -------------------------
function render(value, indent = 0) {
  const pad = " ".repeat(indent);

  if (value === null) {
    return `${pad}<span class="null">null</span>`;
  }

  if (typeof value === "string") {
    return `${pad}<span class="string">"${escapeHtml(value)}"</span>`;
  }

  if (typeof value === "number") {
    return `${pad}<span class="number">${value}</span>`;
  }

  if (typeof value === "boolean") {
    return `${pad}<span class="boolean">${value}</span>`;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return `${pad}<span class="bracket">[</span><span class="bracket">]</span>`;
    }

    let out = `${pad}<span class="bracket">[</span>\n`;
    for (let i = 0; i < value.length; i++) {
      out += render(value[i], indent + 2);
      if (i < value.length - 1) out += ",";
      out += "\n";
    }
    out += `${pad}<span class="bracket">]</span>`;
    return out;
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return `${pad}<span class="brace">{</span><span class="brace">}</span>`;
    }

    let out = `${pad}<span class="brace">{</span>\n`;
    entries.forEach(([k, v], idx) => {
      out +=
        `${" ".repeat(indent + 2)}` +
        `<span class="key">"${escapeHtml(k)}"</span>` +
        `<span class="colon">: </span>` +
        render(v, indent + 2).trimStart();

      if (idx < entries.length - 1) out += ",";
      out += "\n";
    });
    out += `${pad}<span class="brace">}</span>`;
    return out;
  }

  return `${pad}<span class="unknown">${escapeHtml(String(value))}</span>`;
}

// -------------------------
// Message handler (FIXED)
// -------------------------
window.addEventListener("message", event => {
  if (event.data.type !== "result") return;

  // 🔑 THIS is the missing link
  if (event.data.mode === "full") {
    setFullModeUI();
  } else {
    setSafeModeUI();
  }

  let parsed;
  try {
    parsed = JSON.parse(event.data.content);
  } catch {
    output.textContent = event.data.content;
    return;
  }

  output.innerHTML = `<pre class="json">${render(parsed)}</pre>`;
});

// Initial state
setSafeModeUI();

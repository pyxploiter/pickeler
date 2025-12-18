const vscode = acquireVsCodeApi();

const output = document.getElementById("output");
const button = document.getElementById("full");

button.onclick = () => {
  vscode.postMessage({ type: "requestFull" });
};

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
// Message handler
// -------------------------
window.addEventListener("message", event => {
  if (event.data.type !== "result") return;

  let parsed;
  try {
    parsed = JSON.parse(event.data.content);
  } catch {
    output.textContent = event.data.content;
    return;
  }

  output.innerHTML = `<pre class="json">${render(parsed)}</pre>`;
});

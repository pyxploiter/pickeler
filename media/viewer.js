const vscode = acquireVsCodeApi();

document.getElementById("full").onclick = () => {
  vscode.postMessage({ type: "requestFull" });
};

window.addEventListener("message", event => {
  if (event.data.type === "result") {
    document.getElementById("output").textContent =
      event.data.content;
  }
});

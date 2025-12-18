import * as vscode from "vscode";
import * as path from "path";
import { spawn } from "child_process";

export class PickleViewerProvider
  implements vscode.CustomReadonlyEditorProvider {

  constructor(private readonly context: vscode.ExtensionContext) {}

  async openCustomDocument(
    uri: vscode.Uri
  ): Promise<vscode.CustomDocument> {
    return {
      uri,
      dispose: () => {}
    };
  }

  async resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel
  ): Promise<void> {

    const webview = webviewPanel.webview;

    webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.context.extensionUri, "media")
      ]
    };

    webview.html = this.getHtml(webview);

    const pythonPath =
      vscode.workspace.getConfiguration().get<string>("pickler.pythonPath") ??
      "python";

    const scriptPath = vscode.Uri.joinPath(
      this.context.extensionUri,
      "python",
      "inspect_pickle.py"
    ).fsPath;

    const runPython = (mode: "safe" | "full") => {
      const proc = spawn(pythonPath, [
        scriptPath,
        "--mode",
        mode,
        document.uri.fsPath
      ]);

      let output = "";

      proc.stdout.on("data", d => (output += d.toString()));
      proc.stderr.on("data", d => (output += d.toString()));

      proc.on("close", () => {
        webview.postMessage({
          type: "result",
          mode,
          content: output
        });
      });
    };

    // run safe view immediately
    runPython("safe");

    // handle messages from webview
    webview.onDidReceiveMessage(async msg => {
      if (msg.type !== "requestFull") {
        return;
      }

      // workspace trust check
      if (!vscode.workspace.isTrusted) {
        vscode.window.showErrorMessage(
          "Workspace is not trusted. Full pickle loading is disabled."
        );
        return;
      }

      // explicit user confirmation
      const ok = await vscode.window.showWarningMessage(
        "Unpickling can execute arbitrary code.\n\nOnly proceed if you trust this file.",
        { modal: true },
        "I Understand, Load Anyway"
      );

      if (ok !== "I Understand, Load Anyway") {
        return;
      }

      runPython("full");
    });
  }

  private getHtml(webview: vscode.Webview): string {
    const mediaBase = vscode.Uri.joinPath(
      this.context.extensionUri,
      "media"
    );

    const cssUri = webview.asWebviewUri(
      vscode.Uri.joinPath(mediaBase, "viewer.css")
    );

    const jsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(mediaBase, "viewer.js")
    );

    return /* html */ `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy"
                content="
                default-src 'none';
                style-src ${webview.cspSource};
                script-src ${webview.cspSource};
                ">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pickler</title>
            <link rel="stylesheet" href="${cssUri}">
        </head>
        <body>
            <div class="toolbar">
                <button id="full">Load Full Content (Unsafe)</button>
            </div>

            <pre id="output">Loading…</pre>

            <script src="${jsUri}"></script>
        </body>
        </html>`;
    }
}

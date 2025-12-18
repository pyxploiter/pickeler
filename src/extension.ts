import * as vscode from "vscode";
import { PickleViewerProvider } from "./PickleViewerProvider";

export function activate(context: vscode.ExtensionContext) {
    console.log("Pickler activated");
    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider(
            "pickler.viewer",
            new PickleViewerProvider(context),
            { webviewOptions: { retainContextWhenHidden: true } }
        )
    );

    vscode.window.showInformationMessage(
        "Optional features require numpy and pandas.\n\nRun:\npip install numpy pandas"
    );
}

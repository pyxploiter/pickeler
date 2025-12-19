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

    context.subscriptions.push(
        vscode.commands.registerCommand(
            "pickler.showInstallHelp",
            () => {
                vscode.window.showInformationMessage(
                    "Optional features require numpy and pandas",
                    "Copy pip command"
                    ).then(choice => {
                    if (choice === "Copy pip command") {
                        vscode.env.clipboard.writeText("pip install numpy pandas");
                    }
                });

            }
        )
    );
}

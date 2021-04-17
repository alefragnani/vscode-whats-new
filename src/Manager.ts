/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import path = require("path");
import * as semver from "semver";
import * as vscode from "vscode";
import { ContentProvider } from "./ContentProvider";
import { WhatsNewPageBuilder } from "./PageBuilder";

export class WhatsNewManager {

    private extensionName: string;
    private extensionReleaseVersion: string;
    // private extensionDisplayName: string;
    // private extensionVersion: string;
    private context: vscode.ExtensionContext;
    private contentProvider: ContentProvider;

    private extension: vscode.Extension<any>;
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }
    
    public registerContentProvider(extensionName: string, contentProvider: ContentProvider): WhatsNewManager {
        this.extensionName = extensionName
        // this.extensionName = extensionName.toLowerCase();
        this.contentProvider = contentProvider;

        return this;
    }

    public showPageInActivation() {
        // load data from extension manifest
        this.extension = vscode.extensions.getExtension(`alefragnani.${this.extensionName}`);
        this.extensionReleaseVersion = `${semver.major(this.extension.packageJSON.version)}.${semver.minor(this.extension.packageJSON.version)}`;
        // this.extensionVersion = this.extension.packageJSON.version;
        // this.extensionDisplayName = this.extension.packageJSON.displayName;

        const previousExtensionVersion = this.context.globalState.get<string>(`${this.extensionName}.version`);

        // console.log(`${this.extensionName} (${this. extension.packageJSON.displayName}) - 
        //     Version: ${this.extension.packageJSON.version}`);
        this.showPageIfVersionDiffers(this.extension.packageJSON.version, previousExtensionVersion);
    }

    public showPage() {

        // Create and show panel
        const panel = vscode.window.createWebviewPanel(`${this.extensionName}.whatsNew`, 
            `What's New in ${this.extension.packageJSON.displayName} ${this.extensionReleaseVersion}`, 
            vscode.ViewColumn.One, { enableScripts: true });

        // Get path to resource on disk
        const onDiskPath = vscode.Uri.file(
            path.join(this.context.extensionPath, "vscode-whats-new", "ui", "whats-new.html"));
        const pageUri = onDiskPath.with({ scheme: "vscode-resource" });

        // Local path to main script run in the webview
        const cssPathOnDisk = vscode.Uri.file(
            path.join(this.context.extensionPath, "vscode-whats-new", "ui", "main.css"));
        const cssUri = cssPathOnDisk.with({ scheme: "vscode-resource" });        

        // Local path to main script run in the webview
        const logoPathOnDisk = vscode.Uri.file(
            path.join(this.context.extensionPath, "images", `vscode-${this.extensionName.toLowerCase()}-logo-readme.png`));
        const logoUri = logoPathOnDisk.with({ scheme: "vscode-resource" });  
        
        panel.webview.html = this.getWebviewContentLocal(pageUri.fsPath, cssUri.toString(), logoUri.toString());
    }

    public showPageIfVersionDiffers(currentVersion: string, previousVersion: string) {

        const differs: semver.ReleaseType | null = semver.diff(currentVersion, previousVersion);

        // only "patch" should be suppressed
        if (!differs || differs === "patch") {
            return;
        }

        // "major", "minor"
        this.context.globalState.update(`${this.extensionName}.version`, currentVersion);
        this.showPage();
    }

    private getWebviewContentLocal(htmlFile: string, cssUrl: string, logoUrl: string): string {
        return WhatsNewPageBuilder.newBuilder(htmlFile)
            .updateExtensionDisplayName(this.extension.packageJSON.displayName)
            .updateExtensionName(this.extensionName)
            .updateExtensionVersion(this.extensionReleaseVersion)
            .updateRepositoryUrl(this.extension.packageJSON.repository.url.slice(
                0, this.extension.packageJSON.repository.url.length - 4))
            .updateRepositoryIssues(this.extension.packageJSON.bugs.url)
            .updateRepositoryHomepage(this.extension.packageJSON.homepage)
            .updateCSS(cssUrl)
            .updateHeader(this.contentProvider.provideHeader(logoUrl))
            .updateChangeLog(this.contentProvider.provideChangeLog())
            .updateSponsors(this.contentProvider.provideSponsors())
            .build();
    }
 }
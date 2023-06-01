/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as semver from "semver";
import * as vscode from "vscode";
import { Uri, Webview } from "vscode";
import { ContentProvider, SocialMediaProvider, SponsorProvider } from "./ContentProvider";
import { WhatsNewPageBuilder } from "./PageBuilder";

export class WhatsNewManager {

    private publisher!: string;
    private extensionName!: string;
    private context: vscode.ExtensionContext;
    private contentProvider!: ContentProvider;
    private socialMediaProvider!: SocialMediaProvider | undefined;
    private sponsorProvider: SponsorProvider | undefined;

    private extension!: vscode.Extension<any>;
    private versionKey!: string;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    private isRunningOnCodespaces(): boolean {
        return vscode.env.remoteName?.toLocaleLowerCase() === 'codespaces';
    }

    private isRunningOnGitpod(): boolean {
        return !!process.env.GITPOD_WORKSPACE_ID;
    }

    public registerContentProvider(publisher: string, extensionName: string, contentProvider: ContentProvider): WhatsNewManager {
        this.publisher = publisher;
        this.extensionName = extensionName
        this.contentProvider = contentProvider;
        this.versionKey = `${this.extensionName}.version`;

        this.context.globalState.setKeysForSync([this.versionKey]);

        return this;
    }

    public registerSocialMediaProvider(socialMediaProvider: SocialMediaProvider): WhatsNewManager {
        this.socialMediaProvider = socialMediaProvider;
        return this;
    }

    public registerSponsorProvider(sponsorProvider: SponsorProvider): WhatsNewManager {
        this.sponsorProvider = sponsorProvider;
        return this;
    }

    public async showPageInActivation() {
        // load data from extension manifest
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.extension = vscode.extensions.getExtension(`${this.publisher}.${this.extensionName}`)!;

        const previousExtensionVersion = this.context.globalState.get<string>(this.versionKey);

        await this.showPageIfVersionDiffers(this.extension.packageJSON.version, previousExtensionVersion);
    }

    public async showPage() {

        // Create and show panel
        const panel = vscode.window.createWebviewPanel(`${this.extensionName}.whatsNew`,
            `What's New in ${this.extension.packageJSON.displayName}`, vscode.ViewColumn.One, { enableScripts: true });

        // Path to HTML
        const onDiskPath = vscode.Uri.joinPath(this.context.extensionUri, "vscode-whats-new", "ui", "whats-new.html");

        // Path to CSS
        const cssPathOnDisk = vscode.Uri.joinPath(this.context.extensionUri, "vscode-whats-new", "ui", "main.css");

        // Path to Logo
        const logoPathOnDisk = vscode.Uri.joinPath(this.context.extensionUri, "images", `vscode-${this.extensionName.toLowerCase()}-logo-readme.png`);

        panel.webview.html = await this.getWebviewContentLocal(panel.webview, onDiskPath, cssPathOnDisk, logoPathOnDisk);
    }

    public async showPageIfVersionDiffers(currentVersion: string, previousVersion: string | undefined) {

        if (previousVersion) {
            const differs: semver.ReleaseType | null = semver.diff(currentVersion, previousVersion);

            // only "patch" should be suppressed
            if (!differs || differs === "patch") {
                return;
            }
        }

        // "major", "minor"
        this.context.globalState.update(this.versionKey, currentVersion);

        // 
        if (this.isRunningOnCodespaces() || this.isRunningOnGitpod()) {
            return;
        }

        await this.showPage();
    }

    private async getWebviewContentLocal(webview: Webview, htmlFile: Uri, cssUrl: Uri, logoUrl: Uri): Promise<string> {
        const pageBuilder = await WhatsNewPageBuilder.newBuilder(webview, htmlFile);
        let html = pageBuilder.updateExtensionPublisher(this.publisher)
            .updateExtensionDisplayName(this.extension.packageJSON.displayName)
            .updateExtensionName(this.extensionName)
            .updateExtensionVersion(this.extension.packageJSON.version)
            .updateRepositoryUrl(this.extension.packageJSON.repository.url.slice(
                0, this.extension.packageJSON.repository.url.length - 4))
            .updateRepositoryIssues(this.extension.packageJSON.bugs.url)
            .updateRepositoryHomepage(this.extension.packageJSON.homepage)
            .updateCSS(webview.asWebviewUri(cssUrl).toString())
            .updateHeader(this.contentProvider.provideHeader(webview.asWebviewUri(logoUrl).toString()))
            .updateChangeLog(this.contentProvider.provideChangeLog())
            .updateSponsors(this.sponsorProvider?.provideSponsors())
            .updateSupportChannels(this.contentProvider.provideSupportChannels())
            .updateSocialMedias(this.socialMediaProvider?.provideSocialMedias())
            .build();

        html = html
            .replace(/#{cspSource}/g, webview.cspSource)
            .replace(/#{root}/g, webview.asWebviewUri(this.context.extensionUri).toString());

        return html;
    }
}
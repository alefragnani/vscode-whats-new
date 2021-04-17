/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import { ChangeLogItem, ChangeLogKind, Header, Sponsor } from "./ContentProvider";

export class WhatsNewPageBuilder {

    public static newBuilder(htmlFile: string): WhatsNewPageBuilder {
        return new WhatsNewPageBuilder(htmlFile);
    }

    private htmlFile: string;

    constructor(htmlFile: string) {
        this.htmlFile = fs.readFileSync(htmlFile).toString();
    }

    public updateExtensionDisplayName(extensionDisplayName: string) {
        this.htmlFile = this.htmlFile.replace(/\$\{extensionDisplayName\}/g, extensionDisplayName);
        return this;
    }

    public updateExtensionName(extensionName: string) {
        this.htmlFile = this.htmlFile.replace(/\$\{extensionName\}/g, extensionName);
        return this;
    }

    public updateExtensionVersion(extensionVersion: string) {
        this.htmlFile = this.htmlFile.replace("${extensionVersion}", extensionVersion);
        return this;
    }

    public updateRepositoryUrl(repositoryUrl: string) {
        this.htmlFile = this.htmlFile.replace(/\$\{repositoryUrl\}/g, repositoryUrl);
        return this;
    }

    public updateRepositoryIssues(repositoryIssues: string) {
        this.htmlFile = this.htmlFile.replace("${repositoryIssues}", repositoryIssues);
        return this;
    }

    public updateRepositoryHomepage(repositoryHomepage: string) {
        this.htmlFile = this.htmlFile.replace("${repositoryHomepage}", repositoryHomepage);
        return this;
    }

    public updateCSS(cssUrl: string): WhatsNewPageBuilder {
        this.htmlFile = this.htmlFile.replace("${cssUrl}", cssUrl);
        return this;
    }

    public updateHeader(header: Header): WhatsNewPageBuilder {
        this.htmlFile = this.htmlFile.replace("${headerLogo}", header.logo.src);
        this.htmlFile = this.htmlFile.replace("${headerWidth}", header.logo.width.toString());
        this.htmlFile = this.htmlFile.replace("${headerHeight}", header.logo.height.toString());
        this.htmlFile = this.htmlFile.replace("${headerMessage}", header.message);
        return this;
    }

    public updateChangeLog(changeLog: ChangeLogItem[]): WhatsNewPageBuilder {
        let changeLogString: string = "";

        for (const cl of changeLog) {
            const badge: string = this.getBadgeFromChangeLogKind(cl.kind);
            changeLogString = changeLogString.concat(
                `<li><span class="changelog__badge changelog__badge--${badge}">${cl.kind}</span>
                    ${cl.message}
                </li>`
            )           
        }
        this.htmlFile = this.htmlFile.replace("${changeLog}", changeLogString);
        return this;
    }

    public updateSponsors(sponsors: Sponsor[]): WhatsNewPageBuilder {
        if (sponsors.length === 0) {
            this.htmlFile = this.htmlFile.replace("${sponsors}", "");
            return this;
        }

        let sponsorsString: string = `<p>
          <h2>Sponsors</h2>`;

        for (const sp of sponsors) {
            sponsorsString = sponsorsString.concat(
                `<a title="${sp.title}" href="${sp.link}">
                    <img src="${sp.image}" width="${sp.width}%"/>
                </a>
                ${sp.message} 
                ${sp.extra}`
            )           
        }
        sponsorsString = sponsorsString.concat("</p>");
        this.htmlFile = this.htmlFile.replace("${sponsors}", sponsorsString);
        return this;
    }

    public build(): string {
        return this.htmlFile.toString();
    }

    private getBadgeFromChangeLogKind(kind: ChangeLogKind): string {
        switch (kind) {
            case ChangeLogKind.NEW:
                return "added";
        
            case ChangeLogKind.CHANGED:
                return "changed";
            
            case ChangeLogKind.FIXED:
                return "fixed";
        
            default:
                break;
        }
    }
}
/*---------------------------------------------------------------------------------------------
*  Copyright (c) Alessandro Fragnani. All rights reserved.
*  Licensed under the MIT License. See License.md in the project root for license information.
*--------------------------------------------------------------------------------------------*/

import * as fs from "fs";
import * as semver from "semver";
import { ChangeLogItem, ChangeLogIssue, ChangeLogVersion, ChangeLogKind, Header, Sponsor, IssueKind, SupportChannel, SocialMedia } from "./ContentProvider";

export class WhatsNewPageBuilder {

    public static newBuilder(htmlFile: string): WhatsNewPageBuilder {
        return new WhatsNewPageBuilder(htmlFile);
    }

    private htmlFile: string;
    private repositoryUrl!: string;

    constructor(htmlFile: string) {
        this.htmlFile = fs.readFileSync(htmlFile).toString();
    }

    public updateExtensionPublisher(publisher: string) {
        this.htmlFile = this.htmlFile.replace(/\$\{publisher\}/g, publisher);
        return this;
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
        this.htmlFile = this.htmlFile.replace("${extensionVersion}", 
            `${semver.major(extensionVersion)}.${semver.minor(extensionVersion)}`);
        return this;
    }

    public updateRepositoryUrl(repositoryUrl: string) {
        this.htmlFile = this.htmlFile.replace(/\$\{repositoryUrl\}/g, repositoryUrl);
        this.repositoryUrl = repositoryUrl;
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
        let changeLogString = "";

        for (const cl of changeLog) {
            if (cl.kind === ChangeLogKind.VERSION) {
                const cc: ChangeLogVersion = <ChangeLogVersion>cl.detail;
                const borderTop = changeLogString === "" ? "" : "changelog__version__borders__top";
                changeLogString = changeLogString.concat(
                    `<li class="changelog__version__borders ${borderTop}">
                        <span class="changelog__badge changelog__badge--version">${cc.releaseNumber}</span>
                        <span class="uppercase bold">${cc.releaseDate}</span>
                    </li>`);
            } else {
                const badge: string = this.getBadgeFromChangeLogKind(cl.kind);
                let message: string;

                if (typeof cl.detail === "string") {
                    message = cl.detail
                } else {
                    const cc: ChangeLogIssue = <ChangeLogIssue>cl.detail;
                    if (cc.kind === IssueKind.Issue) {
                        message = `${cc.message}
                            (<a title="Open Issue #${cc.id}" 
                            href="${this.repositoryUrl}/issues/${cc.id}">Issue #${cc.id}</a>)`
                    } else {
                        message = `${cc.message}
                            (Thanks to ${cc.kudos} - <a title="Open PR #${cc.id}" 
                            href="${this.repositoryUrl}/pull/${cc.id}">PR #${cc.id}</a>)`
                    }
                }
                
                changeLogString = changeLogString.concat(
                    `<li><span class="changelog__badge changelog__badge--${badge}">${cl.kind}</span>
                        ${message}
                    </li>`
                );
            }
        }
        this.htmlFile = this.htmlFile.replace("${changeLog}", changeLogString);
        return this;
    }

    public updateSponsors(sponsors: Sponsor[] | undefined): WhatsNewPageBuilder {
        if (!sponsors || sponsors.length === 0) {
            this.htmlFile = this.htmlFile.replace("${sponsors}", "");
            return this;
        }

        let sponsorsString = `<p>
          <h2>Sponsors</h2>`;

        for (const sp of sponsors) {
            if (sp.message) {
                sponsorsString = sponsorsString.concat(
                    `<a title="${sp.title}" href="${sp.link}">
                    <img class="dark" src="${sp.image.light}" width="${sp.width}%"/>
                    <img class="light" src="${sp.image.dark}" width="${sp.width}%"/>
                    </a>
                    ${sp.message} 
                    ${sp.extra}<br><br>`
                );
            } else {
                sponsorsString = sponsorsString.concat(
                    `<div align="center"><a title="${sp.title}" href="${sp.link}">
                    <img class="dark" src="${sp.image.light}" width="${sp.width}%"/>
                    <img class="light" src="${sp.image.dark}" width="${sp.width}%"/>
                    </a></div><br>`
                );           
            }
        }
        sponsorsString = sponsorsString.concat("</p>");
        this.htmlFile = this.htmlFile.replace("${sponsors}", sponsorsString);
        return this;
    }

    public updateSupportChannels(supportChannels: SupportChannel[]): WhatsNewPageBuilder {
        if (supportChannels.length === 0) {
            this.htmlFile = this.htmlFile.replace("${supportChannels}", "");
            return this;
        }

        let supportChannelsString = `<div class="button-group button-group--support-alefragnani">`;

        for (const sc of supportChannels) {
            supportChannelsString = supportChannelsString.concat(
                `<a class="button button--flat-primary" title="${sc.title}" href="${sc.link}" target="_blank">
                    ${sc.message} 
                </a>`
            )           
        }
        supportChannelsString = supportChannelsString.concat("</div>");
        this.htmlFile = this.htmlFile.replace("${supportChannels}", supportChannelsString);
        return this;
    }

    public updateSocialMedias(socialMedias: SocialMedia[] | undefined): WhatsNewPageBuilder {
        if (!socialMedias || socialMedias.length === 0) {
            this.htmlFile = this.htmlFile.replace("${socialMedias}", "");
            return this;
        }

        let socialMediasString = '';

        for (const sm of socialMedias) {
            socialMediasString = socialMediasString.concat(
                `<li><a title="${sm.title}" href="${sm.link}">${sm.title}</a></li>`
            );
        }
        this.htmlFile = this.htmlFile.replace("${socialMedias}", socialMediasString);
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
        
            case ChangeLogKind.INTERNAL:
                return "internal";
        
            default:
                return "internal";
        }
    }
}
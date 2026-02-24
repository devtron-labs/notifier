/*
 * Copyright (c) 2024. Devtron Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { WebhookData } from './mustacheHelper';


export interface ciMaterials {
    branch: string;
    commit: string;
    commitLink: string;
    webhookType: boolean;
    webhookData: WebhookData;
}//For Slack
export interface ParsedCIEvent {
    eventTime: number | string;
    slackTimestamp?: string;
    triggeredBy: string;
    appName: string;
    pipelineName: string;
    ciMaterials: {
        branch: string;
        commit: string;
        commitLink: string;
        webhookType: boolean;
        webhookData: WebhookData;
    }[];
    buildHistoryLink: string;
    failureReason?: string;
}
export interface vulnerability {
    CVEName: string;
    severity: string;
    package?: string;
    currentVersion: string;
    fixedVersion: string;
    permission: string;
}
export interface severityCount  {
    critical: number;
    high: number;
    medium: number;
    low: number;
}
export interface WebhookParsedEvent {
    eventType?: string;
    devtronAppId?: number;
    devtronEnvId?: number;
    devtronAppName?: string;
    devtronEnvName?: string;
    devtronPipelineType?: string;
    devtronCdPipelineId?: number;
    devtronCiPipelineId?: number;
    devtronApprovedByEmail?: string[];
    devtronTriggeredByEmail: string;
    devtronContainerImageTag?: string;
    devtronContainerImageRepo?: string;
    devtronBuildGitCommitHash?: string[];
    scannedAt?: Date;
    scannedBy?: string;
    vulnerabilities?: vulnerability[];
    severityCount?: severityCount | {};
    ciMaterials?: ciMaterials[];
    buildHistoryLink?: string;
    appDetailsLink?: string;
}
export interface ParseApprovalEvent {
    eventTime: number | string;
    slackTimestamp?: string;
    triggeredBy: string;
    appName: string;
    pipelineName: string;
    envName: string;
    tags?: string[];
    comment?: string;
    imageLink?: string;
    imageTag: string;
    approvalLink?: string;

}
export interface ParseConfigApprovalEvent {
    eventTime: number | string;
    slackTimestamp?: string;
    triggeredBy: string;
    appName: string;
    envName: string;
    protectConfigComment?: string[];
    protectConfigFileType: string;
    protectConfigFileName: string;
    protectConfigLink?: string;
    approvalLink?: string;
}

export interface ParsedScoopNotification {
    heading: string;
    kind: string;
    resourceName: string;
    action: string;
    clusterName: string;
    namespace: string;
    watcherName: string;
    pipelineName: string;
    viewResourceManifestLink: string;
    interceptedAt: string;
    color : string;
}

export interface ParsedCDEvent {
    eventTime: number | string;
    slackTimestamp?: string;
    triggeredBy: string;
    appName: string;
    pipelineName: string;
    envName: string;
    imageTagNames?: string[];
    imageComment?: string;
    imageApprovalLink?: string;
    stage: "Pre-deployment" | "Post-deployment" | "Deployment";
    ciMaterials: {
        branch: string;
        commit: string;
        commitLink: string;
        webhookType: boolean;
        webhookData: WebhookData;
    }[];
    appDetailsLink: string;
    deploymentHistoryLink: string;
    dockerImg: string;
    deploymentWindowComment?: string;
    deploymentWindowCommentStyle?: string;
    triggeredWithoutApproval?: string;
    triggeredWithoutApprovalStyle?: string;
}
export enum EVENT_TYPE {
    Trigger = 1,
    Success = 2,
    Fail = 3,
    Approval = 4,
    ConfigApproval = 5,
    Blocked = 6,
    ImagePromotion = 7,
    ImageScan = 8,
    ScoopNotification = 9,
}

export enum ENV_TYPE_INT{
    AllExistingAndFutureProdEnvs = -2,
    AllExistingAndFutureNonProdEnvs = -1
}
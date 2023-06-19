import { Event } from '../notification/service/notificationService';
import moment from 'moment-timezone';
import e from 'express';

export class MustacheHelper {
    private CD_STAGE = {
        DEPLOY: "Deployment",
        PRE: "Pre-deployment",
        POST: "Post-deployment",
    }

    createGitCommitUrl(url: string, revision: string): string {
        if (!url || !revision) {
            return ""
        }
        if (url.indexOf("gitlab") > 0 || url.indexOf("github") > 0) {
            let urlpart = url.split("@")
            if (urlpart.length > 1) {
                return "https://" + urlpart[1].split(".git")[0] + "/commit/" + revision
            }
            if (urlpart.length == 1) {
                return urlpart[0].split(".git")[0] + "/commit/" + revision
            }
        }
        if (url.indexOf("bitbucket") > 0) {
            let urlpart = url.split("@")
            if (urlpart.length > 1) {
                return "https://" + urlpart[1].split(".git")[0] + "/commits/" + revision
            }
            if (urlpart.length == 1) {
                return urlpart[0].split(".git")[0] + "/commits/" + revision
            }
        }
        return "NA"
    }

    parseEvent(event: Event, isSlackNotification?: boolean): ParsedCIEvent | ParsedCDEvent {
        let baseURL = event.baseUrl;
        let material = event.payload.material;
        let ciMaterials = material.ciMaterials ? material.ciMaterials.map((ci) => {
            if (material && material.gitTriggers && material.gitTriggers[ci.id]) {
                let trigger = material.gitTriggers[ci.id];
                let _material;
                if (ci.type == 'WEBHOOK'){
                    let _webhookDataInRequest = trigger.WebhookData;
                    let _isMergedTypeWebhook = _webhookDataInRequest.EventActionType == 'merged';
                    let _webhookData : WebhookData = {
                        mergedType : _isMergedTypeWebhook,
                        data: this.modifyWebhookData(_webhookDataInRequest.Data, ci.url, _isMergedTypeWebhook)
                    }
                    _material = {
                        webhookType : true,
                        webhookData: _webhookData
                    }
                }else{
                    _material = {
                        branch: ci.value || "NA",
                        commit: trigger.Commit ? trigger.Commit.substring(0, 8) : "NA",
                        commitLink: this.createGitCommitUrl(ci.url, trigger.Commit),
                        webhookType : false,
                    }
                }
                return _material;
            }
            else {
                return {
                    branch: "NA",
                    commit: "NA",
                    commitLink: "#",
                }
            }
        }) : [];


        const date = moment(event.eventTime);
        const timestamp = isSlackNotification
            ? date.unix()
            : date.format('dddd, MMMM Do YYYY hh:mm A [GMT]Z');

        if (event.pipelineType === "CI") {
            let buildHistoryLink;
            if (baseURL && event.payload.buildHistoryLink) buildHistoryLink = `${baseURL}${event.payload.buildHistoryLink}`;
            const parsedEvent:ParsedCIEvent = {
                eventTime: timestamp,
                triggeredBy: event.payload.triggeredBy || "NA",
                appName: event.payload.appName || "NA",
                pipelineName: event.payload.pipelineName || "NA",
                ciMaterials: ciMaterials,
                buildHistoryLink: buildHistoryLink
            }
            if(event.payload.failureReason) {
                parsedEvent.failureReason = event.payload.failureReason
            }
            return parsedEvent
        }
        else if (event.pipelineType === "CD") {
            let appDetailsLink, deploymentHistoryLink;
            let index = -1;

            if (event.payload.dockerImageUrl) index = event.payload.dockerImageUrl.indexOf(":");
            if (baseURL && event.payload.appDetailLink) appDetailsLink = `${baseURL}${event.payload.appDetailLink}`;
            if (baseURL && event.payload.deploymentHistoryLink) deploymentHistoryLink = `${baseURL}${event.payload.deploymentHistoryLink}`;

            return {
                eventTime: timestamp,
                triggeredBy: event.payload.triggeredBy || "NA",
                appName: event.payload.appName || "NA",
                envName: event.payload.envName || "NA",
                pipelineName: event.payload.pipelineName || "NA",
                stage: this.CD_STAGE[event.payload.stage] || "NA",
                ciMaterials: ciMaterials,
                dockerImg: index >= 0 ? event.payload.dockerImageUrl.substring(index + 1) : "NA",
                appDetailsLink: appDetailsLink,
                deploymentHistoryLink: deploymentHistoryLink,
            }
        }
    }
    parseEventForWebhook(event: Event ) :WebhookParsedEvent {
        let eventType: string;
        if (event.eventTypeId === 1) {
          eventType = "trigger";
        } else if (event.eventTypeId === 2) {
          eventType = "success";
        } else {
          eventType = "fail";
        }
        return {
          eventType: eventType,
          devtronAppId: event.appId,
          devtronEnvId: event.envId,
          devtronAppName: event.payload.appName,
          devtronEnvName: event.payload.envName,
          devtronCdPipelineId: event.pipelineId,
          devtronCiPipelineId: event.pipelineId,
          devtronTriggeredByEmail: event.payload.triggeredBy,
          devtronContainerImageTag: event.payload.dockerImageUrl,
          devtronApprovedByEmail: event.payload.approvedByEmail,
        };
    }

    modifyWebhookData (webhookDataMap: any, gitUrl : string, isMergedTypeWebhook : boolean) : any {

        if(isMergedTypeWebhook){
            // set target checkout link
            let _targetCheckout = webhookDataMap["target checkout"];
            if (_targetCheckout){
                webhookDataMap["target checkout link"] = this.createGitCommitUrl(gitUrl, _targetCheckout)
                webhookDataMap["target checkout"] = _targetCheckout.substring(0, 8);
            }else{
                webhookDataMap["target checkout"] = "NA";
            }

            // set source checkout link
            let _sourceCheckout = webhookDataMap["source checkout"];
            if (_sourceCheckout){
                webhookDataMap["source checkout link"] = this.createGitCommitUrl(gitUrl, _sourceCheckout)
                webhookDataMap["source checkout"] = _sourceCheckout.substring(0, 8);
            }else{
                webhookDataMap["source checkout"] = "NA";
            }
        }

        // removing space from all keys of data map , as rendering issue with space in key in mustashe template
        let _modifiedDataMap = {};
        Object.keys(webhookDataMap).forEach((_key) => {
            let _modifiedKey = _key.replace(/\s/g, '');
            _modifiedDataMap[_modifiedKey] = webhookDataMap[_key];
        })

        return _modifiedDataMap;

    }
}

//For Slack
interface ParsedCIEvent {
    eventTime: number | string;
    triggeredBy: string;
    appName: string;
    pipelineName: string;
    ciMaterials: {
        branch: string;
        commit: string
        commitLink: string;
        webhookType: boolean;
        webhookData: WebhookData;
    }[];
    buildHistoryLink: string;
    failureReason?: string;
}
interface WebhookParsedEvent{
    eventType?:string;
    devtronAppId?:number;
    devtronEnvId?:number;
    devtronAppName?:string;
    devtronEnvName?:string;
    devtronCdPipelineId?:number;
    devtronCiPipelineId?:number;
    devtronApprovedByEmail?:string;
    devtronTriggeredByEmail:string;
    devtronContainerImageTag?:string;
}

interface ParsedCDEvent {
    eventTime: number | string;
    triggeredBy: string;
    appName: string;
    pipelineName: string;
    envName: string;
    stage: "Pre-deployment" | "Post-deployment" | "Deployment";
    ciMaterials: {
        branch: string;
        commit: string
        commitLink: string;
        webhookType: boolean;
        webhookData: WebhookData;
    }[];
    appDetailsLink: string;
    deploymentHistoryLink: string;
    dockerImg: string;
}

class WebhookData {
    mergedType : boolean;   // merged/non-merged
    data: Map<string, string>;
}
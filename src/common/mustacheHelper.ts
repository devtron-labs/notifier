import { Event } from '../notification/service/notificationService';
import moment from 'moment-timezone';
import e, { json } from 'express';
import {EVENT_TYPE, ParsedScoopNotification} from "./types";
import { ciMaterials ,ParsedCIEvent,vulnerability,severityCount,WebhookParsedEvent,ParseApprovalEvent,ParseConfigApprovalEvent,ParsedCDEvent} from './types';
import Mustache from "mustache";
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

    parseScoopNotification(event: Event | any): ParsedScoopNotification {
        let parsedScoopNotification: ParsedScoopNotification = {
            heading: event.payload.scoopNotificationConfig.data.heading,
            kind: event.payload.scoopNotificationConfig.data.kind,
            name: event.payload.scoopNotificationConfig.data.name,
            action: event.payload.scoopNotificationConfig.data.action,
            clusterName: event.payload.scoopNotificationConfig.data.clusterName,
            namespace: event.payload.scoopNotificationConfig.data.namespace,
            watcherName: event.payload.scoopNotificationConfig.data.watcherName,
            pipelineName: event.payload.scoopNotificationConfig.data.pipelineName,
            viewResourceManifestLink: event.payload.scoopNotificationConfig.data.viewResourceManifestLink,
            interceptedAt: event.payload.scoopNotificationConfig.data.interceptedAt,
            color: event.payload.scoopNotificationConfig.data.color
        }

        return parsedScoopNotification
    }

    parseEvent(event: Event, isSlackNotification?: boolean): ParsedCIEvent | ParsedCDEvent | ParseApprovalEvent | ParseConfigApprovalEvent | ParsedScoopNotification{
        if(event.eventTypeId===EVENT_TYPE.ScoopNotification){
            return this.parseScoopNotification(event)
        }
        let baseURL = event.baseUrl;
        let material = event.payload.material;
        let ciMaterials;
        if (event.eventTypeId!==EVENT_TYPE.Approval && event.eventTypeId!==EVENT_TYPE.ConfigApproval){
        ciMaterials = material.ciMaterials ? material.ciMaterials.map((ci) => {
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
    }


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
                deploymentWindowComment: event.payload.timeWindowComment ?? '',
                deploymentWindowCommentStyle: event.payload.timeWindowComment ? 'block' : 'none',
            }
        }
        else if (event.eventTypeId===EVENT_TYPE.Approval){
            let  imageTagNames,imageComment,imageLink,approvalLink;
            let index = -1;
            if (event.payload.dockerImageUrl) index = event.payload.dockerImageUrl.lastIndexOf(":");
            if (event.payload.imageTagNames) imageTagNames = event.payload.imageTagNames;
            if (event.payload.imageComment) imageComment = event.payload.imageComment;
            if (baseURL && event.payload.imageApprovalLink) imageLink =`${baseURL}${event.payload.imageApprovalLink}`;
            if (baseURL && event.payload.approvalLink) approvalLink = `${baseURL}${event.payload.approvalLink}`;
           
            return {
                eventTime: timestamp,
                triggeredBy: event.payload.triggeredBy || "NA",
                appName: event.payload.appName || "NA",
                envName: event.payload.envName || "NA",
                pipelineName: event.payload.pipelineName || "NA",
                imageTag: index >= 0 ? event.payload.dockerImageUrl.substring(index + 1) : "NA",
                comment:imageComment,
                tags:imageTagNames,
                imageApprovalLink:imageLink,
                approvalLink:approvalLink,
            }
            

        }
        else if (event.eventTypeId===EVENT_TYPE.ConfigApproval){
            let  protectConfigFileType,protectConfigFileName,protectConfigComment,protectConfigLink,envName,approvalLink;
            if (event.payload.protectConfigFileType) protectConfigFileType = event.payload.protectConfigFileType;
            if (event.payload.protectConfigFileName) protectConfigFileName = event.payload.protectConfigFileName;
            if (event.payload.protectConfigComment) protectConfigComment = event.payload.protectConfigComment.split("\n");
            if (baseURL && event.payload.protectConfigLink) protectConfigLink =`${baseURL}${event.payload.protectConfigLink}`;
            if (baseURL && event.payload.approvalLink) approvalLink = `${baseURL}${event.payload.approvalLink}`;
           if (!event.payload.envName){
            envName="Base configuration"
           }
            return {
                eventTime: timestamp,
                triggeredBy: event.payload.triggeredBy || "NA",
                appName: event.payload.appName || "NA",
                envName: event.payload.envName || envName,
                protectConfigFileType:protectConfigFileType || "NA",
                protectConfigFileName:protectConfigFileName || "NA",
                protectConfigComment:protectConfigComment || [],
                protectConfigLink:protectConfigLink,
                approvalLink:approvalLink,
            }
            

        }
    }
     ParseCIMaterials(material: any): ciMaterials[] {
        return material.ciMaterials ? material.ciMaterials.map((ci: any) => {
            const trigger = material.gitTriggers && material.gitTriggers[ci.id];
            if (trigger) {
                if (ci.type === 'WEBHOOK') {
                    const webhookDataInRequest = trigger.WebhookData;
                    const isMergedTypeWebhook = webhookDataInRequest?.EventActionType === 'merged';
                    const webhookData: WebhookData = {
                        mergedType: isMergedTypeWebhook,
                        data: this.modifyWebhookData(webhookDataInRequest?.Data, ci.url, isMergedTypeWebhook)
                    };
                    return {
                        webhookType: true,
                        webhookData: webhookData
                    };
                } else {
                    return {
                        branch: ci.value || 'NA',
                        commit: trigger.Commit ? trigger.Commit.substring(0, 8) : 'NA',
                        commitLink: this.createGitCommitUrl(ci.url, trigger.Commit),
                        webhookType: false,
                    };
                }
            } else {
                return {
                    branch: 'NA',
                    commit: 'NA',
                    commitLink: '#',
                };
            }
        }) : [];
    }
    parseEventForWebhook(event: Event ) :WebhookParsedEvent {
        let eventType: string;
        if (event.eventTypeId === EVENT_TYPE.Trigger) {
          eventType = "trigger";
        } else if (event.eventTypeId === EVENT_TYPE.Success) {
          eventType = "success";
        } else if (event.eventTypeId === EVENT_TYPE.Fail){
          eventType = "fail";
        }else if (event.eventTypeId===EVENT_TYPE.ImageScan){
            eventType="imageScan"
        }
        let baseURL = event.baseUrl;
        let buildHistoryLink,appDetailsLink;
            if (baseURL && event.payload.buildHistoryLink) buildHistoryLink = `${baseURL}${event.payload.buildHistoryLink}`;
            if (baseURL && event.payload.appDetailLink) appDetailsLink = `${baseURL}${event.payload.appDetailLink}`;
        let ciMaterials:ciMaterials[] = this.ParseCIMaterials(event.payload.material);
        this.defineArrayProperties<ciMaterials>(ciMaterials);
         let imageScanExecutionInfo = event.payload?.imageScanExecutionInfo;
        let vulnerabilities:vulnerability[] = this.mapVulnerabilities(imageScanExecutionInfo);
        this.defineArrayProperties<vulnerability>(vulnerabilities);
        let severityCount=this.mapSeverityCount(imageScanExecutionInfo);
        this.defineObjectProperties<severityCount |{}>(severityCount);
        let devtronContainerImageTag='NA' ,devtronContainerImageRepo='NA';
            if (event.payload.dockerImageUrl){
                const index = event.payload.dockerImageUrl.lastIndexOf(":");
                devtronContainerImageTag=event.payload.dockerImageUrl.substring(index + 1) ;
                devtronContainerImageRepo=event.payload.dockerImageUrl.substring(0,index);
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
          devtronContainerImageTag:devtronContainerImageTag,
          devtronContainerImageRepo:devtronContainerImageRepo,
          devtronApprovedByEmail: event.payload.approvedByEmail,
          ciMaterials:ciMaterials,
          vulnerabilities:vulnerabilities,
          severityCount:severityCount,
          scannedAt:event.payload.imageScanExecutionInfo?.scannedAt,
          scannedBy:event.payload.imageScanExecutionInfo?.scannedBy,
          buildHistoryLink: buildHistoryLink,
          appDetailsLink: appDetailsLink,
          
          

        };
    }
    mapSeverityCount(imageScanExecutionInfo:any):severityCount | {} {
        if (imageScanExecutionInfo && imageScanExecutionInfo.severityCount){
            return {
                high: imageScanExecutionInfo.severityCount.high,
                moderate: imageScanExecutionInfo.severityCount.moderate,
                low: imageScanExecutionInfo.severityCount.low,
              }   
            } else{
                return {};
            }
    }
     mapVulnerabilities(imageScanExecutionInfo: any): vulnerability[] {
        if (imageScanExecutionInfo && imageScanExecutionInfo.vulnerabilities) {
            return imageScanExecutionInfo.vulnerabilities.map((vuln: any) => ({
                CVEName: vuln.cveName,
                severity: vuln.severity,
                package: vuln.package || undefined,
                currentVersion: vuln.currentVersion,
                fixedVersion: vuln.fixedVersion,
                permission: vuln.permission,
            }));
        } else {
            return [];
        }
    }
     defineArrayProperties<T>(array: T[]): void {
        if (typeof array!=="object"){
            return
        }
        Object.defineProperty(array, 'getAll', {
            get: function() {
                return array.map(item => JSON.stringify(item));
            }
        });
    
        array.forEach((item, index) => {
            Object.defineProperty(item, 'isLastIndex', {
                get: function() {
                    return index === array.length - 1;
                }
            });
        });
    }
    defineObjectProperties<T>(object: T): void {
        if (typeof object!=="object"){
             
            return 
        }
            Object.defineProperty(object, 'getAll', {
                get: function() {
                    return JSON.stringify(object);
                }
            });
        
       
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

;
export class WebhookData {
    mergedType : boolean;   // merged/non-merged
    data: Map<string, string>;
}
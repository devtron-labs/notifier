"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MustacheHelper = void 0;
var moment_timezone_1 = require("moment-timezone");
var MustacheHelper = /** @class */ (function () {
    function MustacheHelper() {
        this.CD_STAGE = {
            DEPLOY: "Deployment",
            PRE: "Pre-deployment",
            POST: "Post-deployment",
        };
    }
    MustacheHelper.prototype.createGitCommitUrl = function (url, revision) {
        if (!url || !revision) {
            return "";
        }
        if (url.indexOf("gitlab") > 0 || url.indexOf("github") > 0) {
            var urlpart = url.split("@");
            if (urlpart.length > 1) {
                return "https://" + urlpart[1].split(".git")[0] + "/commit/" + revision;
            }
            if (urlpart.length == 1) {
                return urlpart[0].split(".git")[0] + "/commit/" + revision;
            }
        }
        if (url.indexOf("bitbucket") > 0) {
            var urlpart = url.split("@");
            if (urlpart.length > 1) {
                return "https://" + urlpart[1].split(".git")[0] + "/commits/" + revision;
            }
            if (urlpart.length == 1) {
                return urlpart[0].split(".git")[0] + "/commits/" + revision;
            }
        }
        return "NA";
    };
    MustacheHelper.prototype.parseEvent = function (event, isSlackNotification) {
        var _this = this;
        var baseURL = event.baseUrl;
        var material = event.payload.material;
        var ciMaterials;
        if (event.eventTypeId !== 4 && event.eventTypeId !== 5) {
            ciMaterials = material.ciMaterials ? material.ciMaterials.map(function (ci) {
                if (material && material.gitTriggers && material.gitTriggers[ci.id]) {
                    var trigger = material.gitTriggers[ci.id];
                    var _material = void 0;
                    if (ci.type == 'WEBHOOK') {
                        var _webhookDataInRequest = trigger.WebhookData;
                        var _isMergedTypeWebhook = _webhookDataInRequest.EventActionType == 'merged';
                        var _webhookData = {
                            mergedType: _isMergedTypeWebhook,
                            data: _this.modifyWebhookData(_webhookDataInRequest.Data, ci.url, _isMergedTypeWebhook)
                        };
                        _material = {
                            webhookType: true,
                            webhookData: _webhookData
                        };
                    }
                    else {
                        _material = {
                            branch: ci.value || "NA",
                            commit: trigger.Commit ? trigger.Commit.substring(0, 8) : "NA",
                            commitLink: _this.createGitCommitUrl(ci.url, trigger.Commit),
                            webhookType: false,
                        };
                    }
                    return _material;
                }
                else {
                    return {
                        branch: "NA",
                        commit: "NA",
                        commitLink: "#",
                    };
                }
            }) : [];
        }
        var date = (0, moment_timezone_1.default)(event.eventTime);
        var timestamp = isSlackNotification
            ? date.unix()
            : date.format('dddd, MMMM Do YYYY hh:mm A [GMT]Z');
        if (event.pipelineType === "CI") {
            var buildHistoryLink = void 0;
            if (baseURL && event.payload.buildHistoryLink)
                buildHistoryLink = "".concat(baseURL).concat(event.payload.buildHistoryLink);
            var parsedEvent = {
                eventTime: timestamp,
                triggeredBy: event.payload.triggeredBy || "NA",
                appName: event.payload.appName || "NA",
                pipelineName: event.payload.pipelineName || "NA",
                ciMaterials: ciMaterials,
                buildHistoryLink: buildHistoryLink
            };
            if (event.payload.failureReason) {
                parsedEvent.failureReason = event.payload.failureReason;
            }
            return parsedEvent;
        }
        else if (event.pipelineType === "CD") {
            var appDetailsLink = void 0, deploymentHistoryLink = void 0;
            var index = -1;
            if (event.payload.dockerImageUrl)
                index = event.payload.dockerImageUrl.indexOf(":");
            if (baseURL && event.payload.appDetailLink)
                appDetailsLink = "".concat(baseURL).concat(event.payload.appDetailLink);
            if (baseURL && event.payload.deploymentHistoryLink)
                deploymentHistoryLink = "".concat(baseURL).concat(event.payload.deploymentHistoryLink);
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
            };
        }
        else if (event.eventTypeId === 4) {
            var imageTagNames = void 0, imageComment = void 0, imageLink = void 0, approvalLink = void 0;
            var index = -1;
            if (event.payload.dockerImageUrl)
                index = event.payload.dockerImageUrl.lastIndexOf(":");
            if (event.payload.imageTagNames)
                imageTagNames = event.payload.imageTagNames;
            if (event.payload.imageComment)
                imageComment = event.payload.imageComment;
            if (baseURL && event.payload.imageApprovalLink)
                imageLink = "".concat(baseURL).concat(event.payload.imageApprovalLink);
            if (baseURL && event.payload.approvalLink)
                approvalLink = "".concat(baseURL).concat(event.payload.approvalLink);
            return {
                eventTime: timestamp,
                triggeredBy: event.payload.triggeredBy || "NA",
                appName: event.payload.appName || "NA",
                envName: event.payload.envName || "NA",
                pipelineName: event.payload.pipelineName || "NA",
                imageTag: index >= 0 ? event.payload.dockerImageUrl.substring(index + 1) : "NA",
                comment: imageComment,
                tags: imageTagNames,
                imageApprovalLink: imageLink,
                approvalLink: approvalLink,
            };
        }
        else if (event.eventTypeId === 5) {
            var protectConfigFileType = void 0, protectConfigFileName = void 0, protectConfigComment = void 0, protectConfigLink = void 0, envName = void 0, approvalLink = void 0;
            if (event.payload.protectConfigFileType)
                protectConfigFileType = event.payload.protectConfigFileType;
            if (event.payload.protectConfigFileName)
                protectConfigFileName = event.payload.protectConfigFileName;
            if (event.payload.protectConfigComment)
                protectConfigComment = event.payload.protectConfigComment.split("\n");
            if (baseURL && event.payload.protectConfigLink)
                protectConfigLink = "".concat(baseURL).concat(event.payload.protectConfigLink);
            if (baseURL && event.payload.approvalLink)
                approvalLink = "".concat(baseURL).concat(event.payload.approvalLink);
            if (!event.payload.envName) {
                envName = "Base configuration";
            }
            return {
                eventTime: timestamp,
                triggeredBy: event.payload.triggeredBy || "NA",
                appName: event.payload.appName || "NA",
                envName: event.payload.envName || envName,
                protectConfigFileType: protectConfigFileType || "NA",
                protectConfigFileName: protectConfigFileName || "NA",
                protectConfigComment: protectConfigComment || [],
                protectConfigLink: protectConfigLink,
                approvalLink: approvalLink,
            };
        }
    };
    MustacheHelper.prototype.parseEventForWebhook = function (event) {
        var eventType;
        if (event.eventTypeId === 1) {
            eventType = "trigger";
        }
        else if (event.eventTypeId === 2) {
            eventType = "success";
        }
        else {
            eventType = "fail";
        }
        var devtronContainerImageTag = 'NA', devtronContainerImageRepo = 'NA';
        if (event.payload.dockerImageUrl) {
            var index = event.payload.dockerImageUrl.lastIndexOf(":");
            devtronContainerImageTag = event.payload.dockerImageUrl.substring(index + 1);
            devtronContainerImageRepo = event.payload.dockerImageUrl.substring(0, index);
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
            devtronContainerImageTag: devtronContainerImageTag,
            devtronContainerImageRepo: devtronContainerImageRepo,
            devtronApprovedByEmail: event.payload.approvedByEmail,
        };
    };
    MustacheHelper.prototype.modifyWebhookData = function (webhookDataMap, gitUrl, isMergedTypeWebhook) {
        if (isMergedTypeWebhook) {
            // set target checkout link
            var _targetCheckout = webhookDataMap["target checkout"];
            if (_targetCheckout) {
                webhookDataMap["target checkout link"] = this.createGitCommitUrl(gitUrl, _targetCheckout);
                webhookDataMap["target checkout"] = _targetCheckout.substring(0, 8);
            }
            else {
                webhookDataMap["target checkout"] = "NA";
            }
            // set source checkout link
            var _sourceCheckout = webhookDataMap["source checkout"];
            if (_sourceCheckout) {
                webhookDataMap["source checkout link"] = this.createGitCommitUrl(gitUrl, _sourceCheckout);
                webhookDataMap["source checkout"] = _sourceCheckout.substring(0, 8);
            }
            else {
                webhookDataMap["source checkout"] = "NA";
            }
        }
        // removing space from all keys of data map , as rendering issue with space in key in mustashe template
        var _modifiedDataMap = {};
        Object.keys(webhookDataMap).forEach(function (_key) {
            var _modifiedKey = _key.replace(/\s/g, '');
            _modifiedDataMap[_modifiedKey] = webhookDataMap[_key];
        });
        return _modifiedDataMap;
    };
    return MustacheHelper;
}());
exports.MustacheHelper = MustacheHelper;
var WebhookData = /** @class */ (function () {
    function WebhookData() {
    }
    return WebhookData;
}());

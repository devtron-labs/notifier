"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotification = void 0;
var notifme_sdk_1 = require("notifme-sdk");
var express_1 = require("express");
function sendNotification() {
    var notifmeSdk = new notifme_sdk_1.default({
        useNotificationCatcher: true,
        channels: {
            slack: {
                providers: [{
                        type: 'webhook',
                        webhookUrl: 'https://hooks.slack.com/services/abc'
                    }]
            }
        }
    }); // empty config = all providers are set to console.log
    notifmeSdk
        .send({
        slack: {
            // text: "devtron-cd-boat",
            username: "DevTron Bot",
            icon_url: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
            attachments: [{
                    fallback: "pipeline triggerd",
                    color: "#36a64f",
                    // author_name: "devtron cd boat",
                    // author_link: "http://devtron.ai",
                    // author_icon: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
                    title: "devtron cd alerts",
                    title_link: "http://devtron.ai",
                    text: "optional text",
                    fields: [
                        {
                            title: "Priority",
                            value: "High",
                            short: false
                        },
                        {
                            title: "Priority2",
                            value: "High",
                            short: true
                        },
                        {
                            title: "Priority3",
                            value: "High",
                            short: true
                        }
                    ],
                    // image_url: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
                    // thumb_url: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
                    footer: "devtron boat footer",
                    footer_icon: "string",
                    ts: 123456789
                }]
        }
    }).then(function (r) {
        console.log(express_1.response.json());
    }).catch(function (error) {
        console.error(error);
    });
}
exports.sendNotification = sendNotification;

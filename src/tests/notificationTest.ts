import NotifmeSdk from 'notifme-sdk'
import { response } from 'express';


export function sendNotification() {
    const notifmeSdk = new NotifmeSdk({
        useNotificationCatcher: true,
        channels: {
            slack: {
                providers: [{
                    type: 'webhook',
                    webhookUrl: 'https://hooks.slack.com/services/abc'
                }]
            }
        }
    }) // empty config = all providers are set to console.log
    notifmeSdk
        .send(
            {
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
            }
        ).then((r)=>{
            console.log(response.json())
        }).catch((error)=>{
            console.error(error)
        })
}

// import * as mustache from 'mustache';
// import { readFileSync, writeFileSync } from 'fs';
// import { EventType, Event } from './notificationService';

// class TemplateService {
//     slackTemplateMap = new Map<EventType, string>();
//     constructor() {
//         const template = readFileSync('./template/slack.ci_success.template.mustache', 'utf-8');
//         this.slackTemplateMap.set(EventType.CI_SUCCESS, template)
//     }

//     getNotificationPayload(event: Event) {
//         if (this.slackTemplateMap.has(event.type)) {
//             let template = this.slackTemplateMap.get(event.type)

//         } else {
//             //err not supported
//         }

//     }

//     //const result = Mustache.render(template, hash);

// }
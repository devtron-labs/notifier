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

import { MustacheHelper } from '../common/mustacheHelper';
import { Event } from '../notification/service/notificationService';
import { EVENT_TYPE } from '../common/types';
import Mustache from 'mustache';

// Sample approval event based on the debug log
const approvalEvent: Event = {
    eventTypeId: EVENT_TYPE.Approval,
    pipelineId: 26,
    pipelineType: "CD",
    correlationId: "test-approval-correlation-id",
    eventTime: "2025-12-19T04:36:12Z",
    payload: {
        appName: "pk-restart-devtron",
        envName: "restart-env",
        pipelineName: "cd-26-2nam",
        triggeredBy: "admin",
        dockerImageUrl: "registry.example.com/app:21609cce-18-38",
        imageApprovalLink: "/dashboard/app/26/trigger?approval-node=11&search=&approval-state=pending",
        approvalLink: "/dashboard/app/26/trigger?approval-node=11&search=&approval-state=pending",
        imageTagNames: ["v1.0", "latest"],
        imageComment: "Test approval comment",
        providers: [
            { dest: 'slack', configId: 1 }
        ]
    },
    teamId: 1,
    appId: 26,
    envId: 1,
    clusterId: 1,
    isProdEnv: false,
    baseUrl: "https://devtron-ent-2.devtron.info"
};

// Slack approval template (Block Kit format)
const slackApprovalTemplate = `{
  "text": "🛎️ Image approval requested for {{appName}}",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🛎️ Image Approval Request"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Application:*\\n{{appName}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Environment:*\\n{{envName}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Pipeline:*\\n{{pipelineName}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Requested by:*\\n{{triggeredBy}}"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Image Tag:* \`{{imageTag}}\`\\n*Time:* <t:{{eventTime}}:f>"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View Request"
          },
          "url": "{{{imageApprovalLink}}}",
          "style": "primary"
        }
      ]
    }
  ]
}`;

/**
 * Validate Slack Block Kit structure
 */
function validateSlackBlockKit(payload: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!payload.text) {
        errors.push('Missing required field: text');
    }

    if (!payload.blocks || !Array.isArray(payload.blocks)) {
        errors.push('Missing or invalid blocks array');
        return { isValid: false, errors };
    }

    // Validate each block
    payload.blocks.forEach((block: any, index: number) => {
        if (!block.type) {
            errors.push(`Block ${index}: Missing type`);
        }

        // Validate button URLs are not HTML-encoded
        if (block.type === 'actions' && block.elements) {
            block.elements.forEach((element: any, elemIndex: number) => {
                if (element.type === 'button' && element.url) {
                    if (element.url.includes('&#x') || element.url.includes('&amp;')) {
                        errors.push(`Block ${index}, Element ${elemIndex}: URL is HTML-encoded: ${element.url}`);
                    }
                    // Validate URL format
                    if (!element.url.startsWith('http://') && !element.url.startsWith('https://')) {
                        errors.push(`Block ${index}, Element ${elemIndex}: Invalid URL format: ${element.url}`);
                    }
                }
            });
        }
    });

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Test function to validate approval template parsing
 */
export function testApprovalTemplateParsing() {
    console.log('\n=== APPROVAL TEMPLATE PARSING TEST ===\n');

    const mh = new MustacheHelper();

    // Parse the event
    const parsedEvent = mh.parseEvent(approvalEvent, true);
    console.log('1. Parsed Event Data:');
    console.log(JSON.stringify(parsedEvent, null, 2));

    // Render the template with Mustache
    console.log('\n2. Rendering Mustache Template...');
    const renderedTemplate = Mustache.render(slackApprovalTemplate, parsedEvent);
    console.log('Rendered Template (raw string):');
    console.log(renderedTemplate);

    // Parse the JSON
    console.log('\n3. Parsing JSON...');
    let slackPayload;
    try {
        slackPayload = JSON.parse(renderedTemplate);
        console.log('✅ JSON parsing successful');
        console.log('Final Slack Payload:');
        console.log(JSON.stringify(slackPayload, null, 2));
    } catch (error) {
        console.error('❌ JSON parsing failed:', error);
        return false;
    }

    // Validate Slack Block Kit structure
    console.log('\n4. Validating Slack Block Kit Structure...');
    const validationResults = validateSlackBlockKit(slackPayload);

    if (validationResults.isValid) {
        console.log('✅ All validations passed!');
        return slackPayload;
    } else {
        console.log('❌ Validation failed:');
        validationResults.errors.forEach(err => console.log(`  - ${err}`));
        return false;
    }
}

/**
 * Test sending notification to Slack
 * Set SLACK_WEBHOOK_URL environment variable to test actual sending
 */
export async function testSendToSlack() {
    const payload = testApprovalTemplateParsing();

    if (!payload) {
        console.log('\n❌ Cannot send to Slack - template validation failed');
        return;
    }

    const webhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!webhookUrl) {
        console.log('\n⚠️  SLACK_WEBHOOK_URL not set. Skipping actual Slack send test.');
        console.log('To test sending to Slack, set SLACK_WEBHOOK_URL environment variable.');
        return;
    }

    console.log('\n5. Sending to Slack...');

    try {
        const fetch = require('node-fetch');
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();

        if (response.ok) {
            console.log('✅ Successfully sent to Slack!');
            console.log('Response:', responseText);
        } else {
            console.log('❌ Slack API error:');
            console.log('Status:', response.status);
            console.log('Response:', responseText);
        }
    } catch (error) {
        console.error('❌ Error sending to Slack:', error);
    }
}

/**
 * Test the SQL template from approval-templates-fixed.sql
 */
export function testSQLTemplate() {
    console.log('\n=== TESTING SQL TEMPLATE (Image Approval) ===\n');

    const sqlTemplate = `{
  "text": "🛎️ Image approval requested for {{appName}}",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🛎️ Image Approval Request"
      }
    },
    {
      "type": "section",
      "fields": [
        {
          "type": "mrkdwn",
          "text": "*Application:*\\n{{appName}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Environment:*\\n{{envName}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Pipeline:*\\n{{pipelineName}}"
        },
        {
          "type": "mrkdwn",
          "text": "*Requested by:*\\n{{triggeredBy}}"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Image Tag:* \`{{imageTag}}\`\\n*Time:* <t:{{eventTime}}:f>{{#comment}}\\n*Comment:* {{comment}}{{/comment}}{{#tags}}\\n*Tags:* {{tags}}{{/tags}}"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "View Request"
          },
          "url": "{{{imageApprovalLink}}}",
          "style": "primary"
        }
      ]
    }
  ]
}`;

    const mh = new MustacheHelper();
    const parsedEvent = mh.parseEvent(approvalEvent, true);

    console.log('Rendering SQL template...');
    const rendered = Mustache.render(sqlTemplate, parsedEvent);

    try {
        const payload = JSON.parse(rendered);
        console.log('✅ SQL template renders valid JSON');

        const validation = validateSlackBlockKit(payload);
        if (validation.isValid) {
            console.log('✅ SQL template passes Slack validation');
            return payload;
        } else {
            console.log('❌ SQL template validation failed:');
            validation.errors.forEach(err => console.log(`  - ${err}`));
            return false;
        }
    } catch (error) {
        console.error('❌ SQL template produces invalid JSON:', error);
        return false;
    }
}

// Run tests if executed directly
if (require.main === module) {
    console.log('Running Approval Template Tests...\n');

    // Test the SQL template first
    const sqlPayload = testSQLTemplate();

    if (sqlPayload) {
        console.log('\n✅ SQL template is valid and ready to use!\n');
    } else {
        console.log('\n❌ SQL template has issues that need to be fixed!\n');
    }

    // Then test sending to Slack
    testSendToSlack().then(() => {
        console.log('\n=== Tests Complete ===');
    });
}


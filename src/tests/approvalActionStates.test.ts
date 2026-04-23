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

// Slack template for image approval with action states
const imageApprovalTemplate = `{
  "text": "{{#isApprovalRequested}}🛎️ Image approval requested for {{appName}}{{/isApprovalRequested}}{{#isApprovalApproved}}✅ Image approval approved for {{appName}}{{/isApprovalApproved}}{{#isApprovalCancelled}}❌ Image approval cancelled for {{appName}}{{/isApprovalCancelled}}",
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "{{#isApprovalRequested}}🛎️ Image Approval Request{{/isApprovalRequested}}{{#isApprovalApproved}}✅ Image Approval Approved{{/isApprovalApproved}}{{#isApprovalCancelled}}❌ Image Approval Cancelled{{/isApprovalCancelled}}"
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
          "text": "{{#isApprovalRequested}}*Requested by:*{{/isApprovalRequested}}{{#isApprovalApproved}}*Approved by:*{{/isApprovalApproved}}{{#isApprovalCancelled}}*Cancelled by:*{{/isApprovalCancelled}}\\n{{triggeredBy}}"
        }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Image Tag:* \`{{imageTag}}\`"
      }
    }
  ]
}`;

/**
 * Test approval template with different action states
 */
export function testApprovalActionStates() {
    console.log('\n=== TESTING APPROVAL ACTION STATES ===\n');
    const mh = new MustacheHelper();

    // Test data for different approval states
    const testCases = [
        {
            name: 'Requested State',
            approvalAction: 'requested',
            expectedText: '🛎️ Image approval requested',
            expectedHeader: '🛎️ Image Approval Request',
            expectedLabel: 'Requested by'
        },
        {
            name: 'Approved State',
            approvalAction: 'approved',
            expectedText: '✅ Image approval approved',
            expectedHeader: '✅ Image Approval Approved',
            expectedLabel: 'Approved by'
        },
        {
            name: 'Cancelled State',
            approvalAction: 'cancelled',
            expectedText: '❌ Image approval cancelled',
            expectedHeader: '❌ Image Approval Cancelled',
            expectedLabel: 'Cancelled by'
        },
        {
            name: 'No Action (defaults to Requested)',
            approvalAction: undefined,
            expectedText: '🛎️ Image approval requested',
            expectedHeader: '🛎️ Image Approval Request',
            expectedLabel: 'Requested by'
        }
    ];

    let allTestsPassed = true;

    testCases.forEach((testCase, index) => {
        console.log(`\n--- Test ${index + 1}: ${testCase.name} ---`);

        // Create event
        const event: Event = {
            eventTypeId: EVENT_TYPE.Approval,
            pipelineId: 26,
            pipelineType: 'CD',
            correlationId: `test-${index}`,
            eventTime: '2025-02-09T10:00:00Z',
            payload: {
                appName: 'test-app',
                envName: 'production',
                pipelineName: 'deploy-pipeline',
                triggeredBy: 'john.doe@example.com',
                dockerImageUrl: 'registry.example.com/app:v1.0.0',
                imageApprovalLink: '/dashboard/approval',
                approvalAction: testCase.approvalAction
            },
            teamId: 1,
            appId: 1,
            envId: 1,
            clusterId: 1,
            isProdEnv: true,
            baseUrl: 'https://example.com'
        };

        try {
            // Parse event
            const parsedEvent = mh.parseEvent(event, true);
            console.log(`Parsed event flags:`, {
                isApprovalRequested: parsedEvent['isApprovalRequested'],
                isApprovalApproved: parsedEvent['isApprovalApproved'],
                isApprovalCancelled: parsedEvent['isApprovalCancelled']
            });

            // Render template
            const rendered = Mustache.render(imageApprovalTemplate, parsedEvent);
            const payload = JSON.parse(rendered);

            // Validate results
            const textContains = payload.text.includes(testCase.expectedText);
            const headerContains = payload.blocks[0].text.text.includes(testCase.expectedHeader);
            const labelContains = payload.blocks[1].fields[1].text.includes(testCase.expectedLabel);

            if (textContains && headerContains && labelContains) {
                console.log('✅ Test PASSED');
            } else {
                console.log('❌ Test FAILED');
                console.log(`  Text check: ${textContains ? '✅' : '❌'} (expected: ${testCase.expectedText})`);
                console.log(`  Header check: ${headerContains ? '✅' : '❌'} (expected: ${testCase.expectedHeader})`);
                console.log(`  Label check: ${labelContains ? '✅' : '❌'} (expected: ${testCase.expectedLabel})`);
                console.log(`  Rendered text: ${payload.text}`);
                console.log(`  Rendered header: ${payload.blocks[0].text.text}`);
                allTestsPassed = false;
            }
        } catch (error) {
            console.log('❌ Test FAILED with error:', error);
            allTestsPassed = false;
        }
    });

    console.log('\n=== SUMMARY ===');
    if (allTestsPassed) {
        console.log('✅ All tests passed! Templates are working correctly.');
    } else {
        console.log('❌ Some tests failed. Please review the output above.');
    }

    return allTestsPassed;
}

/**
 * Test config approval template
 */
export function testConfigApprovalActionStates() {
    console.log('\n=== TESTING CONFIG APPROVAL ACTION STATES ===\n');
    const mh = new MustacheHelper();

    const event: Event = {
        eventTypeId: EVENT_TYPE.ConfigApproval,
        pipelineId: 26,
        pipelineType: 'CD',
        correlationId: 'test-config-approval',
        eventTime: '2025-02-09T10:00:00Z',
        payload: {
            appName: 'test-app',
            envName: 'production',
            triggeredBy: 'jane.doe@example.com',
            protectConfigFileType: 'ConfigMap',
            protectConfigFileName: 'app-config',
            protectConfigComment: 'Updated database connection string',
            protectConfigLink: '/dashboard/config/approval',
            approvalAction: 'requested'
        },
        teamId: 1,
        appId: 1,
        envId: 1,
        clusterId: 1,
        isProdEnv: true,
        baseUrl: 'https://example.com'
    };

    try {
        const parsedEvent = mh.parseEvent(event, true);
        console.log('Parsed event for config approval:', {
            appName: parsedEvent['appName'],
            protectConfigFileType: parsedEvent['protectConfigFileType'],
            isApprovalRequested: parsedEvent['isApprovalRequested'],
            isApprovalApproved: parsedEvent['isApprovalApproved'],
            isApprovalCancelled: parsedEvent['isApprovalCancelled']
        });

        // Simple template test
        const simpleTemplate = '{{#isApprovalRequested}}Request{{/isApprovalRequested}}{{#isApprovalApproved}}Approved{{/isApprovalApproved}}';
        const rendered = Mustache.render(simpleTemplate, parsedEvent);
        
        if (rendered === 'Request') {
            console.log('✅ Config approval test PASSED');
            return true;
        } else {
            console.log('❌ Config approval test FAILED');
            console.log(`  Expected: "Request", Got: "${rendered}"`);
            return false;
        }
    } catch (error) {
        console.log('❌ Config approval test FAILED with error:', error);
        return false;
    }
}

// Run tests if executed directly
if (require.main === module) {
    console.log('Running Approval Action State Tests...\n');
    
    const imageApprovalPassed = testApprovalActionStates();
    const configApprovalPassed = testConfigApprovalActionStates();
    
    if (imageApprovalPassed && configApprovalPassed) {
        console.log('\n✅✅✅ ALL TESTS PASSED! ✅✅✅');
        console.log('Templates are ready to use.');
        process.exit(0);
    } else {
        console.log('\n❌ SOME TESTS FAILED');
        process.exit(1);
    }
}

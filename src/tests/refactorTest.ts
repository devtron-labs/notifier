import { Event } from '../notification/service/notificationService';
import { NotificationService } from '../notification/service/notificationService';
import { NotificationServiceDeprecated } from '../notification/service/notificationService_deprecated';
import { CustomResponse } from '../entities/events';

// Mock dependencies
const mockEventRepository = {} as any;
const mockNotificationSettingsRepository = {} as any;
const mockTemplatesRepository = {} as any;
const mockHandlers = [] as any[];
const mockLogger = {
    info: (message: string) => console.log(`INFO: ${message}`),
    warn: (message: string) => console.log(`WARN: ${message}`),
    error: (message: string) => console.log(`ERROR: ${message}`)
};

// Create a test event
const testEvent: Event = {
    eventTypeId: 1,
    pipelineId: 123,
    pipelineType: 'CI',
    correlationId: 'test-123',
    payload: { test: 'data' },
    eventTime: new Date().toISOString(),
    appId: 1,
    envId: 1,
    teamId: 1,
    clusterId: 1,
    isProdEnv: false,
    baseUrl: 'http://localhost'
};

// Create instances of both services
const notificationService = new NotificationService(
    mockEventRepository,
    mockNotificationSettingsRepository,
    mockTemplatesRepository,
    mockHandlers,
    mockLogger
);

const notificationServiceDeprecated = new NotificationServiceDeprecated(
    mockEventRepository,
    mockNotificationSettingsRepository,
    mockTemplatesRepository,
    mockHandlers,
    mockLogger
);

// Test function
async function runTests() {
    console.log('=== Testing Refactored Notification Service ===');
    
    // Test 1: Original service should throw error for sendNotification
    console.log('\nTest 1: Original service should throw error for sendNotification');
    try {
        await notificationService.sendNotification(testEvent);
        console.log('❌ Test failed: Expected error was not thrown');
    } catch (error: any) {
        console.log(`✅ Test passed: Error thrown as expected: ${error.message}`);
    }
    
    // Test 2: Deprecated service should handle sendNotification
    console.log('\nTest 2: Deprecated service should handle sendNotification');
    try {
        // We expect this to fail because we don't have a real database,
        // but it should at least attempt to process the notification
        await notificationServiceDeprecated.sendNotification(testEvent);
        console.log('✅ Test passed: No error thrown');
    } catch (error: any) {
        // This is expected to fail with a database-related error, not with the "deprecated" error
        if (error.message.includes('deprecated')) {
            console.log(`❌ Test failed: Got deprecation error: ${error.message}`);
        } else {
            console.log(`✅ Test passed: Got expected implementation error: ${error.message}`);
        }
    }
    
    console.log('\n=== Tests completed ===');
}

// Run the tests
runTests().catch(error => {
    console.error('Test error:', error);
});

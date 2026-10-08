import { expect } from 'chai';
import { SlackService } from '../destination/destinationHandlers/slackHandler';
import { MustacheHelper } from '../common/mustacheHelper';
import { Event } from '../notification/service/notificationService';
import { EVENT_TYPE } from '../common/types';

describe('slack eventTime', () => {
    it('renders eventTime as an unescaped Slack <!date> token inside valid JSON', async () => {
        let sent: any;
        const sdk: any = { send: async (req: any) => { sent = req.slack; return { status: 'success' }; } };
        const slack = new SlackService(null, null, null, console, new MustacheHelper());
        const template = '{"text": "*Time:* {{eventTime}} by {{triggeredBy}}"}';
        const e = { eventTypeId: EVENT_TYPE.Approval, eventTime: '2025-02-09T10:00:00Z', payload: { triggeredBy: 'a"b' } };

        await slack.sendNotification(e as Event, sdk, template);

        expect(sent.text).to.equal('*Time:* <!date^1739095200^{date_long} {time}|9 Feb 2025 10:00 AM UTC> by a&quot;b'); // other values stay escaped, keeping the JSON valid
    });
});

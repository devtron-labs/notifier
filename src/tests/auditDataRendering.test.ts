import { expect } from 'chai';
import axios from 'axios';
import { WebhookService } from '../destination/destinationHandlers/webhookHandler';
import { SlackService } from '../destination/destinationHandlers/slackHandler';
import { SESService } from '../destination/destinationHandlers/sesHandler';
import { SMTPService } from '../destination/destinationHandlers/smtpHandler';
import { MustacheHelper } from '../common/mustacheHelper';
import { Event } from '../notification/service/notificationService';
import { EVENT_TYPE } from '../common/types';

// A representative audit event - matches what AuditNotifier.buildTemplateData (Go
// side) actually sends as event.payload.auditData.
const auditEvent = {
    eventTypeId: EVENT_TYPE.AuditLogNotification,
    eventTime: '2026-10-27T08:00:00Z',
    payload: {
        auditData: {
            auditModule: 'User Management',
            auditResource: 'User',
            auditAction: 'Create',
            auditUpdatedBy: 'admin@example.com',
            auditRole: 'Super Admin',
            auditClientIp: '10.0.0.1',
            auditRequestMethod: 'POST',
            auditApiResponseCode: 200,
            auditResponseTime: 12345678,
            auditEventTime: '2026-10-27T08:00:00+0000',
            auditResourceName: 'User: "quoted" & special',
        },
    },
};

describe('audit data rendering per channel', () => {
    it('webhook: renders auditData into the POST body, unescaped so quotes/ampersands stay valid JSON', async () => {
        const originalPost = axios.post;
        let posted: any;
        (axios as any).post = async (url: string, body: any) => { posted = { url, body }; return { data: { ok: true } }; };
        try {
            const webhook = new WebhookService(null, null, null, console, new MustacheHelper());
            const template = '{"text": "Audit: {{&auditModule}} / {{&auditAction}} - {{&auditResourceName}}"}';
            await webhook.sendNotification(auditEvent as Event, 'https://example.com/webhook', template);

            expect(posted.url).to.equal('https://example.com/webhook');
            expect(posted.body.text).to.equal('Audit: User Management / Create - User: "quoted" & special');
        } finally {
            (axios as any).post = originalPost;
        }
    });

    it('slack: renders auditData the same way, unescaped', async () => {
        let sent: any;
        const sdk: any = { send: async (req: any) => { sent = req.slack; return { status: 'success' }; } };
        const slack = new SlackService(null, null, null, console, new MustacheHelper());
        const template = '{"text": "Audit: {{&auditModule}} / {{&auditAction}} - {{&auditResourceName}}"}';

        await slack.sendNotification(auditEvent as Event, sdk, template);

        expect(sent.text).to.equal('Audit: User Management / Create - User: "quoted" & special');
    });

    it('ses: renders auditData plus fromEmail/toEmail set separately from auditData', async () => {
        let sentEmail: any;
        const sdk: any = { send: async (req: any) => { sentEmail = req.email; return { status: 'success' }; } };
        const ses = new SESService(null, null, null, null, console, new MustacheHelper());
        const template = '{"from":"{{fromEmail}}","to":"{{toEmail}}","subject":"Audit: {{&auditModule}}"}';
        const event = { ...auditEvent, payload: { ...auditEvent.payload, fromEmail: 'noreply@devtron.ai', toEmail: 'admin@company.com' } };

        await ses.sendNotification(event as Event, sdk, template);

        expect(sentEmail.from).to.equal('noreply@devtron.ai');
        expect(sentEmail.to).to.equal('admin@company.com');
        expect(sentEmail.subject).to.equal('Audit: User Management');
    });

    it('smtp: renders auditData plus fromEmail/toEmail set separately from auditData', async () => {
        let sentEmail: any;
        const sdk: any = { send: async (req: any) => { sentEmail = req.email; return { status: 'success' }; } };
        const smtp = new SMTPService(null, null, null, null, console, new MustacheHelper());
        const template = '{"from":"{{fromEmail}}","to":"{{toEmail}}","subject":"Audit: {{&auditModule}}"}';
        const event = { ...auditEvent, payload: { ...auditEvent.payload, fromEmail: 'noreply@devtron.ai', toEmail: 'admin@company.com' } };

        await smtp.sendNotification(event as Event, sdk, template);

        expect(sentEmail.from).to.equal('noreply@devtron.ai');
        expect(sentEmail.to).to.equal('admin@company.com');
        expect(sentEmail.subject).to.equal('Audit: User Management');
    });
});

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
function buildEvent(resourceName: string, extraPayload: Record<string, any> = {}) {
    return {
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
                auditResourceName: resourceName,
            },
            ...extraPayload,
        },
    } as unknown as Event;
}

async function stubbedWebhookPost<T>(fn: () => Promise<T>): Promise<{ result: T; posted: any }> {
    const originalPost = axios.post;
    let posted: any;
    (axios as any).post = async (url: string, body: any) => { posted = { url, body }; return { data: { ok: true } }; };
    try {
        const result = await fn();
        return { result, posted };
    } finally {
        (axios as any).post = originalPost;
    }
}

describe('audit data rendering per channel', () => {
    const quotedResourceName = 'User: "quoted" & special';

    it('webhook: a quote in the resource name stays valid JSON ({{&field}} form)', async () => {
        const webhook = new WebhookService(null, null, null, console, new MustacheHelper());
        const template = '{"text": "Audit: {{&auditModule}} / {{&auditAction}} - {{&auditResourceName}}"}';
        const { posted } = await stubbedWebhookPost(() =>
            webhook.sendNotification(buildEvent(quotedResourceName), 'https://example.com/webhook', template)
        );
        expect(posted.body.text).to.equal('Audit: User Management / Create - User: "quoted" & special');
    });

    it('webhook: the same quote also stays valid JSON with the plain {{field}} form admins are used to', async () => {
        const webhook = new WebhookService(null, null, null, console, new MustacheHelper());
        const template = '{"text": "Audit: {{auditModule}} / {{auditAction}} - {{auditResourceName}}"}';
        const { posted } = await stubbedWebhookPost(() =>
            webhook.sendNotification(buildEvent(quotedResourceName), 'https://example.com/webhook', template)
        );
        expect(posted.body.text).to.equal('Audit: User Management / Create - User: "quoted" & special');
    });

    it('slack: a quote in the resource name stays valid JSON, both {{&field}} and plain {{field}} forms', async () => {
        // Slack's own message format requires a literal & to be sent escaped as &amp;
        // to display correctly - slackSafeAuditData escapes it for exactly that reason,
        // same as < and >.
        const slack = new SlackService(null, null, null, console, new MustacheHelper());
        for (const template of [
            '{"text": "Audit: {{&auditModule}} - {{&auditResourceName}}"}',
            '{"text": "Audit: {{auditModule}} - {{auditResourceName}}"}',
        ]) {
            let sent: any;
            const sdk: any = { send: async (req: any) => { sent = req.slack; return { status: 'success' }; } };
            await slack.sendNotification(buildEvent(quotedResourceName), sdk, template);
            expect(sent.text).to.equal('Audit: User Management - User: "quoted" &amp; special');
        }
    });

    it('slack: a resource name containing Slack link markup is neutralized, not rendered as a clickable link', async () => {
        const maliciousName = '<https://evil.example/login|Reset your Devtron password>';
        const slack = new SlackService(null, null, null, console, new MustacheHelper());
        const template = '{"text": "{{&auditResourceName}}"}';
        let sent: any;
        const sdk: any = { send: async (req: any) => { sent = req.slack; return { status: 'success' }; } };

        await slack.sendNotification(buildEvent(maliciousName), sdk, template);

        expect(sent.text).to.not.include('<https://evil.example');
        expect(sent.text).to.equal('&lt;https://evil.example/login|Reset your Devtron password&gt;');
    });

    it('ses: a resource name containing a real HTML link is neutralized, not rendered as a clickable link', async () => {
        const maliciousName = '<a href="https://evil.example/login">Reset your Devtron password</a>';
        const ses = new SESService(null, null, null, null, console, new MustacheHelper());
        const template = '{"from":"{{fromEmail}}","to":"{{toEmail}}","subject":"x","html":"{{&auditResourceName}}"}';
        const event = buildEvent(maliciousName, { fromEmail: 'noreply@devtron.ai', toEmail: 'admin@company.com' });
        let sentEmail: any;
        const sdk: any = { send: async (req: any) => { sentEmail = req.email; return { status: 'success' }; } };

        await ses.sendNotification(event, sdk, template);

        expect(sentEmail.html).to.not.include('<a href=');
        expect(sentEmail.html).to.equal('&lt;a href=&quot;https://evil.example/login&quot;&gt;Reset your Devtron password&lt;/a&gt;');
    });

    it('smtp: a resource name containing a real HTML link is neutralized, not rendered as a clickable link', async () => {
        const maliciousName = '<a href="https://evil.example/login">Reset your Devtron password</a>';
        const smtp = new SMTPService(null, null, null, null, console, new MustacheHelper());
        const template = '{"from":"{{fromEmail}}","to":"{{toEmail}}","subject":"x","html":"{{&auditResourceName}}"}';
        const event = buildEvent(maliciousName, { fromEmail: 'noreply@devtron.ai', toEmail: 'admin@company.com' });
        let sentEmail: any;
        const sdk: any = { send: async (req: any) => { sentEmail = req.email; return { status: 'success' }; } };

        await smtp.sendNotification(event, sdk, template);

        expect(sentEmail.html).to.not.include('<a href=');
        expect(sentEmail.html).to.equal('&lt;a href=&quot;https://evil.example/login&quot;&gt;Reset your Devtron password&lt;/a&gt;');
    });

    it('ses: fromEmail/toEmail render correctly alongside the escaped auditData', async () => {
        let sentEmail: any;
        const sdk: any = { send: async (req: any) => { sentEmail = req.email; return { status: 'success' }; } };
        const ses = new SESService(null, null, null, null, console, new MustacheHelper());
        const template = '{"from":"{{fromEmail}}","to":"{{toEmail}}","subject":"Audit: {{&auditModule}}"}';
        const event = buildEvent('User', { fromEmail: 'noreply@devtron.ai', toEmail: 'admin@company.com' });

        await ses.sendNotification(event, sdk, template);

        expect(sentEmail.from).to.equal('noreply@devtron.ai');
        expect(sentEmail.to).to.equal('admin@company.com');
        expect(sentEmail.subject).to.equal('Audit: User Management');
    });

    it('smtp: fromEmail/toEmail render correctly alongside the escaped auditData', async () => {
        let sentEmail: any;
        const sdk: any = { send: async (req: any) => { sentEmail = req.email; return { status: 'success' }; } };
        const smtp = new SMTPService(null, null, null, null, console, new MustacheHelper());
        const template = '{"from":"{{fromEmail}}","to":"{{toEmail}}","subject":"Audit: {{&auditModule}}"}';
        const event = buildEvent('User', { fromEmail: 'noreply@devtron.ai', toEmail: 'admin@company.com' });

        await smtp.sendNotification(event, sdk, template);

        expect(sentEmail.from).to.equal('noreply@devtron.ai');
        expect(sentEmail.to).to.equal('admin@company.com');
        expect(sentEmail.subject).to.equal('Audit: User Management');
    });
});

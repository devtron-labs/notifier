import { expect } from 'chai';
import { sendPaced } from '../common/destinationRateLimiter';

describe('destinationRateLimiter', () => {
    it('returns immediately instead of waiting for the pacing delay', async () => {
        const key = `test-key-${Date.now()}`;
        const start = Date.now();
        sendPaced(key, async () => {});
        expect(Date.now() - start).to.be.lessThan(50);
    });

    it('spaces actual sends to the same key ~1s apart', async () => {
        const key = `test-key-${Date.now()}`;
        const sentAt: number[] = [];
        const start = Date.now();

        sendPaced(key, async () => { sentAt.push(Date.now() - start); });
        sendPaced(key, async () => { sentAt.push(Date.now() - start); });
        sendPaced(key, async () => { sentAt.push(Date.now() - start); });

        // Expected completion is ~2000ms (2 x 1000ms gaps); the margin above that is
        // slack for event-loop scheduling jitter when the full suite runs together,
        // not slack in the pacing guarantee itself (see the "at least 950ms" checks
        // below, which are the actual assertion).
        await new Promise((r) => setTimeout(r, 4500));

        expect(sentAt).to.have.lengthOf(3);
        expect(sentAt[1] - sentAt[0]).to.be.at.least(950);
        expect(sentAt[2] - sentAt[1]).to.be.at.least(950);
    }).timeout(7000);

    it('does not pace sends to different keys against each other', async () => {
        const keyA = `key-a-${Date.now()}`;
        const keyB = `key-b-${Date.now()}`;
        let sentA = false, sentB = false;

        sendPaced(keyA, async () => { sentA = true; });
        sendPaced(keyB, async () => { sentB = true; });

        await new Promise((r) => setTimeout(r, 50));
        expect(sentA).to.be.true;
        expect(sentB).to.be.true;
    });

    it('keeps sending queued items even if an earlier send in the queue fails', async () => {
        const key = `fail-key-${Date.now()}`;
        let secondSent = false;

        sendPaced(key, async () => { throw new Error('simulated send failure'); });
        sendPaced(key, async () => { secondSent = true; });

        await new Promise((r) => setTimeout(r, 1300));
        expect(secondSent).to.be.true;
    }).timeout(5000);
});

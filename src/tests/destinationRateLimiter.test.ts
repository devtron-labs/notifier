import { expect } from 'chai';
import { waitForDestinationTurn } from '../common/destinationRateLimiter';

describe('destinationRateLimiter', () => {
    it('spaces consecutive calls to the same key ~1s apart', async () => {
        const key = `test-key-${Date.now()}`;
        const start = Date.now();
        const elapsed: number[] = [];
        for (let i = 0; i < 3; i++) {
            await waitForDestinationTurn(key);
            elapsed.push(Date.now() - start);
        }
        expect(elapsed[1] - elapsed[0]).to.be.at.least(950);
        expect(elapsed[2] - elapsed[1]).to.be.at.least(950);
    }).timeout(5000);

    it('does not pace calls to different keys against each other', async () => {
        const keyA = `key-a-${Date.now()}`;
        const keyB = `key-b-${Date.now()}`;
        await waitForDestinationTurn(keyA); // reserves keyA's slot, no wait (first call)

        const start = Date.now();
        await waitForDestinationTurn(keyB); // must not wait behind keyA
        expect(Date.now() - start).to.be.lessThan(100);
    });

    it('serializes concurrent calls to the same key instead of letting them through together', async () => {
        const key = `concurrent-key-${Date.now()}`;
        const start = Date.now();
        const [t1, t2, t3] = await Promise.all([
            waitForDestinationTurn(key).then(() => Date.now() - start),
            waitForDestinationTurn(key).then(() => Date.now() - start),
            waitForDestinationTurn(key).then(() => Date.now() - start),
        ]);
        const sorted = [t1, t2, t3].sort((a, b) => a - b);
        expect(sorted[1] - sorted[0]).to.be.at.least(900);
        expect(sorted[2] - sorted[1]).to.be.at.least(900);
    }).timeout(5000);
});

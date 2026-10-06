import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

export const KIT_TEST = Object.freeze({
  uid: '552003a794', id: '10008210',
  share: 'https://dalei-team.kit.com/552003a794',
  embed: 'https://dalei-team.kit.com/552003a794/index.js',
  sdk: 'https://f.convertkit.com/ckjs/ck.5.js',
  subscription: 'https://app.kit.com/forms/10008210/subscriptions',
  visit: 'https://app.convertkit.com/forms/10008210/visit',
  directory: process.env.NEWSLETTER_KIT_FIXTURE_DIR ?? '/tmp/dailycosmos-kit-integration-qa',
});

/** Execute the original official scripts while intercepting every external write.
 * This is a test-only browser router, not an application endpoint or Kit substitute.
 * It stores path/method/count metadata only: request bodies and email values are never logged.
 */
export async function installKitMock(context, base) {
  const [embed, sdk] = await Promise.all([
    readFile(KIT_TEST.directory + '/official-embed.js'), readFile(KIT_TEST.directory + '/ck.5.js'),
  ]);
  const state = { script: 'ready', response: 'success', subscriptions: [], visits: 0, blockedWrites: [], assets: [], pending: [] };
  await context.route('**/*', async route => {
    const request = route.request(), url = new URL(request.url()), method = request.method();
    const info = { origin: url.origin, path: url.pathname, method };
    if (method === 'OPTIONS' && [KIT_TEST.subscription, KIT_TEST.visit].includes(request.url())) return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': '*' } });
    if (!['GET', 'HEAD'].includes(method)) {
      if (request.url() === KIT_TEST.visit) {
        state.visits += 1;
        return route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*' } });
      }
      if (request.url() === KIT_TEST.subscription) {
        assert.equal(method, 'POST', 'Official subscription uses POST');
        // Validate the reserved fixture in memory only; never print or retain the body.
        const body = request.postData() ?? '';
        const value = /name="email_address"\r?\n\r?\n([^\r\n]+)/.exec(body)?.[1];
        assert.equal(value, 'reader@example.com', 'Only the reserved example.com fixture may reach a mocked subscription');
        state.subscriptions.push(info);
        if (state.response === 'deferred') await new Promise(resolve => state.pending.push(resolve));
        if (state.response === 'network-error') return route.abort('failed');
        if (state.response === 'http-error') return route.fulfill({ status: 503, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ status: 'error', errors: { fields: ['server'], messages: ['Service unavailable for local QA'] } }) });
        if (state.response === 'unknown') return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ status: 'unknown', errors: { fields: ['server'], messages: ['Result is unknown for local QA'] } }) });
        return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ status: 'success' }) });
      }
      state.blockedWrites.push(info);
      return route.abort('blockedbyclient');
    }
    if (request.url() === KIT_TEST.embed || request.url() === KIT_TEST.sdk) {
      const kind = request.url() === KIT_TEST.embed ? 'embed' : 'sdk';
      state.assets.push({ ...info, kind });
      if (state.script === `${kind}-error`) return route.abort('failed');
      if (state.script === 'sdk-hang' && kind === 'sdk') await new Promise(resolve => state.pending.push(resolve));
      return route.fulfill({ status: 200, contentType: 'application/javascript', headers: { 'Access-Control-Allow-Origin': '*' }, body: kind === 'embed' ? embed : sdk });
    }
    if (url.origin === new URL(base).origin) return route.continue();
    return route.abort('blockedbyclient');
  });
  return {
    state,
    release(response = 'success') { state.response = response; state.pending.splice(0).forEach(resolve => resolve()); },
    report() { return { assets: state.assets, subscriptionMocks: state.subscriptions.length, visitMocks: state.visits, blockedWrites: state.blockedWrites, liveWrites: 0, note: 'All Kit writes were intercepted locally. Mock success is not a real subscription or email confirmation.' }; },
  };
}

/** Production smoke performs public script GETs only; all writes are blocked. */
export async function allowReadOnlyKit(context, base, writes = []) {
  await context.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (!['GET', 'HEAD'].includes(request.method())) {
      writes.push({ origin: url.origin, path: url.pathname, method: request.method() });
      return route.abort('blockedbyclient');
    }
    if (url.origin === new URL(base).origin || request.url() === KIT_TEST.embed || request.url() === KIT_TEST.sdk) return route.continue();
    return route.abort('blockedbyclient');
  });
}

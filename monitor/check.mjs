import { pathToFileURL } from 'node:url';

const ORIGIN = 'https://web-arankey.vercel.app';

export async function checkPublicSite({ request = fetch, pause = ms => new Promise(resolve => setTimeout(resolve, ms)), attempts = 2 } = {}) {
  const checks = [];
  for (const [path, kind] of [['/', 'html'], ['/healthz', 'health'], ['/api/public/properties', 'properties']]) {
    let result;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const started = Date.now();
      try {
        const response = await request(ORIGIN + path, { redirect: 'error', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': 'ARANKEY-independent-availability-monitor' } });
        if (response.status !== 200) throw Error('HTTP_' + response.status);
        const body = await response.text();
        if (body.length > 2_000_000) throw Error('UNEXPECTED_RESPONSE_SIZE');
        if (kind === 'html') {
          if (!/<title>[^<]*ARANKEY/i.test(body) || !/\/assets\/[^" ]+\.js/.test(body)) throw Error('UNEXPECTED_HOME_PAGE');
        } else {
          let json; try { json = JSON.parse(body); } catch { throw Error('INVALID_JSON'); }
          if (kind === 'health' && json.status !== 'ok') throw Error('HEALTH_NOT_OK');
          if (kind === 'properties' && (json.success !== true || !Array.isArray(json.data))) throw Error('PUBLIC_SOURCE_NOT_AVAILABLE');
          if (kind === 'properties' && json.data.some(row => !row || typeof row !== 'object' || ['direccion', 'captador', 'responsableActual', 'observacionesActuales'].some(key => key in row))) throw Error('PRIVATE_FIELD_IN_PUBLIC_API');
        }
        result = { path, ok: true, status: 200, attempts: attempt, durationMs: Date.now() - started };
        break;
      } catch (error) {
        const known = /^(HTTP_\d+|UNEXPECTED_RESPONSE_SIZE|UNEXPECTED_HOME_PAGE|INVALID_JSON|HEALTH_NOT_OK|PUBLIC_SOURCE_NOT_AVAILABLE|PRIVATE_FIELD_IN_PUBLIC_API)$/.test(error.message);
        result = { path, ok: false, attempts: attempt, reason: known ? error.message : 'NETWORK_TLS_OR_TIMEOUT' };
        if (attempt < attempts) await pause(5000);
      }
    }
    checks.push(result);
  }
  return { checkedAt: new Date().toISOString(), origin: ORIGIN, ok: checks.every(check => check.ok), checks };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = await checkPublicSite();
  const test = process.env.ARANKEY_TEST_ALERT === 'true';
  if (test) { report.ok = false; report.notificationTest = true; }
  // Logs contain endpoint health only, never listing data, credentials or email addresses.
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exitCode = 1;
}

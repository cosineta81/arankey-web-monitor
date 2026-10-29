const repository = process.env.GITHUB_REPOSITORY;
if (repository !== 'cosineta81/arankey-web-monitor') throw Error('UNEXPECTED_MONITOR_REPOSITORY');
const report = JSON.parse(process.env.REPORT_JSON ?? '');
if (typeof report.ok !== 'boolean' || report.origin !== 'https://web-arankey.vercel.app' || !Array.isArray(report.checks)) throw Error('INVALID_MONITOR_REPORT');
const date = new Date().toISOString().slice(0, 10);
const url = `https://api.github.com/repos/${repository}/contents/history/${date}.json`;
const headers = { Authorization: `Bearer ${process.env.GITHUB_TOKEN}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' };
const existing = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
let sha;
if (existing.ok) sha = (await existing.json()).sha;
else if (existing.status !== 404) throw Error('HISTORY_READ_' + existing.status);
const result = await fetch(url, {
  method: 'PUT', headers,
  body: JSON.stringify({ message: `Daily availability sample ${date}`, content: Buffer.from(JSON.stringify(report, null, 2) + '\n').toString('base64'), ...(sha ? { sha } : {}) }),
  signal: AbortSignal.timeout(15000),
});
if (!result.ok) throw Error('HISTORY_WRITE_' + result.status);
console.log('Daily public availability sample saved. No CRM credentials are used.');

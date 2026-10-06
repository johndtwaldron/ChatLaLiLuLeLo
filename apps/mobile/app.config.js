const { execFileSync } = require('node:child_process');
const app = require('./app.json');
const { version } = require('../../version.json');
let commit = process.env.GITHUB_SHA || 'unknown';
try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch { /* Source archives may not include Git. */ }
module.exports = { ...app.expo, extra: { ...app.expo.extra, codecBuild: {
  version, timestamp: new Date().toISOString(), commit,
  kind: process.env.CI ? 'export' : 'local',
} } };

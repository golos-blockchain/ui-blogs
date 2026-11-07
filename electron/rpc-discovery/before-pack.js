'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
function verifyNative(root, platform, arch) {
  if (!['win32', 'linux'].includes(platform) || !['x64', 'arm64', 'ia32'].includes(arch)) throw Error('Unsupported discovery artifact target');
  const dir = path.join(root, 'native', 'rpc-discovery', platform + '-' + arch);
  const binary = path.join(dir, 'golos-rpc-directory-client' + (platform === 'win32' ? '.exe' : ''));
  let bytes, provenance;
  try { bytes = fs.readFileSync(binary); provenance = JSON.parse(fs.readFileSync(path.join(dir, 'provenance.json'), 'utf8')); } catch (_) { throw Error('Native RPC discovery artifact/provenance missing: ' + dir); }
  if (provenance.contract !== 'search-v1' || provenance.platform !== platform || provenance.arch !== arch || provenance.sourceRepository !== 'https://github.com/golos-blockchain/chain-node' || !/^[a-f0-9]{40}$/.test(provenance.sourceCommit) || provenance.sha256 !== crypto.createHash('sha256').update(bytes).digest('hex')) throw Error('Invalid native discovery provenance');
  if (platform === 'win32' && bytes.subarray(0, 2).toString() !== 'MZ') throw Error('Native client is not PE');
  if (platform === 'linux' && bytes.subarray(0, 4).toString('hex') !== '7f454c46') throw Error('Native client is not ELF');
  if (platform === 'linux') fs.accessSync(binary, fs.constants.X_OK);
  return binary;
}
async function beforePack(context) {
  const arch = typeof context.arch === 'string' ? context.arch : ({0: 'ia32', 1: 'x64', 3: 'arm64'})[context.arch];
  verifyNative(context.packager.projectDir, context.electronPlatformName, arch);
}
module.exports = beforePack;
module.exports.verifyNative = verifyNative;

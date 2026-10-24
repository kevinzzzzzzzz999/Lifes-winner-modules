#!/usr/bin/env python3
"""Publish only verified desktop assets, using an ephemeral repository token.

This script runs in the release job, after both architecture checks. Never
provide its token to compilation or application processes. It cannot replace
an existing public release or silently overwrite an existing asset.
"""
import argparse
import hashlib
import json
import mimetypes
import os
from pathlib import Path
import re
import urllib.error
import urllib.parse
import urllib.request


parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--assets', type=Path, required=True)
parser.add_argument('--notes', type=Path, required=True)
parser.add_argument('--version', required=True)
args = parser.parse_args()
assert re.fullmatch(r'(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)', args.version)
repository = os.environ['GITHUB_REPOSITORY']
assert re.fullmatch(r'[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+', repository)
revision = os.environ['GITHUB_SHA']
assert re.fullmatch(r'[a-f0-9]{40}', revision)
token = os.environ['GH_TOKEN']
api = 'https://api.github.com/repos/' + repository
tag = 'desktop-v' + args.version


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def request(url, method='GET', data=None, binary=False, content_type=None):
    # The token is restricted to these two official GitHub API origins.
    origin = urllib.parse.urlsplit(url)
    assert origin.scheme == 'https' and origin.hostname in {'api.github.com', 'uploads.github.com'}
    assert origin.port in {None, 443} and not origin.username and not origin.password and not origin.fragment
    payload = data if binary else json.dumps(data).encode() if data is not None else None
    headers = {'User-Agent': 'InkSpace-reviewed-desktop-release', 'Accept': 'application/vnd.github+json',
               'Authorization': 'Bearer ' + token, 'X-GitHub-Api-Version': '2026-03-10'}
    if payload is not None:
        headers['Content-Type'] = content_type or ('application/octet-stream' if binary else 'application/json')
    call = urllib.request.Request(url, data=payload, method=method, headers=headers)
    # urllib redirects are not expected for authenticated API writes.
    with urllib.request.build_opener(NoRedirect()).open(call, timeout=300) as result:
        return json.load(result)


manifest = json.loads((args.assets / 'desktop-apps.json').read_text())
assert manifest['version'] == args.version and manifest['sourceCommit'] == revision
assert manifest['personalSigningIdentityUsed'] is False and manifest['notarized'] is False
expected_names = {'InkSpace-Writing-macos-universal.zip', 'InkSpace-Preferences-macos-universal.zip',
                  'document-workbench-macos-arm64.zip', 'document-workbench-macos-x64.zip'}
assert {row['file'] for row in manifest['artifacts']} == expected_names
for row in manifest['artifacts']:
    file = args.assets / row['file']
    assert file.is_file() and not file.is_symlink()
    assert hashlib.sha256(file.read_bytes()).hexdigest() == row['sha256']
    assert file.stat().st_size == row['bytes']
metadata = {'desktop-apps.json', 'SHA256SUMS.txt', 'native-apps-release.json',
            'document-workbench-release.json', 'READ-ME-FIRST.md', 'desktop-validation.json'}
assert {file.name for file in args.assets.iterdir() if file.is_file()} == expected_names | metadata
validation = json.loads((args.assets / 'desktop-validation.json').read_text())
assert validation['passed'] is True and {row['architecture'] for row in validation['results']} == {'arm64', 'x64'}
for row in validation['results']:
    assert row['sourceCommit'] == revision and row['nativeStartupAndPersistence'] and row['packagedWorkbenchWindowAndTextPreview']
notes = args.notes.read_text().replace('{{ASSET_BASE}}', 'https://github.com/' + repository + '/releases/download/' + tag + '/')


def verify_tag(allow_missing):
    try:
        item = request(api + '/git/ref/tags/' + tag)['object']
    except urllib.error.HTTPError as error:
        if error.code == 404 and allow_missing:
            return False
        raise
    visited = set()
    for _ in range(8):
        if item['type'] == 'commit':
            assert item['sha'] == revision, 'Existing tag points to different source'
            return True
        assert item['type'] == 'tag' and item['sha'] not in visited
        visited.add(item['sha'])
        item = request(api + '/git/tags/' + item['sha'])['object']
    raise RuntimeError('Unsupported tag chain')


try:
    release = request(api + '/releases/tags/' + tag)
    if not release['draft']:
        raise RuntimeError('Release is already public; use a new version')
    assert release['target_commitish'] == revision
except urllib.error.HTTPError as error:
    if error.code != 404:
        raise
    release = None
if not verify_tag(allow_missing=True):
    try:
        request(api + '/git/refs', 'POST', {'ref': 'refs/tags/' + tag, 'sha': revision})
    except urllib.error.HTTPError as error:
        if error.code != 422:
            raise
        # Another attempt may have created the same tag. Never force-move it.
    verify_tag(allow_missing=False)
if release is None:
    release = request(api + '/releases', 'POST', {'tag_name': tag, 'target_commitish': revision,
                      'name': "Life's winner Mac 工具 " + args.version, 'body': notes, 'draft': True,
                      'prerelease': False, 'generate_release_notes': False})
verify_tag(allow_missing=False)
assets = {item['name']: item for item in request(api + '/releases/' + str(release['id']) + '/assets?per_page=100')}
assert set(assets).issubset(expected_names | metadata)
upload = release['upload_url'].split('{', 1)[0]
for name in sorted(expected_names | metadata):
    file = args.assets / name
    payload = file.read_bytes()
    digest = 'sha256:' + hashlib.sha256(payload).hexdigest()
    if name in assets:
        assert assets[name]['state'] == 'uploaded' and assets[name].get('digest') == digest
        continue
    item = request(upload + '?name=' + urllib.parse.quote(name), 'POST', payload, binary=True,
                   content_type=mimetypes.guess_type(name)[0] or 'application/octet-stream')
    assert item['state'] == 'uploaded' and item.get('digest') == digest
final = request(api + '/releases/' + str(release['id']), 'PATCH',
                {'draft': False, 'make_latest': 'true', 'body': notes})
print(json.dumps({'published': True, 'tag': tag, 'url': final['html_url'], 'assets': len(expected_names | metadata)}))

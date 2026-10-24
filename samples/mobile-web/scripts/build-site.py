#!/usr/bin/env python3
"""Build three separate local-only web apps, using an explicit runtime allowlist.

No dependency installation, credentials or environment-derived data are used.
The output folder must be new and outside this source directory.
"""
from pathlib import Path
import argparse
import base64
import hashlib
import html
import json
import struct
import zlib

SOURCE = Path(__file__).resolve().parent.parent
APPS = {'writing': '书写画板', 'preferences': '偏好方案', 'documents': '文档工作台'}
EN_NAMES = {'writing':'Writing','preferences':'Preferences','documents':'Documents'}
CSP = "default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-src 'none'"


def digest(data):
    return hashlib.sha256(data).hexdigest()


def icon(kind, size):
    """Draw original simple icons directly; PNG has no text, EXIF or extra chunks."""
    colors = {'writing': (37, 99, 235), 'preferences': (15, 118, 110), 'documents': (77, 73, 180)}
    background = colors[kind]
    def segment(x, y, a, b, width):
        vx, vy = b[0]-a[0], b[1]-a[1]
        t = max(0, min(1, ((x-a[0])*vx+(y-a[1])*vy)/(vx*vx+vy*vy)))
        return (x-a[0]-t*vx)**2+(y-a[1]-t*vy)**2 <= width*width
    def white(x, y):
        if kind == 'writing':
            return segment(x,y,(.28,.71),(.72,.27),.065) or segment(x,y,(.53,.73),(.76,.73),.025)
        if kind == 'preferences':
            for yy, xx in [(.3,.36),(.5,.65),(.7,.44)]:
                if segment(x,y,(.24,yy),(.76,yy),.021) or (x-xx)**2+(y-yy)**2 < .055**2:
                    return True
            return False
        return any(segment(x,y,a,b,.022) for a,b in [((.31,.23),(.31,.77)),((.31,.23),(.69,.23)),((.69,.23),(.69,.77)),((.69,.77),(.31,.77)),((.41,.4),(.59,.4)),((.41,.52),(.59,.52)),((.41,.64),(.55,.64))])
    raw = bytearray()
    for row in range(size):
        raw.append(0)
        for col in range(size):
            hits = sum(white((col+(sx+.5)/2)/size,(row+(sy+.5)/2)/size) for sx in range(2) for sy in range(2))
            raw.extend(round(c+(255-c)*hits/4) for c in background)
    def chunk(name, data):
        return struct.pack('>I',len(data))+name+data+struct.pack('>I',zlib.crc32(name+data)&0xffffffff)
    return b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(raw,9))+chunk(b'IEND',b'')


def prepare_html(text, slug):
    if '<head>' not in text or '</head>' not in text:
        raise ValueError('HTML document requires a head')
    # The source owns visible content; this build only adds platform metadata.
    metadata = '\n<meta http-equiv="Content-Security-Policy" content="'+html.escape(CSP,quote=True)+'">\n<meta name="referrer" content="no-referrer">\n'
    if slug:
        metadata += '<link rel="manifest" href="./manifest.json">\n<link rel="icon" href="./icon-192.png">\n<link rel="apple-touch-icon" href="./icon-180.png">\n<meta name="apple-mobile-web-app-capable" content="yes">\n<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-title" content="'+APPS[slug]+'">\n<meta name="theme-color" content="#ffffff">\n'
    return text.replace('<head>', '<head>'+metadata, 1)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args=parser.parse_args()
    output=args.output.resolve()
    if output.exists() or output == SOURCE or SOURCE in output.parents:
        raise SystemExit('Use a new output directory outside the source tree.')
    runtime=['index.html','privacy.html','shared.css','shared.js']
    for slug in APPS:
        runtime += [f'{slug}/{name}' for name in ('index.html','app.js','logic.js','styles.css')]
    # Validate all inputs before creating any output.
    for relative in runtime:
        p=SOURCE/relative
        if not p.is_file() or p.is_symlink():
            raise SystemExit('Missing or unsafe runtime input: '+relative)
    output.mkdir(parents=True)
    for relative in runtime:
        data=(SOURCE/relative).read_bytes()
        destination=output/relative
        destination.parent.mkdir(parents=True, exist_ok=True)
        if relative.endswith('.html'):
            data=prepare_html(data.decode(), relative.split('/')[0] if '/' in relative else None).encode()
        destination.write_bytes(data)
    groups={}
    versions={}
    for slug, name in APPS.items():
        manifest={'name':"Life's winner "+name,'short_name':name,'lang':'zh-CN','start_url':'./','scope':'./','display':'standalone','background_color':'#f5f7fb','theme_color':'#ffffff','description':name+'，独立安装、本机保存、离线使用。','icons':[{'src':f'./icon-{size}.png','sizes':f'{size}x{size}','type':'image/png','purpose':'any maskable'} for size in (192,512)]}
        manifest['name']=APPS[slug]+" · Life's winner "+EN_NAMES[slug]
        (output/slug/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
        english={**manifest,'name':"Life's winner "+EN_NAMES[slug]+' · '+APPS[slug],'short_name':EN_NAMES[slug],'lang':'en','description':EN_NAMES[slug]+'. Install independently, save locally and work offline.'}
        (output/slug/'manifest-en.json').write_text(json.dumps(english,ensure_ascii=False,indent=2)+'\n')
        for size in (180,192,512):
            (output/slug/f'icon-{size}.png').write_bytes(icon(slug,size))
        files=['shared.css','shared.js','privacy.html']+[p.relative_to(output).as_posix() for p in sorted((output/slug).iterdir())]
        groups[slug]=files
        versions[slug]=digest(''.join(path+digest((output/path).read_bytes()) for path in files).encode())[:20]
    integrity={path:'sha256-'+base64.b64encode(hashlib.sha256((output/path).read_bytes()).digest()).decode() for path in sorted(set(sum(groups.values(),[])))}
    template=(SOURCE/'scripts/service-worker.js').read_text()
    (output/'sw.js').write_text(template.replace('__APP_FILES__',json.dumps(groups,separators=(',',':'))).replace('__APP_VERSIONS__',json.dumps(versions,separators=(',',':'))).replace('__ASSET_INTEGRITY__',json.dumps(integrity,separators=(',',':'))))
    files=[{'path':p.relative_to(output).as_posix(),'bytes':p.stat().st_size,'sha256':digest(p.read_bytes())} for p in sorted(output.rglob('*')) if p.is_file()]
    (output/'site-manifest.json').write_text(json.dumps({'formatVersion':1,'apps':versions,'files':files},indent=2)+'\n')
    print(json.dumps({'apps':versions,'files':len(files)+1,'bytes':sum(r['bytes'] for r in files)}))


if __name__ == '__main__':
    main()

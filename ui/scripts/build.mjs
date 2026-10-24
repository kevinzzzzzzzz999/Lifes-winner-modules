import {build} from 'vite';
import postcss from 'postcss';
import {readFile,writeFile,cp,mkdir,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
const ui=fileURLToPath(new URL('../',import.meta.url)),require=createRequire(import.meta.url);
const css=postcss.parse(await readFile(path.join(ui,'src/foundation-original.css'),'utf8'));
css.walkRules(rule=>{if(rule.parent?.type==='atrule'&&/keyframes/i.test(rule.parent.name))return;rule.selectors=rule.selectors.map(selector=>selector.trim()===':root'||selector.trim()==='body'?'.inkspace-ui':':where(.inkspace-ui) '+selector);});
await writeFile(path.join(ui,'src/foundation.css'),css.toString()+`
.inkspace-ui{position:relative;min-width:0;min-height:0;width:100%;height:100%;}.inkspace-ui-host-error{padding:14px;border:1px solid #9b422f;background:#fff3ed;color:#61271b;font:14px/1.5 system-ui}.inkspace-ui-host-error button{margin-left:12px}.inkspace-ui>.SurfaceErrorBoundary{height:100%}`);
await build({configFile:path.join(ui,'vite.config.ts'),root:ui,logLevel:'warn'});
const tsc=path.resolve(path.dirname(require.resolve('typescript')),'../bin/tsc');const typecheck=spawnSync(process.execPath,[tsc,'-p',path.join(ui,'tsconfig.json')],{cwd:ui,encoding:'utf8'});if(typecheck.status!==0){process.stderr.write(typecheck.stdout+typecheck.stderr);process.exit(typecheck.status||1);}
// CSS is bundled separately. Internal CSS imports carry no public TypeScript API
// and would otherwise point at files that do not exist beside emitted .d.ts files.
async function cleanDeclarationStyles(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())await cleanDeclarationStyles(file);else if(entry.name.endsWith('.d.ts')){const text=await readFile(file,'utf8');await writeFile(file,text.replace(/^\s*import\s+['"][^'"\r\n]+\.css['"];?\s*$/gm,''));}}}
await cleanDeclarationStyles(path.join(ui,'dist/types'));
await writeFile(path.join(ui,'dist/style.css.d.ts'),'// Side-effect stylesheet entry; runtime content is dist/style.css.\nexport {};\n');
await mkdir(path.join(ui,'dist/math-lab'),{recursive:true});await cp(path.join(ui,'math-lab'),path.join(ui,'dist/math-lab'),{recursive:true});
console.log('InkSpace UI ESM library and declarations built.');

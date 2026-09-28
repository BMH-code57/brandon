import {spawn} from 'node:child_process';
// Translate the supervised preview flags while keeping the normal Next.js CLI.
const args=process.argv.slice(2).filter(value=>value!=='--strictPort').map(value=>value==='--host'?'--hostname':value);
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','dev','--hostname','0.0.0.0',...args],{stdio:'inherit',env:process.env});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??1));

import {spawn} from 'child_process';
const migrate=spawn(process.execPath,['scripts/migrate.mjs'],{stdio:'inherit',env:process.env});
migrate.on('exit',code=>{if(code!==0)process.exit(code||1);const port=process.env.PORT||'3000';const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p',port],{stdio:'inherit',env:process.env});child.on('exit',c=>process.exit(c||0));});

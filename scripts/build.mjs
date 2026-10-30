import { mkdir, copyFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const dist=resolve(root,'dist');
await rm(dist,{recursive:true,force:true});
await mkdir(dist,{recursive:true});
for(const file of ['index.html','styles.css','app.js','data.json','pricing.html','pricing.css','pricing.js','.nojekyll']) await copyFile(resolve(root,file),resolve(dist,file));
console.log('Static dashboard built to dist/');

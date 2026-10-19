import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.webp':'image/webp','.jpg':'image/jpeg','.css':'text/css','.png':'image/png','.mp4':'video/mp4','.webm':'video/webm','.ttf':'font/ttf','.json':'application/json'};
http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
 const file=path.resolve(root,'.'+(pathname==='/'?'/review.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return}
 fs.stat(file,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404).end();return}const headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Accept-Ranges':'bytes'};const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);if(range){const start=+range[1],end=range[2]?Math.min(+range[2],stat.size-1):stat.size-1;if(start>end){res.writeHead(416).end();return}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${stat.size}`,'Content-Length':end-start+1});fs.createReadStream(file,{start,end}).pipe(res)}else{res.writeHead(200,{...headers,'Content-Length':stat.size});fs.createReadStream(file).pipe(res)}})
}).listen(Number(process.env.PORT)||3025,'127.0.0.1',()=>console.log('GoodDo review: http://127.0.0.1:'+(Number(process.env.PORT)||3025)));


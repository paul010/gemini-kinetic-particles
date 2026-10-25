import { build } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { cp, mkdir, writeFile } from 'node:fs/promises';
const outDir = resolve(process.argv[2] || 'dist-agent-course');
if (outDir === process.cwd() || outDir === resolve('/')) throw new Error('Choose a dedicated classroom output directory.');
await build({ configFile:false, publicDir:false, plugins:[react()], build:{outDir,emptyOutDir:true,rollupOptions:{input:{classroom:resolve('copilot-agent-course/classroom.html')}}} });
await mkdir(resolve(outDir,'copilot-agent-course/materials'),{recursive:true});
await cp('public/copilot-agent-course/materials',resolve(outDir,'copilot-agent-course/materials'),{recursive:true});
await cp('public/copilot-agent-course-cover.svg',resolve(outDir,'copilot-agent-course-cover.svg'));
await writeFile(resolve(outDir,'serve.py'),`from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import os, webbrowser
os.chdir(Path(__file__).resolve().parent)
url = 'http://127.0.0.1:8933/copilot-agent-course/classroom.html'
print('课堂页面：' + url, flush=True)
server = ThreadingHTTPServer(('127.0.0.1', 8933), SimpleHTTPRequestHandler)
webbrowser.open(url)
server.serve_forever()
`);
await writeFile(resolve(outDir,'开始课堂.command'),`#!/bin/zsh
cd -- "$(dirname -- "$0")"
python3 serve.py
`,{mode:0o755});
await writeFile(resolve(outDir,'使用说明.md'),`# 五课案例实战｜课堂演示包

解压后双击“开始课堂.command”，保持终端窗口开启；关闭终端即可停止。
若系统询问脚本是否运行，请根据自己的设备规则处理。需要本机已有 Python 3。
也可在此目录打开终端运行：python3 -m http.server 8933 --bind 127.0.0.1
然后访问：http://127.0.0.1:8933/copilot-agent-course/classroom.html

页面、说明、测试、CSV和ZIP资料均在包内；网络不可用时仍可讲解与练习。
成片未打包：使用“选择本课本地视频”选入原有五课成片，只在本机播放，不上传。
每课先看成果，再按“拆思路、搭结构、跟着做、测结果、交作业”推进。投屏时方向键切换，Esc退出。
自检仅本机保存；实际 Agent/Flow 操作仍需真实平台、许可、获准连接与证据。
YouTube 与主页跳转需要网络。公司环境名称与真实账号不在本包中。
`);
console.log('Classroom bundle:',outDir);

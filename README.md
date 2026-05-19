# CF GDrive Proxy

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/shing-yu/cf-gdrive-proxy)

这是一个基于 Cloudflare Workers 构建的 Google Drive 文件下载代理工具。它可以帮助你轻松反代 Google Drive 的下载链接，改善部分地区的网络访问体验，并提供更顺畅的大文件下载流程。

## ✨ 核心特性

* 🚀 **自动绕过警告页**：当下载大文件遇到“Google 无法扫描此文件是否存在病毒”的警告页时，Worker 会在后台自动解析并提取时效令牌（Token），通过 302 重定向让用户直接开始下载，实现**无感跳过**。
* 🎨 **极简下载主页**：访问根目录（`/`）会提供一个没有任何文本的极简输入框 UI，只需粘贴 Google Drive 的文件 ID 并按回车，即可一键触发下载。
* ⚡️ **全节点加速**：利用 Cloudflare 的全球边缘网络，原生支持流式透传和断点续传（配合 IDM / Aria2 等工具效果更佳）。

## 💡 使用方法

部署完成后，你有两种方式进行下载：

1. **通过首页 UI 下载**：直接访问你的 Worker 域名，在页面中央的输入框中粘贴 Google Drive 文件 ID（例如：`1KvMU9sy8fQKKmVKU5xf_u3Y2JZefe0kt`），按下旁边蓝色的按钮或按回车键即可。
2. **通过直链拼接**：直接构造以下 URL 进行下载或分享：
   ```text
   https://<你的-Worker-域名>/download?id=<文件ID>&export=download

## English Version

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/shing-yu/cf-gdrive-proxy)

A Google Drive file download proxy built on Cloudflare Workers. It helps you seamlessly proxy Google Drive download links, improving network access and providing a smoother download experience for large files.

## ✨ Features

* 🚀 **Auto-Bypass Warning Pages**: When encountering the "Google cannot scan this file for viruses" warning for large files, the Worker automatically parses and extracts the temporary token in the background. It then redirects the user (via HTTP 302) to start the download directly, achieving a **seamless bypass**.
* 🎨 **Minimalist UI**: Accessing the root directory (`/`) provides a clean, text-free user interface. Just paste the Google Drive file ID and press Enter to trigger the download instantly.
* ⚡️ **Global Acceleration**: Leverages Cloudflare's global edge network, natively supporting stream passthrough and resumable downloads (highly recommended to use with download managers like IDM or Aria2).

## 💡 Usage

Once deployed, you can download files in two ways:

1. **Via the Web UI**: Visit your Worker's domain, paste the Google Drive file ID (e.g., `1KvMU9sy8fQKKmVKU5xf_u3Y2JZefe0kt`) into the central input box, and click the blue button or press Enter.
2. **Via Direct Link**: Construct the following URL for direct downloading or sharing:
   ```text
   https://<YOUR_WORKER_DOMAIN>/download?id=<FILE_ID>&export=download

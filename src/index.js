export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		const workerOrigin = url.origin;
		const targetHostname = 'drive.usercontent.google.com';

		// 1. 首页极简无文本 UI
		if (url.pathname === '/' && !url.searchParams.has('id')) {
			const html = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #ececec; }
    .box { display: flex; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden; }
    input { width: 260px; height: 44px; padding: 0 16px; border: none; outline: none; font-size: 16px; font-family: monospace; background: #fff; }
    button { width: 50px; height: 44px; border: none; background: #007aff; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #005bb5; }
    button:active { background: #004488; }
  </style>
</head>
<body>
  <div class="box">
    <input id="i" type="text" autocomplete="off" spellcheck="false">
    <button id="b"></button>
  </div>
  <script>
    const i = document.getElementById('i');
    const b = document.getElementById('b');
    const go = () => {
      const id = i.value.trim();
      if(id) window.location.href = '/download?id=' + id + '&export=download';
    };
    b.onclick = go;
    i.onkeydown = e => { if (e.key === 'Enter') go(); };
  </script>
</body>
</html>`;
			return new Response(html, {
				headers: { 'Content-Type': 'text/html;charset=UTF-8' }
			});
		}

		// 2. 构造发往 Google 的请求
		const googleUrl = new URL(request.url);
		googleUrl.hostname = targetHostname;
		googleUrl.protocol = 'https:';
		googleUrl.port = '';

		const modifiedRequest = new Request(googleUrl.toString(), {
			method: request.method,
			headers: request.headers,
			redirect: 'manual'
		});

		modifiedRequest.headers.set('Host', targetHostname);
		modifiedRequest.headers.delete('Origin');
		modifiedRequest.headers.delete('Referer');

		let response = await fetch(modifiedRequest);

		// [辅助函数] 处理 Google 的重定向
		const handleRedirect = (res) => {
			if ([301, 302, 303, 307, 308].includes(res.status)) {
				let location = res.headers.get('Location');
				if (location) {
					// 为了防止 Google 重定向到其他带有前缀的 googleusercontent 域名导致反代失效
					// 我们直接将 Location 中的 hostname 替换为你当前 Worker 的域名
					try {
						const locUrl = new URL(location);
						if (locUrl.hostname.includes('googleusercontent.com') || locUrl.hostname === 'drive.google.com') {
							locUrl.hostname = url.hostname;
							locUrl.port = url.port;
							location = locUrl.toString();
						}
					} catch (e) {
						location = location.replace(`https://${targetHostname}`, workerOrigin);
					}

					const newHeaders = new Headers(res.headers);
					newHeaders.set('Location', location);
					return new Response(res.body, {
						status: res.status,
						headers: newHeaders
					});
				}
			}
			return null;
		};

		let redirectResponse = handleRedirect(response);
		if (redirectResponse) return redirectResponse;

		// 3. 拦截 HTML 警告页并进行解析
		const contentType = response.headers.get('content-type') || '';
		if (contentType.includes('text/html')) {
			const htmlText = await response.text();

			if (htmlText.includes('download') && htmlText.includes('confirm')) {
				console.log("检测到疑似警告页面，正在尝试提取令牌...");

				const extract = (name) => {
					// 正向查找：name="..." 接着是 value="..."
					const reg = new RegExp(`name="${name}"[^>]*?value="([^"]*)"`);
					const match = htmlText.match(reg);
					if (match) return match[1] || null;
				};

				const confirm = extract('confirm');
				const uuid = extract('uuid');
				const at = extract('at');

				console.log(`提取结果: confirm=${confirm}, uuid=${uuid}, at=${at}`);

				if (confirm) {
					// 【核心修改】不直接请求内容，而是向用户的浏览器下发 302 重定向
					// 将目标设为当前的 Worker URL，并附加上提取到的 token 参数
					const redirectUrl = new URL(request.url);
					redirectUrl.searchParams.set('confirm', confirm);
					if (uuid) redirectUrl.searchParams.set('uuid', uuid);
					if (at) redirectUrl.searchParams.set('at', at);

					console.log("正在向用户浏览器发送 302 重定向: " + redirectUrl.toString());

					// 向浏览器发送 302，浏览器会带着参数再次请求你的 Worker
					return Response.redirect(redirectUrl.toString(), 302);
				}
			}

			// 提取失败或非警告页，原样返回
			return new Response(htmlText, {
				status: response.status,
				headers: response.headers
			});
		}

		// 4. 正常的数据流（文件下载）直接放行
		const finalHeaders = new Headers(response.headers);
		finalHeaders.set('Access-Control-Allow-Origin', '*');

		return new Response(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: finalHeaders
		});
	}
};

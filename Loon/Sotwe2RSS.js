/*
 * @name: Twitter RSS 生成器 (Sotwe Bridge) v2
 * @author: Gemini
 * @desc: 实时抓取 Sotwe 页面数据并生成 RSS XML。增强了请求头和错误反馈。
 * @use: http://myrss.loon/twitter/USERNAME
 */

const url = $request.url;
// 假设 URL 格式是 http://myrss.loon/twitter/USERNAME
const username = url.split("/").pop();
const targetUrl = `https://www.sotwe.com/${username}`;

console.log(`[Sotwe2RSS] Attempting to fetch: ${targetUrl}`);

const headers = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Referer": "https://www.sotwe.com/", // 增强反爬能力
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
};

$httpClient.get({ url: targetUrl, headers: headers }, (error, response, data) => {
    if (error || response.status !== 200) {
        console.error(`[Sotwe2RSS] Network Error: Status=${response?.status}, Error=${error}`);
        $done({ response: { status: response?.status || 500, body: `Sotwe Network Error or Status: ${response?.status}` } });
        return;
    }
    
    try {
        // 核心解析逻辑：提取 __NEXT_DATA__ JSON
        const regex = /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/;
        const match = data.match(regex);

        if (!match || !match[1]) {
            console.error(`[Sotwe2RSS] Parse Failure: __NEXT_DATA__ block not found.`);
            // 检查是否是 Sotwe 页面本身返回了错误
            if (data.includes("The user does not exist")) {
                 $done({ response: { status: 404, body: `User ${username} not found on Sotwe.` } });
                 return;
            }
            $done({ response: { status: 404, body: `Sotwe Layout Changed or Key Data Missing.` } });
            return;
        }

        const json = JSON.parse(match[1]);
        const posts = json.props?.pageProps?.data || [];
        const userProfile = json.props?.pageProps?.user || { name: username, screenName: username };
        
        // 确认数据是否有效
        if (posts.length === 0 && !userProfile.screenName) {
            console.warn(`[Sotwe2RSS] Warning: Parsed data is empty.`);
        }
        
        // --- 构造 RSS XML ---
        let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>${escapeXml(userProfile.name)} (@${userProfile.screenName})</title>
    <description>Twitter feed for ${userProfile.name} via Sotwe</description>
    <link>https://twitter.com/${username}</link>
    <generator>Loon Sotwe2RSS v2</generator>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>15</ttl>`;

        posts.forEach(post => {
            if (!post.id) return;
            const date = new Date(parseInt(post.createdAt));
            const link = `https://twitter.com/${username}/status/${post.id}`;
            let content = post.text || "";
            if (post.media && post.media.length > 0) {
                post.media.forEach(img => { content += `<br><img src="${img.url}" />`; });
            }
            if (post.quotedTweet) {
                content += `<br><blockquote><strong>${post.quotedTweet.user?.name}:</strong> ${post.quotedTweet.text}</blockquote>`;
            }
            rss += `<item><title>${escapeXml(post.text ? post.text.substring(0, 50) + "..." : "Media Post")}</title><description><![CDATA[${content}]]></description><pubDate>${date.toUTCString()}</pubDate><guid>${link}</guid><link>${link}</link></item>`;
        });
        rss += `</channel></rss>`;

        $done({
            response: { status: 200, headers: { "Content-Type": "application/xml" }, body: rss }
        });

    } catch (e) {
        console.error(`[Sotwe2RSS] Fatal Parse Error: ${e.message}`);
        $done({ response: { status: 500, body: `Fatal Parse Error: ${e.message}` } });
    }
});

function escapeXml(unsafe) {
    return unsafe ? unsafe.replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;'; case '\'': return '&apos;'; case '"': return '&quot;';
        }
    }) : "";
}

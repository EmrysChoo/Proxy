/*
 * Sotwe to RSS for Loon
 * Hosted on GitHub
 * Usage: 
 * 1. Add Script in Loon using the RAW URL
 * 2. Subscribe in RSS Reader: http://127.0.0.1/twitter/USERNAME
 */

const url = $request.url;
// 提取 URL 最后的部分作为用户名
const username = url.split("/").pop();
// 构造目标 Sotwe 链接
const targetUrl = `https://www.sotwe.com/${username}`;

const headers = {
    // 伪装成 Mac Chrome，防止被 Sotwe 拦截
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
};

$httpClient.get({ url: targetUrl, headers: headers }, (error, response, data) => {
    if (error) {
        $done({ response: { status: 500, body: "Network Error" } });
        return;
    }

    if (response.status !== 200) {
        $done({ response: { status: response.status, body: "Sotwe Error: " + response.status } });
        return;
    }

    try {
        // 核心逻辑：提取 Next.js 的 JSON 数据
        const regex = /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/;
        const match = data.match(regex);

        if (!match || !match[1]) {
            $done({ response: { status: 404, body: "User not found or Layout Changed" } });
            return;
        }

        const json = JSON.parse(match[1]);
        const posts = json.props?.pageProps?.data || [];
        const userProfile = json.props?.pageProps?.user || { name: username, screenName: username };

        // 构造 RSS XML 头部
        let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>${escapeXml(userProfile.name)} (@${userProfile.screenName})</title>
    <description>Twitter feed for ${userProfile.name} via Sotwe</description>
    <link>https://twitter.com/${username}</link>
    <generator>Loon Sotwe2RSS</generator>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <ttl>15</ttl>`;

        // 遍历推文生成 Item
        posts.forEach(post => {
            if (!post.id) return; // 过滤无效数据

            const date = new Date(parseInt(post.createdAt));
            const link = `https://twitter.com/${username}/status/${post.id}`;
            let content = post.text || "";
            
            // 拼接图片
            if (post.media && post.media.length > 0) {
                post.media.forEach(img => {
                    content += `<br><img src="${img.url}" />`;
                });
            }
            
            // 拼接引用推文
            if (post.quotedTweet) {
                content += `<br><blockquote><strong>${post.quotedTweet.user?.name}:</strong> ${post.quotedTweet.text}</blockquote>`;
            }

            rss += `
    <item>
        <title>${escapeXml(post.text ? post.text.substring(0, 50) + "..." : "Media Post")}</title>
        <description><![CDATA[${content}]]></description>
        <pubDate>${date.toUTCString()}</pubDate>
        <guid>${link}</guid>
        <link>${link}</link>
    </item>`;
        });

        rss += `
</channel>
</rss>`;

        // 返回生成的 XML
        $done({
            response: {
                status: 200,
                headers: { "Content-Type": "application/xml" },
                body: rss
            }
        });

    } catch (e) {
        console.log("Parse Error: " + e);
        $done({ response: { status: 500, body: "Parse Error: " + e.message } });
    }
});

// XML 转义辅助函数
function escapeXml(unsafe) {
    return unsafe ? unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    }) : "";
}

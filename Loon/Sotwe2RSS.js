/*
 * @name: Twitter RSS 生成器 (Sotwe Bridge)
 * @author: Gemini
 * @desc: 实时抓取 Sotwe 页面数据并生成 RSS XML。
 * @use: http://127.0.0.1/twitter/USERNAME
 */

const url = $request.url;
const username = url.split("/").pop();
const targetUrl = `https://www.sotwe.com/${username}`;
const headers = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" };

$httpClient.get({ url: targetUrl, headers: headers }, (error, response, data) => {
    if (error || response.status !== 200) {
        $done({ response: { status: response.status || 500, body: "Sotwe Network Error." } });
        return;
    }
    try {
        const regex = /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/;
        const match = data.match(regex);
        if (!match || !match[1]) {
            $done({ response: { status: 404, body: "User not found or Sotwe layout changed." } });
            return;
        }
        const json = JSON.parse(match[1]);
        const posts = json.props?.pageProps?.data || [];
        const userProfile = json.props?.pageProps?.user || { name: username, screenName: username };
        
        let rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>${escapeXml(userProfile.name)} (@${userProfile.screenName})</title>
    <description>Twitter feed for ${userProfile.name} via Sotwe</description>
    <link>https://twitter.com/${username}</link>
    <generator>Loon Sotwe2RSS</generator>
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
        $done({ response: { status: 500, body: "Parse Error: " + e.message } });
    }
});

function escapeXml(unsafe) {
    return unsafe ? unsafe.replace(/[<>&'"]/g, c => {
        switch (c) {
            case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;'; case '\'': return '&apos;'; case '"': return '&quot;';
        }
    }) : "";
}

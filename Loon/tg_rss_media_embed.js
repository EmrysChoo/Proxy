/*
 * TG RSS 终极转换器 (feeeed 专用)
 * 适配源: https://tg.i-c-a.su/rss/guaidan21
 * 原理: 重新构造标准 RSS 2.0 树状结构，强制内嵌媒体标签
 */

let body = $response.body;

if (!body || body.indexOf("<item>") === -1) {
    $done({});
}

try {
    // 1. 提取 Header (包含频道标题和原始链接)
    let channelTitle = body.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "Telegram RSS";
    let channelLink = body.match(/<link>([\s\S]*?)<\/link>/)?.[1] || "https://t.me/";

    // 2. 提取并处理所有 Item
    let items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(body)) !== null) {
        let itemRaw = match[1];

        // 提取核心信息
        let title = itemRaw.match(/<title>([\s\S]*?)<\/title>/)?.[1] || "Untitled";
        let link = itemRaw.match(/<link>([\s\S]*?)<\/link>/)?.[1] || channelLink;
        let date = itemRaw.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
        
        // 媒体提取 (enclosure)
        const encMatch = itemRaw.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="([^"]+)"/i);
        let mediaTag = "";
        if (encMatch) {
            const [_, mUrl, mType] = encMatch;
            if (mType.includes("video")) {
                mediaTag = `<video controls="controls" loop="loop" playsinline="true" style="width:100%;border-radius:12px;margin-bottom:10px;" src="${mUrl}"></video><br>`;
            } else if (mType.includes("image") || mUrl.match(/\.(jpg|jpeg|png|webp)/i)) {
                mediaTag = `<img src="${mUrl}" style="width:100%;border-radius:12px;margin-bottom:10px;" referrerpolicy="no-referrer"><br>`;
            }
        }

        // 描述内容清洗：剥离所有转义字符，重组 HTML
        let descMatch = itemRaw.match(/<description>([\s\S]*?)<\/description>/i);
        let cleanText = "";
        if (descMatch) {
            cleanText = descMatch[1]
                .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') // 去 CDATA
                .replace(/&lt;/g, '<').replace(/&gt;/g, '>')  // 还原转义
                .replace(/<(?:.|\n)*?>/gm, '')                // 去残留标签
                .trim();
        }

        // 3. 按照 feeeed 最喜欢的 RSSHub 格式重组 Item
        items.push(`
        <item>
            <title><![CDATA[${title}]]></title>
            <link>${link}</link>
            <description><![CDATA[${mediaTag}<div style="white-space:pre-wrap;">${cleanText}</div>]]></description>
            <pubDate>${date}</pubDate>
            <guid isPermaLink="false">${link}</guid>
        </item>`);
    }

    // 4. 构建完整的 RSS 2.0 XML
    let finalXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title><![CDATA[${channelTitle}]]></title>
    <link>${channelLink}</link>
    <description>Converted by Gemini Proxy Script</description>
    ${items.join("")}
</channel>
</rss>`;

    $done({ body: finalXml });

} catch (e) {
    console.log("TG_RSS_Fatal_Error: " + e);
    $done({});
}

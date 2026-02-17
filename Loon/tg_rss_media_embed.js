/*
 * TG RSS 强转标准版 (含图片高清修复)
 * 适配：feeeed, Lire, Reeder
 */

let body = $response.body;
if (!body) $done({});

try {
    // 1. 分割内容块 (以 t.me 链接作为每个条目的锚点)
    const blocks = body.split(/(?=https:\/\/t\.me\/guaidan21\/\d+)/g);
    let rssItems = [];

    blocks.forEach(block => {
        // 提取标题并过滤掉 HTML
        let titleMatch = block.match(/^([\s\S]*?)(?=Sun,|Mon,|Tue,|Wed,|Thu,|Fri,|Sat,)/);
        let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";
        
        // 核心：提取媒体链接 (href 指向的是原图或原视频)
        const mediaMatch = block.match(/<a href="([^"]+)"/i);
        let mediaTag = "";
        
        if (mediaMatch) {
            const mediaUrl = mediaMatch[1];
            const isVideo = mediaUrl.match(/\.(mp4|mov|m4v)$/i);
            const isImage = mediaUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i);

            if (isVideo) {
                // 视频：增加封面图和自动播放属性
                mediaTag = `<video controls preload="metadata" playsinline style="width:100%;border-radius:12px;"><source src="${mediaUrl}"></video><br>`;
            } else if (isImage) {
                // 图片：直接内嵌原图而非缩略图
                mediaTag = `<img src="${mediaUrl}" style="width:100%;border-radius:12px;" referrerpolicy="no-referrer"><br>`;
            }
        }

        // 提取日期和原始链接
        const dateMatch = block.match(/(?:Sun|Mon|Tue|Wed|Thu|Fri|Sat),[\s\S]*?\+0300/);
        const linkMatch = block.match(/https:\/\/t\.me\/guaidan21\/\d+/);
        
        if (linkMatch) {
            rssItems.push(`
            <item>
                <title><![CDATA[${title || "新消息"}]]></title>
                <link>${linkMatch[0]}</link>
                <guid>${linkMatch[0]}</guid>
                <pubDate>${dateMatch ? dateMatch[0] : ""}</pubDate>
                <description><![CDATA[${mediaTag}<div style="margin-top:10px;">${title}</div>]]></description>
            </item>`);
        }
    });

    // 2. 构建标准 RSS 2.0 容器
    const finalXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
    <title>目睹21世纪之怪诞</title>
    <link>https://t.me/s/guaidan21</link>
    <description>Converted for feeeed with HD Media</description>
    ${rssItems.join("")}
</channel>
</rss>`;

    $done({ 
        body: finalXml, 
        headers: { "Content-Type": "application/xml; charset=utf-8" } 
    });

} catch (e) {
    console.log("TG_Convert_Error: " + e);
    $done({});
}

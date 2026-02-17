/*
 * TG RSS 修复脚本 (适配 feeeed)
 * 功能：将转义的 HTML 还原，确保详情页媒体正常渲染
 */

let body = $response.body;

if (!body || body.indexOf("<item>") === -1) {
    $done({});
}

try {
    // 1. 局部处理 item 块，防止破坏顶层 hostname
    body = body.replace(/<item>([\s\S]*?)<\/item>/g, (itemBlock) => {
        
        // 2. 提取并还原 description 内容
        return itemBlock.replace(/<description>([\s\S]*?)<\/description>/i, (m, desc) => {
            // 还原转义字符：&lt; -> < , &gt; -> > , &amp; -> &
            let decodedDesc = desc
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&")
                .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"); // 剥离旧的 CDATA

            // 3. 针对视频进行 HTML5 兼容性处理
            // 原始链接通常在 <a> 标签里，我们把它提取出来直接写成 <video> 或 <img>
            const mediaMatch = decodedDesc.match(/<a href="([^"]+)"/i);
            let mediaTag = "";
            if (mediaMatch) {
                const url = mediaMatch[1];
                if (url.match(/\.(mp4|mov|m4v)/i)) {
                    mediaTag = `<video controls playsinline preload="metadata" style="width:100%;border-radius:8px;"><source src="${url}"></video><br>`;
                } else if (url.match(/\.(jpg|jpeg|png|gif|webp)/i)) {
                    mediaTag = `<img src="${url}" style="width:100%;border-radius:8px;"><br>`;
                }
            }

            // 4. 重构：让 feeeed 识别到这是纯正的 HTML
            // 移除原始那个带 a 标签的预览图，换成我们的 mediaTag
            let finalText = decodedDesc.replace(/<a[\s\S]*?<\/a>/, "").trim();
            
            return `<description><![CDATA[${mediaTag}${finalText}]]></description>`;
        });
    });

    $done({ body });
} catch (e) {
    $done({});
}

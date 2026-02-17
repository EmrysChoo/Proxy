/*
 * TG RSS 媒体内嵌脚本 (终极兼容版)
 * 支持: guaidan21, Luchu_10000, 及其它所有 tg.i-c-a.su 频道
 */

let body = $response.body;
if (!body) $done({});

try {
    // 1. 自动转换：将所有转义的 HTML 符号还原（feeeed 加载失败的主因）
    body = body.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");

    // 2. 提取并重构 item 块
    if (body.indexOf("<item>") !== -1) {
        body = body.replace(/<item>([\s\S]*?)<\/item>/g, (itemBlock) => {
            
            // 提取 <a> 里的媒体原链接
            const mediaMatch = itemBlock.match(/<a href="([^"]+)"/i);
            let mediaTag = "";

            if (mediaMatch) {
                const url = mediaMatch[1].replace("http://", "https://");
                const isVideo = url.match(/\.(mp4|mov|m4v)/i);
                const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)/i);

                if (isVideo) {
                    mediaTag = `<video controls playsinline preload="metadata" style="width:100%; border-radius:12px; margin-bottom:10px;"><source src="${url}"></video><br>`;
                } else if (isImage) {
                    mediaTag = `<img src="${url}" style="width:100%; border-radius:12px; margin-bottom:10px;" referrerpolicy="no-referrer"><br>`;
                }
            }

            // 清理 description 里的原始跳转链接
            return itemBlock.replace(/<description>([\s\S]*?)<\/description>/i, (m, desc) => {
                let content = desc
                    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") // 剥离旧 CDATA
                    .replace(/<a[\s\S]*?<\/a>/g, "")             // 删掉那个会导致跳转和裂图的 a 标签
                    .trim();

                // 统一封装为符合 feeeed 标准的 CDATA
                return `<description><![CDATA[${mediaTag}${content}]]></description>`;
            });
        });
    }

    $done({ body });
} catch (e) {
    console.log("TG_RSS_Fix_Error: " + e);
    $done({});
}

/*
 * TG RSS 修复脚本 (RSSHub 兼容模式)
 * 适配阅读器：feeeed, Reeder, NetNewsWire
 */

let body = $response.body;

if (!body) $done({});

try {
  // 1. 仅针对 <item> 块进行局部替换，保护外部的 <channel> hostname 信息
  body = body.replace(/<item>([\s\S]*?)<\/item>/g, (itemBlock) => {
    
    // 2. 提取附件 (enclosure)
    const enclosure = itemBlock.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="([^"]+)"/i);
    
    if (enclosure) {
      const mediaUrl = enclosure[1];
      const mediaType = enclosure[2];
      let embedHTML = "";

      // 按照 RSSHub 规范构造 HTML5 标签
      if (mediaType.includes("video")) {
        embedHTML = `<br><video controls loop playsinline referrerpolicy="no-referrer" style="width:100%;"><source src="${mediaUrl}" type="${mediaType}"></video>`;
      } else if (mediaType.includes("image")) {
        embedHTML = `<br><img src="${mediaUrl}" referrerpolicy="no-referrer" style="width:100%;">`;
      }

      // 3. 提取并清理 description
      // 很多转换工具会产生转义字符 &lt;br&gt;，我们需要先还原它们
      let descMatch = itemBlock.match(/<description>([\s\S]*?)<\/description>/i);
      if (descMatch) {
        let content = descMatch[1]
          .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1') // 移除旧的 CDATA
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');

        // 模仿 RSSHub：将媒体标签拼接在正文最前面或最后面
        // 这里放在前面，确保 feeeed 预览图能抓取到
        const newContent = `<![CDATA[${embedHTML}<br>${content}]]>`;
        
        // 只替换当前 item 的 description
        itemBlock = itemBlock.replace(/<description>[\s\S]*?<\/description>/i, `<description>${newContent}</description>`);
      }
    }
    return itemBlock;
  });

  $done({ body });
} catch (e) {
  console.log("TG_RSS_Fix_Error: " + e);
  $done({});
}

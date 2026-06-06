WidgetMetadata = {
  id: "forward.meta.subtitlec1at",  // 更新为唯一标识符
  title: "SubtitleCat 字幕",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  version: "1.1.0",                
  requiredVersion: "0.0.1",
  description: "从 subtitlecat.com 搜索并加载中文字幕。",
  author: "AI",
  site: "https://github.com/InchStudio/ForwardWidgets",
  modules: [
    {
      id: "loadSubtitle",
      title: "搜索并加载字幕",
      functionName: "loadSubtitle",  // 与处理函数名保持一致
      type: "subtitle",               // 保持在原官方规范示例中，这有助于Forward App识别
      params: [
        {
          name: "searchKey",
          title: "搜索关键词 (电影/剧集名称)",
          type: "input",              // 官方支持参数类型：input
          description: "请输入电影或剧集的中文或英文名",
          placeholder: "例如: The Matrix 或 黑客帝国",
        },
      ],
    },
  ],
};

// SubtitleCat 网站配置常量
const SUBTITLECAT = {
  baseUrl: "https://www.subtitlecat.com",
  searchPath: "/index.php",
  timeout: 15000,
  maxResults: 10,
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Referer": "https://www.subtitlecat.com/"
  }
};

/**
 * 主函数：搜索字幕并为每个结果获取真实下载链接
 */
async function loadSubtitle(params) {
  const { searchKey, seriesName, type } = params;

  // 1. 提取并清理关键词
  let key = searchKey?.trim() || seriesName || "";
  if (!key) {
    console.warn("搜索关键词为空，无法执行搜索。");
    return [];
  }
  // 保留字母、数字、中日韩文字和空格
  key = key.replace(/[^\w\s\u4e00-\u9fa5]/g, " ").trim();

  // 将关键词拆分后合并，提高搜索命中率
  const searchWords = key.split(/\s+/).filter(word => word.length > 1);
  const searchKeyWords = searchWords.slice(0, 3).join(" "); 
  const finalSearchKey = searchKeyWords || key;

  try {
    // 2. 发起搜索请求
    const searchUrl = `${SUBTITLECAT.baseUrl}${SUBTITLECAT.searchPath}?search=${encodeURIComponent(finalSearchKey)}`;
    const searchResp = await Widget.http.get(searchUrl, {
      headers: SUBTITLECAT.headers,
      timeout: SUBTITLECAT.timeout,
      rejectUnauthorized: false,   // 应对SSL证书问题
      followRedirects: true
    });

    if (!searchResp || !searchResp.data) {
      console.error("SubtitleCat搜索请求失败或返回空数据。");
      return [];
    }

    const searchHtml = searchResp.data;
    // 3. 解析搜索结果，获取详情页URL
    const detailPages = parseSearchResult(searchHtml);

    if (detailPages.length === 0) {
      console.log(`未找到与关键词"${finalSearchKey}"相关的字幕。`);
      return [];
    }

    // 4. 并发获取每个详情页的真实下载链接
    const subtitles = [];
    const fetchPromises = detailPages.slice(0, SUBTITLECAT.maxResults).map(async (item, index) => {
      const downloadUrl = await fetchSubtitleDownloadUrl(item.detailUrl);
      if (downloadUrl) {
        return {
          id: `subcat-${item.id || index}`,
          title: item.title,
          lang: "zh-CN",            // 默认搜索中文字幕
          count: 100,
          url: downloadUrl,
        };
      }
      return null;
    });

    // 等待所有请求完成，并过滤掉空结果
    const results = await Promise.all(fetchPromises);
    for (const sub of results) if (sub) subtitles.push(sub);

    console.log(`字幕搜索完成，共找到 ${subtitles.length} 条结果。`);
    return subtitles;

  } catch (e) {
    console.error(`SubtitleCat 请求失败: ${e.message}`);
    return [];
  }
}

/**
 * 解析搜索结果HTML，提取每个字幕的详情页URL和标题
 * @param {string} html - 搜索结果页面的HTML
 * @returns {Array<{id: string, title: string, detailUrl: string}>}
 */
function parseSearchResult(html) {
  const results = [];
  // 此正则匹配：<a href="/subs/数字/文件名.html">标题</a>，后续将整合进README中的转换计划。
  const linkRegex = /<a\s+href="([^"]+subs\/\d+\/[^"]+\.html)"[^>]*>([^<]+)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const relativeUrl = match[1];
    const title = match[2].trim();
    if (title && relativeUrl) {
      // 提取数字ID，用于唯一标识
      const idMatch = relativeUrl.match(/subs\/(\d+)\//);
      const id = idMatch ? idMatch[1] : "";
      results.push({
        detailUrl: relativeUrl.startsWith("http") ? relativeUrl : SUBTITLECAT.baseUrl + relativeUrl,
        title: title,
        id: id
      });
    }
  }
  return results;
}

/**
 * 从字幕详情页中提取实际字幕文件的下载链接
 * @param {string} detailPageUrl - 字幕详情页的URL
 * @returns {Promise<string|null>}
 */
async function fetchSubtitleDownloadUrl(detailPageUrl) {
  try {
    const detailResp = await Widget.http.get(detailPageUrl, {
      headers: SUBTITLECAT.headers,
      timeout: 10000,
      rejectUnauthorized: false,
      followRedirects: true
    });
    const detailHtml = detailResp?.data || "";
    
    // 模式1: 直接匹配 .srt 或 .ass 文件的下载链接
    let match = detailHtml.match(/href="([^"]+\.(?:srt|ass))"/i);
    if (match && match[1]) {
      let downloadUrl = match[1];
      if (downloadUrl.startsWith("//")) downloadUrl = "https:" + downloadUrl;
      else if (downloadUrl.startsWith("/")) downloadUrl = SUBTITLECAT.baseUrl + downloadUrl;
      return downloadUrl;
    }
    
    // 模式2: 匹配包含 "download" 的链接，可能需要进一步处理
    match = detailHtml.match(/href="([^"]*download[^"]*)"/i);
    if (match && match[1]) {
      let potentialUrl = match[1];
      if (potentialUrl.startsWith("/")) potentialUrl = SUBTITLECAT.baseUrl + potentialUrl;
      // 如果链接不是以 .srt 结尾，再次请求以获取最终文件
      if (!potentialUrl.endsWith('.srt')) {
        const finalResp = await Widget.http.get(potentialUrl, {
          headers: SUBTITLECAT.headers,
          followRedirects: true,
          timeout: 8000
        });
        const finalUrl = finalResp?.finalUrl || potentialUrl;
        if (finalUrl.endsWith('.srt')) return finalUrl;
        // 如果最终返回的是HTML，尝试再次从中提取 .srt 链接
        if (finalResp?.data) {
          const innerMatch = finalResp.data.match(/href="([^"]+\.srt)"/i);
          if (innerMatch) return innerMatch[1];
        }
      } else {
        return potentialUrl;
      }
    }
    
    // 如果以上模式均未匹配，返回null
    return null;
  } catch (e) {
    console.error(`获取下载链接失败 (${detailPageUrl}): ${e.message}`);
    return null;
  }
}

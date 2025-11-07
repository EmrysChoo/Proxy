/**
 * TMDB API请求参数优化脚本
 * 功能：自动为TMDB API请求添加语言和成人内容参数，同时排除所有图片相关请求
 */
const url = $request.url;
const newUrl = new 网站(url);  // 创建可修改的URL对象

/**
 * 判断是否为图片元数据API请求（匹配各种层级结构）
 * 新增season/episode层级的识别
 */
const isImageMetaRequest = 
    // 电影/电视剧基础图片元数据
    /\/3\/(tv|movie)\/\d+\/(image|images)/.test(url) ||
    // 剧集层级图片元数据 (如：.../tv/225008/season/1/episode/7/images)
    /\/3\/tv\/\d+\/season\/\d+\/episode\/\d+\/images/.test(url);

/**
 * 判断是否为实际图片资源请求（通过后缀或CDN路径特征识别）
 */
const isImageResource = 
    // 匹配常见图片格式后缀（支持带查询参数）
    /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url) || 
    // 匹配TMDB图片CDN路径模式
    url.includes('image.tmdb.org/t/p/');

/**
 * 仅对非图片类请求添加API参数
 */
if (!isImageMetaRequest && !isImageResource) {
    // 设置中文语言偏好
    newUrl.searchParams.set('language', 'zh-CN');
    // 启用成人内容显示
    newUrl.searchParams.set('include_adult', 'true');
}

// 返回修改后的URL
$done({ url: newUrl.toString() });

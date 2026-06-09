/**
 * TMDB 成人内容解锁脚本
 * 读取开关状态，解锁搜索/推荐的 NSFW 限制
 */

const $prefs = typeof $prefs !== 'undefined' ? $prefs : { valueForKey: () => 'true' };
const $request = typeof $request !== 'undefined' ? $request : { url: '' };

// 检查开关是否开启
const enabled = $prefs.valueForKey("tmdb_enabled") !== "false";

if (!enabled) {
    // 开关关闭，直接放行
    $done({});
} else {
    const url = $request.url;
    
    // 检查是否已经包含 include_adult=true
    if (url.includes("include_adult=true")) {
        // 已包含，直接放行
        $done({});
    } else {
        // 添加 include_adult=true 参数
        const separator = url.includes("?") ? "&" : "?";
        const newUrl = url + separator + "include_adult=true";
        
        // 使用 302 重定向
        $done({
            url: newUrl
        });
    }
}

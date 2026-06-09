/**
 * Forward 成人内容解锁脚本
 * 读取开关状态，解锁搜索的 NSFW 限制
 */

const $prefs = typeof $prefs !== 'undefined' ? $prefs : { valueForKey: () => 'true' };
const $request = typeof $request !== 'undefined' ? $request : { url: '' };

// 检查开关是否开启
const enabled = $prefs.valueForKey("forward_enabled") !== "false";

if (!enabled) {
    // 开关关闭，直接放行
    $done({});
} else {
    const url = $request.url;
    
    // 将 include_adult=false 替换为 include_adult=true
    const newUrl = url.replace(/include_adult=false/g, "include_adult=true");
    
    if (newUrl !== url) {
        // 替换成功，重定向
        $done({ url: newUrl });
    } else {
        // 没有匹配项，直接放行
        $done({});
    }
}

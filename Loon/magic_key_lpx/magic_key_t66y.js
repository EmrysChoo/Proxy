/**
 * 草榴移动版跳转脚本
 * 读取开关状态，自动跳转移动版
 */

const $prefs = typeof $prefs !== 'undefined' ? $prefs : { valueForKey: () => 'true' };
const $request = typeof $request !== 'undefined' ? $request : { url: '' };

// 检查开关是否开启
const enabled = $prefs.valueForKey("t66y_enabled") !== "false";

if (!enabled) {
    // 开关关闭，直接放行
    $done({});
} else {
    const url = $request.url;
    
    // 匹配 htm_data 路径 (桌面版图片页面)
    const htmDataMatch = url.match(/^https?:\/\/www\.t66y\.com\/\/htm_data\/(\d+)\/(\d+)\/(\d+\.html)$/);
    if (htmDataMatch) {
        const [, folder, id, file] = htmDataMatch;
        const newUrl = `https://www.t66y.com//htm_mob/${folder}/${id}/${file}`;
        $done({ url: newUrl });
        return;
    }
    
    // 匹配 htm_data 路径 (无双斜杠)
    const htmDataMatch2 = url.match(/^https?:\/\/www\.t66y\.com\/htm_data\/(\d+)\/(\d+)\/(\d+\.html)$/);
    if (htmDataMatch2) {
        const [, folder, id, file] = htmDataMatch2;
        const newUrl = `https://www.t66y.com/htm_mob/${folder}/${id}/${file}`;
        $done({ url: newUrl });
        return;
    }
    
    // 其他情况，直接放行
    $done({});
}

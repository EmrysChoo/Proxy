/**
 * 草榴移动版跳转脚本
 * Loon 脚本格式 - 使用 $argument 读取参数
 */

// 读取开关状态
const enabled = $argument.t66y_enabled !== "false";

if (!enabled) {
    // 开关关闭，直接放行
    $done({});
} else {
    const url = $request.url;
    
    // 匹配 htm_data 路径 (桌面版图片页面)
    const htmDataMatch = url.match(/^https?:\/\/www\.t66y\.com\/htm_data\/(\d+)\/(\d+)\/(\d+\.html)$/);
    if (htmDataMatch) {
        const [, folder, id, file] = htmDataMatch;
        const newUrl = `https://www.t66y.com/htm_mob/${folder}/${id}/${file}`;
        $done({ url: newUrl });
        return;
    }
    
    // 其他情况，直接放行
    $done({});
}

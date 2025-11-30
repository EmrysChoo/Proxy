/**
 * 脚本功能：尝试将 RSS 中的 180P webm 链接替换为 720P mp4 链接
 * 局限性：如果服务器校验 Hash 与文件名绑定，替换后视频将无法加载。
 */

let body = $response.body;

if (body) {
    // 1. 定义替换规则
    // 原始: 180P_225K (低清预览)
    // 目标: 720P_4000K (常见的 PH 高清码率，也可能是 1500K 或 2000K，但 4000K 较为常见)
    const targetQuality = "720P_4000K"; 
    
    // 2. 执行正则替换
    // 替换文件名中的分辨率标识
    body = body.replace(/180P_225K/g, targetQuality);
    
    // 3. 替换文件扩展名
    // 180P 预览通常是 .webm，高清源通常是 .mp4
    body = body.replace(/\.webm/g, ".mp4");
    
    // 4. 替换 XML/HTML 中的 MIME 类型描述，确保播放器识别正确
    body = body.replace(/type="video\/webm"/g, 'type="video/mp4"');
    
    // (可选) 调试日志，查看是否触发了替换
    // console.log("Pornhub RSS HD Patcher: Replaced links to " + targetQuality);
}

$done({ body });

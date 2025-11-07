/**
 * TMDb增强脚本
 * 功能：自动为TMDB API请求添加中文参数和成人内容参数
 * 排除图片元数据接口，避免影响图片CDN性能
 */

(async () => {
    'use strict';
    
    try {
        // 安全检查
        if (typeof $request === 'undefined' || !$request.url) {
            console.log('[TMDb增强] 错误: 无效的请求对象');
            $done({});
            return;
        }
        
        const urlStr = $request.url;
        console.log('[TMDb增强] 拦截到请求: ' + urlStr);
        
        // 解析插件参数
        let forceChinese = true;
        let enableAdult = true;
        
        if (typeof $argument !== 'undefined') {
            try {
                // 支持多种参数格式
                if (typeof $argument === 'string') {
                    // 处理字符串参数格式: "forceChinese=true&enableAdult=true"
                    const params = new URLSearchParams($argument);
                    forceChinese = params.get('forceChinese') !== 'false';
                    enableAdult = params.get('enableAdult') !== 'false';
                } else if (typeof $argument === 'object') {
                    // 处理对象参数格式
                    if (typeof $argument.forceChinese !== 'undefined') {
                        forceChinese = String($argument.forceChinese) === 'true';
                    }
                    if (typeof $argument.enableAdult !== 'undefined') {
                        enableAdult = String($argument.enableAdult) === 'true';
                    }
                }
            } catch (e) {
                console.log('[TMDb增强] 参数解析错误, 使用默认值: ' + e);
            }
        }
        
        console.log(`[TMDb增强] 配置参数: 中文=${forceChinese}, 成人内容=${enableAdult}`);
        
        const url = new 网站(urlStr);
        let modified = false;
        
        // 只在参数不存在时才添加，避免覆盖原有设置
        if (forceChinese && !url.searchParams.has('language')) {
            url.searchParams.set('language', 'zh-CN');
            modified = true;
            console.log('[TMDb增强] 已添加中文参数: language=zh-CN');
        }
        
        if (enableAdult && !url.searchParams.has('include_adult')) {
            url.searchParams.set('include_adult', 'true');
            modified = true;
            console.log('[TMDb增强] 已启用成人内容: include_adult=true');
        }
        
        if (modified) {
            const newUrl = url.toString();
            console.log(`[TMDb增强] 请求修改完成:\n原URL: ${urlStr}\n新URL: ${newUrl}`);
            $done({ url: newUrl });
        } else {
            console.log('[TMDb增强] 无需修改，直接放行');
            $done({});
        }
        
    } catch (error) {
        console.log('[TMDb增强] 执行错误: ' + error.message);
        $done({});
    }
})();

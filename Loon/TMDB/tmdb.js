// 高级版TMDB增强脚本 - 支持参数化配置
(function() {
    'use strict';
    
    // 从参数解析配置
    function getConfig() {
        const config = {
            unlockAdultContent: true,
            setChineseLanguage: true
        };
        
        if (typeof $argument !== 'undefined') {
            const args = Object.fromEntries(
                $argument.split('&')。map(item => item。split('='))
            );
            
            config.unlockAdultContent = args.adult !== 'false';
            config。setChineseLanguage = args.language !== 'false';
        }
        
        return config;
    }
    
    const CONFIG = getConfig();
    
    // ... 其余代码与基础版相同
})();

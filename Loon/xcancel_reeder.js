/**
 * Xcancel 核心伪装脚本
 * 彻底重拍 Header 顺序并删除 feeeed 特征
 */

const headers = {
    'Host': 'rss.xcancel.com',
    'Accept': 'application/rss+xml, application/atom+xml, text/xml, */*',
    'User-Agent': 'Reeder/5.3 (iOS; iPhone15,2; Build/20E252)',
    'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
};

// 放弃所有原始 Header，只发送上面定义的 Reeder 字典
$done({headers: headers});

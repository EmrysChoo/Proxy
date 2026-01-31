/**
 * 完全模拟 Reeder 5 (iOS) 的请求指纹
 * 抹除 feeeed 特有的所有 Header 字段
 */

const headers = {
    'Host': 'rss.xcancel.com',
    'Accept': 'application/rss+xml, application/atom+xml, text/xml, */*',
    'User-Agent': 'Reeder/5.3 (iOS; iPhone15,2; Build/20E252)',
    'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive'
};

// 用上面这个精简的字典彻底覆盖原始请求头
$done({headers: headers});

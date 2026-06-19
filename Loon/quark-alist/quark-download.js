/**
 * 夸克网盘 Alist - 下载响应转换
 * 将夸克API下载响应转换为Alist格式
 */

const args = $argument || {};

if (!$response || !$response.body) {
  $done({});
  return;
}

try {
  const result = JSON.parse($response.body);
  
  if (result.status !== 200 || !result.data || !result.data[0]) {
    $done({
      response: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: 500, message: "获取下载链接失败" })
      }
    });
    return;
  }

  const downloadUrl = result.data[0].download_url;

  $done({
    response: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: 200,
        message: "success",
        data: {
          raw_url: downloadUrl,
          provider: "Quark"
        }
      })
    }
  });
} catch (e) {
  $done({
    response: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: 500, message: "解析错误" })
    }
  });
}

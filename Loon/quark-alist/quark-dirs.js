/**
 * 夸克网盘 Alist - 目录列表响应转换
 * 将夸克API响应转换为Alist目录格式
 */

if (!$response || !$response.body) {
  $done({});
  return;
}

try {
  const result = JSON.parse($response.body);
  
  if (result.status !== 200 || !result.data || !result.data.list) {
    $done({
      response: {
        status: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: 500, message: "获取目录失败" })
      }
    });
    return;
  }

  const dirs = result.data.list
    .filter(f => !f.file)
    .map(f => ({
      name: f.file_name,
      modified: f.updated_at || new Date().toISOString()
    }));

  $done({
    response: {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: 200,
        message: "success",
        data: dirs
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

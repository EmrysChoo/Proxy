/**
 * 简单测试 - 直接返回静态响应
 */

$done({
  response: {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: 200,
      message: "success",
      data: {
        content: [
          { name: "测试文件夹", size: 0, is_dir: true, type: 0 },
          { name: "测试视频.mp4", size: 1024000, is_dir: false, type: 2 }
        ],
        total: 2,
        provider: "Quark"
      }
    })
  }
});

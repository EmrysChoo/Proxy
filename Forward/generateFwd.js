const fs = require("fs");
const path = require("path");

try {
  const widgetsDir = path.join(__dirname, "JS");
  const files = fs.readdirSync(widgetsDir).filter(f => f.endsWith(".js"));

  console.log("找到的文件:", files);

  function extractMeta(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const meta = {};

    meta.id = (content.match(/id:\s*["'](.+?)["']/) || [])[1] || "";
    meta.title = (content.match(/title:\s*["'](.+?)["']/) || [])[1] || "";
    meta.description = (content.match(/description:\s*["'](.+?)["']/) || [])[1] || "";
    meta.requiredVersion = (content.match(/requiredVersion:\s*["'](.+?)["']/) || [])[1] || "";
    meta.version = (content.match(/version:\s*["'](.+?)["']/) || [])[1] || "";
    meta.author = (content.match(/author:\s*["'](.+?)["']/) || [])[1] || "";

    return meta;
  }

  const widgets = files.map(file => {
    const meta = extractMeta(path.join(widgetsDir, file));
    return {
      ...meta,
      url: `https://raw.githubusercontent.com/EmrysChoo/Proxy/refs/heads/main/Forward/JS/${file}`
    };
  });

  const fwd = {
    title: "Ti's Widgets",
    description: "Made by Love",
    icon: "https://raw.githubusercontent.com/EmrysChoo/Proxy/refs/heads/main/Forward/icon.png",
    widgets
  };

  const outputPath = path.join(__dirname, "forward.fwd");
  fs.writeFileSync(outputPath, JSON.stringify(fwd, null, 2));
  console.log("✅ forward.fwd 已生成:", outputPath);
} catch (err) {
  console.error("❌ 脚本执行失败：", err.message);
  console.error(err.stack);
  process.exit(1);
}

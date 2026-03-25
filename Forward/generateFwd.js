const fs = require("fs");
const path = require("path");

// 目标目录：Forward/JS
const widgetsDir = path.join(__dirname, "JS");

// 读取所有 .js 文件
const files = fs.existsSync(widgetsDir)
  ? fs.readdirSync(widgetsDir).filter(f => f.endsWith(".js"))
  : [];

console.log("找到的文件:", files);

// 提取元数据
function extractMeta(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const meta = {};

  meta.id = (content.match(/id:\s*["'](.+?)["']/) || [])[1] || path.basename(filePath, ".js");
  meta.title = (content.match(/title:\s*["'](.+?)["']/) || [])[1] || meta.id;
  meta.description = (content.match(/description:\s*["'](.+?)["']/) || [])[1] || "";
  meta.requiredVersion = (content.match(/requiredVersion:\s*["'](.+?)["']/) || [])[1] || "0.0.1";
  meta.version = (content.match(/version:\s*["'](.+?)["']/) || [])[1] || "0.0.1";
  meta.author = (content.match(/author:\s*["'](.+?)["']/) || [])[1] || "unknown";

  return meta;
}

// 构建 widgets 数组
const widgets = files.map(file => {
  const meta = extractMeta(path.join(widgetsDir, file));
  return {
    ...meta,
    url: `https://raw.githubusercontent.com/EmrysChoo/Proxy/refs/heads/main/Forward/JS/${file}`
  };
});

// 构建最终 fwd 对象
const fwd = {
  title: "My Widgets",
  description: "Made by Love",
  icon: `https://raw.githubusercontent.com/EmrysChoo/Proxy/refs/heads/main/Forward/icon.png`,
  widgets
};

// 输出路径：Forward/forward.fwd
const outputPath = path.join(__dirname, "forward.fwd");
fs.writeFileSync(outputPath, JSON.stringify(fwd, null, 2));
console.log("✅ forward.fwd 已生成:", outputPath);

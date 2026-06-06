const fs = require("fs");
const path = require("path");

const widgetsDir = path.join(__dirname, "JS");
const files = fs.existsSync(widgetsDir)
  ? fs.readdirSync(widgetsDir).filter(f => f.endsWith(".js"))
  : [];

console.log("找到的文件:", files);

function extractMeta(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");

  // 只解析 WidgetMetadata 对象里的顶层字段，不要 modules
  const meta = {};
  const widgetBlock = content.match(/WidgetMetadata\s*=\s*{([\s\S]*?)}/);
  if (widgetBlock) {
    const block = widgetBlock[1];
    meta.id = (block.match(/id:\s*["'](.+?)["']/) || [])[1] || path.basename(filePath, ".js");
    meta.title = (block.match(/title:\s*["'](.+?)["']/) || [])[1] || meta.id;
    meta.description = (block.match(/description:\s*["'](.+?)["']/) || [])[1] || "";
    meta.version = (block.match(/version:\s*["'](.+?)["']/) || [])[1] || "0.0.1";
    meta.requiredVersion = (block.match(/requiredVersion:\s*["'](.+?)["']/) || [])[1] || "0.0.1";
    meta.author = (block.match(/author:\s*["'](.+?)["']/) || [])[1] || "unknown";
    meta.site = (block.match(/site:\s*["'](.+?)["']/) || [])[1] || "";
  } else {
    // 没有 WidgetMetadata 就用默认值
    meta.id = path.basename(filePath, ".js");
    meta.title = meta.id;
    meta.description = "";
    meta.version = "0.0.1";
    meta.requiredVersion = "0.0.1";
    meta.author = "unknown";
    meta.site = "";
  }

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
  title: "自用模块",
  description: "Made by Love",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  widgets
};

const outputPath = path.join(__dirname, "forward.fwd");
fs.writeFileSync(outputPath, JSON.stringify(fwd, null, 2));
console.log("✅ forward.fwd 已生成:", outputPath);

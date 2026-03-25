const fs = require("fs");
const path = require("path");

const widgetsDir = path.join(__dirname, "JS");
const files = fs.existsSync(widgetsDir)
  ? fs.readdirSync(widgetsDir).filter(f => f.endsWith(".js"))
  : [];

console.log("找到的文件:", files);

function extractMeta(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");

  // 只匹配 WidgetMetadata 对象里的顶层字段，不解析 modules
  const meta = {};
  meta.id = (content.match(/WidgetMetadata\s*=\s*{[^}]*id:\s*["'](.+?)["']/) || [])[1] || path.basename(filePath, ".js");
  meta.title = (content.match(/WidgetMetadata\s*=\s*{[^}]*title:\s*["'](.+?)["']/) || [])[1] || meta.id;
  meta.description = (content.match(/WidgetMetadata\s*=\s*{[^}]*description:\s*["'](.+?)["']/) || [])[1] || "";
  meta.version = (content.match(/WidgetMetadata\s*=\s*{[^}]*version:\s*["'](.+?)["']/) || [])[1] || "0.0.1";
  meta.requiredVersion = (content.match(/WidgetMetadata\s*=\s*{[^}]*requiredVersion:\s*["'](.+?)["']/) || [])[1] || "0.0.1";
  meta.author = (content.match(/WidgetMetadata\s*=\s*{[^}]*author:\s*["'](.+?)["']/) || [])[1] || "unknown";
  meta.site = (content.match(/WidgetMetadata\s*=\s*{[^}]*site:\s*["'](.+?)["']/) || [])[1] || "";

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
  title: "My Widgets",
  description: "Made by Love",
  icon: "https://via.placeholder.com/64",
  widgets
};

const outputPath = path.join(__dirname, "forward.fwd");
fs.writeFileSync(outputPath, JSON.stringify(fwd, null, 2));
console.log("✅ forward.fwd 已生成:", outputPath);

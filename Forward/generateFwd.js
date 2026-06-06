const fs = require("fs");
const path = require("path");

const widgetsDir = path.join(__dirname, "JS");
const files = fs.existsSync(widgetsDir)
  ? fs.readdirSync(widgetsDir).filter(f => f.endsWith(".js"))
  : [];

console.log("找到的文件:", files);
console.log("=" .repeat(50));

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

const BASE_RAW_URL = "https://raw.githubusercontent.com/EmrysChoo/Proxy/refs/heads/main/Forward/JS";

const widgets = files.map(file => {
  const meta = extractMeta(path.join(widgetsDir, file));
  return {
    id: meta.id,
    title: meta.title,
    description: meta.description,
    version: meta.version,
    author: meta.author,
    site: meta.site,
    // requiredVersion 通常由 App 管理，不放在这里
    url: `${BASE_RAW_URL}/${encodeURIComponent(file)}`
  };
});

// 格式1：纯净格式（只包含 widgets）- 推荐用于新版本 Forward
const fwdPure = { widgets };
const outputPathPure = path.join(__dirname, "forward.fwd");

// 格式2：带元数据格式（保留 title/description/icon）- 用于旧版本兼容
const fwdWithMeta = {
  title: "自用模块",
  description: "Made by Love",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  widgets
};
const outputPathWithMeta = path.join(__dirname, "forward_with_meta.fwd");

try {
  fs.writeFileSync(outputPathPure, JSON.stringify(fwdPure, null, 2));
  console.log("✅ 纯净格式已生成:", outputPathPure);
  console.log(`   内容: {"widgets": [...]} 共 ${widgets.length} 个模块`);
  
  fs.writeFileSync(outputPathWithMeta, JSON.stringify(fwdWithMeta, null, 2));
  console.log("✅ 兼容格式已生成:", outputPathWithMeta);
  console.log(`   内容: {title, description, icon, widgets} 共 ${widgets.length} 个模块`);
  
  console.log("\n📌 建议：");
  console.log("   - 先尝试导入 forward.fwd（纯净格式）");
  console.log("   - 如果不行，再尝试 forward_with_meta.fwd");
} catch (err) {
  console.error("❌ 写入文件失败:", err.message);
}

// 输出第一个模块的示例，方便检查
if (widgets.length > 0) {
  console.log("\n📋 第一个模块示例:");
  console.log(JSON.stringify(widgets[0], null, 2));
}

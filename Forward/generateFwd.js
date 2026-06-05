const fs = require("fs");
const path = require("path");
 
const widgetsDir = path.join(__dirname, "JS");
const files = fs.existsSync(widgetsDir)
  ? fs.readdirSync(widgetsDir).filter(f => f.endsWith(".js"))
  : [];
console.log("找到的文件:", files);
 
/**
 * 从 JS 文件内容中提取完整的 WidgetMetadata 对象文本
 * 使用括号深度计数，正确处理嵌套 { }，忽略字符串和注释中的干扰括号
 */
function extractWidgetBlock(content) {
  const startMatch = content.match(/WidgetMetadata\s*=\s*\{/);
  if (!startMatch) return null;
 
  const startIndex = startMatch.index + startMatch[0].length - 1; // 开头 { 的位置
  let depth = 0;
  let i = startIndex;
 
  while (i < content.length) {
    const ch = content[i];
 
    // 跳过单行注释
    if (ch === "/" && content[i + 1] === "/") {
      i = content.indexOf("\n", i);
      if (i === -1) break;
      i++;
      continue;
    }
    // 跳过多行注释
    if (ch === "/" && content[i + 1] === "*") {
      i = content.indexOf("*/", i + 2);
      if (i === -1) break;
      i += 2;
      continue;
    }
    // 跳过字符串（支持 ' " ` 三种引号，模板字符串内也简单跳过）
    if (ch === "'" || ch === '"' || ch === "`") {
      const quote = ch;
      i++;
      while (i < content.length && content[i] !== quote) {
        if (content[i] === "\\") i++; // 跳过转义字符
        i++;
      }
      i++; // 跳过闭合引号
      continue;
    }
 
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return content.substring(startIndex, i + 1);
      }
    }
    i++;
  }
  return null;
}
 
function extractMeta(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const meta = {};
 
  const block = extractWidgetBlock(content);
  if (block) {
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

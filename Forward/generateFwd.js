const fs = require("fs");
const path = require("path");

const widgetsDir = path.join(__dirname, "JS");
const files = fs.existsSync(widgetsDir)
  ? fs.readdirSync(widgetsDir).filter(f => f.endsWith(".js"))
  : [];
console.log("找到的文件:", files);

// ---------------- 工具函数：提取 WidgetMetadata ----------------

function extractWidgetBlock(content) {
  const startMatch = content.match(/WidgetMetadata\s*=\s*\{/);
  if (!startMatch) return null;

  const startIndex = startMatch.index + startMatch[0].length - 1;
  let depth = 0;
  let i = startIndex;

  while (i < content.length) {
    const ch = content[i];

    if (ch === "/" && content[i + 1] === "/") {
      i = content.indexOf("\n", i);
      if (i === -1) break;
      i++;
      continue;
    }
    if (ch === "/" && content[i + 1] === "*") {
      i = content.indexOf("*/", i + 2);
      if (i === -1) break;
      i += 2;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === "`") {
      const quote = ch;
      i++;
      while (i < content.length && content[i] !== quote) {
        if (content[i] === "\\") i++;
        i++;
      }
      i++;
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

// ---------------- 提取 WidgetMetadata（完全原样，不修改） ----------------

function extractMeta(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const block = extractWidgetBlock(content);

  if (!block) {
    console.warn("⚠ 未找到 WidgetMetadata:", filePath);
    return null;
  }

  function pick(field) {
    const m = block.match(new RegExp(field + `:\\s*["']([\\s\\S]*?)["']`));
    return m ? m[1] : null;
  }

  return {
    id: pick("id"),
    title: pick("title"),
    description: pick("description"),
    requiredVersion: pick("requiredVersion"),
    version: pick("version"),
    author: pick("author"),
  };
}

// ---------------- 生成 fwd ----------------

const BASE_RAW_URL = "https://raw.githubusercontent.com/EmrysChoo/Proxy/refs/heads/main/Forward/JS";

const widgets = files
  .map(file => {
    const meta = extractMeta(path.join(widgetsDir, file));
    if (!meta) return null;

    return {
      ...meta,
      url: `${BASE_RAW_URL}/${encodeURIComponent(file)}`,
    };
  })
  .filter(Boolean);

const fwd = {
  title: "自用模块",
  description: "Made by Love",
  icon: "https://assets.vvebo.vip/scripts/icon.png",
  widgets
};

const outputPath = path.join(__dirname, "forward.fwd");
fs.writeFileSync(outputPath, JSON.stringify(fwd, null, 2));
console.log("✅ forward.fwd 已生成:", outputPath);

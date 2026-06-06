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

// ---------------- ID 清洗：只修复非法 ID ----------------

function sanitizeId(id, fallback) {
  if (!id) return fallback;

  // 如果本来就是合法 ID → 完全不动
  if (/^[A-Za-z][A-Za-z0-9._-]*$/.test(id)) {
    return id;
  }

  let clean = id;

  // 去掉 http:// https://
  clean = clean.replace(/^https?:\/\//i, "");

  // 去掉域名后缀（.app .com .net 等）
  clean = clean.replace(/\.(com|app|net|org|xyz|vip|top|tv|cc|io|me)(\/|$)/gi, "_");

  // 替换非法字符为 _
  clean = clean.replace(/[^A-Za-z0-9._-]/g, "_");

  // 压缩连续多个 _
  clean = clean.replace(/_+/g, "_");

  // 去掉开头的数字或下划线
  clean = clean.replace(/^[_0-9]+/, "");

  if (!clean.trim()) clean = fallback;

  return clean;
}

// ---------------- 提取元数据 ----------------

function extractMeta(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const block = extractWidgetBlock(content);

  const fallbackId = path.basename(filePath, ".js");

  if (block) {
    const rawId = (block.match(/id:\s*["'](.+?)["']/) || [])[1] || fallbackId;

    return {
      id: sanitizeId(rawId, fallbackId),
      title: (block.match(/title:\s*["'](.+?)["']/) || [])[1] || fallbackId,
      description: (block.match(/description:\s*["'](.+?)["']/) || [])[1] || "",
      requiredVersion: (block.match(/requiredVersion:\s*["'](.+?)["']/) || [])[1] || "0.0.1",
      version: (block.match(/version:\s*["'](.+?)["']/) || [])[1] || "0.0.1",
      author: (block.match(/author:\s*["'](.+?)["']/) || [])[1] || "unknown",
    };
  }

  return {
    id: fallbackId,
    title: fallbackId,
    description: "",
    requiredVersion: "0.0.1",
    version: "0.0.1",
    author: "unknown",
  };
}

// ---------------- 生成 fwd ----------------

const BASE_RAW_URL = "https://raw.githubusercontent.com/EmrysChoo/Proxy/refs/heads/main/Forward/JS";

const widgets = files.map(file => {
  const meta = extractMeta(path.join(widgetsDir, file));
  return {
    ...meta,
    url: `${BASE_RAW_URL}/${encodeURIComponent(file)}`,
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

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

// ---------------- ID 清洗：确保 fwd 可用 ----------------

function sanitizeId(id, fallback) {
  if (!id) return fallback;

  let clean = id.replace(/[^a-zA-Z0-9._-]/g, "_");

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

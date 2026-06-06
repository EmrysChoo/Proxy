const fs = require("fs");
const path = require("path");

const widgetsDir = path.join(__dirname, "JS");
const files = fs.existsSync(widgetsDir)
  ? fs.readdirSync(widgetsDir).filter(f => f.endsWith(".js"))
  : [];

console.log("找到的文件:", files);

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

function extractMeta(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const block = extractWidgetBlock(content);

  if (!block) {
    console.warn("⚠ 未找到 WidgetMetadata:", filePath);
    return null;
  }

  function pick(field) {
    const regex = new RegExp(field + `:\\s*["']([\\s\\S]*?)["']`, 'i');
    const m = block.match(regex);
    return m ? m[1].replace(/[\n\r\t]/g, ' ').trim() : null;
  }

  return {
    id: pick("id"),
    title: pick("title"),
    description: pick("description"),
    version: pick("version"),
    author: pick("author")
  };
}

const BASE_RAW_URL = "https://raw.githubusercontent.com/EmrysChoo/Proxy/refs/heads/main/Forward/JS";

const widgets = [];
for (const file of files) {
  const meta = extractMeta(path.join(widgetsDir, file));
  if (meta && meta.id && meta.title) {
    widgets.push({
      id: meta.id,
      title: meta.title,
      description: meta.description || "",
      version: meta.version || "1.0.0",
      author: meta.author || "",
      url: `${BASE_RAW_URL}/${encodeURIComponent(file)}`
    });
  } else {
    console.warn(`⚠ 跳过无效文件: ${file}`, meta);
  }
}

const fwd = {
  widgets: widgets
};

const outputPath = path.join(__dirname, "forward.fwd");
fs.writeFileSync(outputPath, JSON.stringify(fwd, null, 2));
console.log("✅ 已生成:", outputPath);
console.log("内容预览:", JSON.stringify(fwd, null, 2).substring(0, 500));

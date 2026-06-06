const fs = require("fs");
const path = require("path");

console.log("========== 开始生成 forward.fwd ==========");
console.log("脚本所在目录:", __dirname);

const widgetsDir = path.join(__dirname, "JS");
console.log("JS 目录路径:", widgetsDir);
console.log("JS 目录是否存在?", fs.existsSync(widgetsDir));

if (!fs.existsSync(widgetsDir)) {
  console.error("❌ 错误：JS 目录不存在！请检查目录结构。");
  process.exit(1);
}

const files = fs.readdirSync(widgetsDir).filter(f => f.endsWith(".js"));
console.log(`找到 ${files.length} 个 JS 文件:`, files);

if (files.length === 0) {
  console.error("❌ 错误：JS 目录下没有 .js 文件！");
  process.exit(1);
}

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
    version: pick("version"),
    author: pick("author"),
  };
}

// ---------------- 生成 fwd ----------------
const BASE_RAW_URL = "https://raw.githubusercontent.com/EmrysChoo/Proxy/refs/heads/main/Forward/JS";

const widgets = [];
for (const file of files) {
  console.log(`处理文件: ${file}`);
  const filePath = path.join(widgetsDir, file);
  const meta = extractMeta(filePath);
  
  if (meta && meta.id && meta.title) {
    widgets.push({
      id: meta.id,
      title: meta.title,
      description: meta.description || "",
      version: meta.version || "1.0.0",
      author: meta.author || "",
      url: `${BASE_RAW_URL}/${encodeURIComponent(file)}`
    });
    console.log(`  ✅ 成功添加: ${meta.title} (${meta.id})`);
  } else {
    console.log(`  ❌ 跳过: 缺少 id 或 title`);
  }
}

if (widgets.length === 0) {
  console.error("❌ 没有有效的模块可生成！");
  process.exit(1);
}

const fwd = { widgets: widgets };
const outputPath = path.join(__dirname, "forward.fwd");

try {
  fs.writeFileSync(outputPath, JSON.stringify(fwd, null, 2), "utf-8");
  console.log(`\n✅ forward.fwd 已生成: ${outputPath}`);
  console.log(`📦 共包含 ${widgets.length} 个模块`);
  
  // 验证文件是否真的写入了
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    console.log(`📄 文件大小: ${stats.size} bytes`);
  }
} catch (err) {
  console.error("❌ 写入文件失败:", err.message);
}

console.log("========== 生成完成 ==========");

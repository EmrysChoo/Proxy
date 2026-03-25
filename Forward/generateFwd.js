const fs = require("fs");
const path = require("path");

const widgetsDir = "Proxy/Forward/JS";

// 提取函数：用正则匹配 JS 文件里的字段
function extractMeta(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const meta = {};

  meta.id = (content.match(/id:\s*["'](.+?)["']/) || [])[1] || "";
  meta.title = (content.match(/title:\s*["'](.+?)["']/) || [])[1] || "";
  meta.description = (content.match(/description:\s*["'](.+?)["']/) || [])[1] || "";
  meta.requiredVersion = (content.match(/requiredVersion:\s*["'](.+?)["']/) || [])[1] || "";
  meta.version = (content.match(/version:\s*["'](.+?)["']/) || [])[1] || "";
  meta.author = (content.match(/author:\s*["'](.+?)["']/) || [])[1] || "";

  return meta;
}

// 遍历 JS 目录下所有 js 文件
const files = fs.readdirSync(widgetsDir).filter(f => f.endsWith(".js"));

const widgets = files.map(file => {
  const meta = extractMeta(path.join(widgetsDir, file));
  return {
    ...meta,
    url: `https://raw.githubusercontent.com/EmrysChoo/Proxy/refs/heads/main/Forward/JS/${file}`
  };
});

const fwd = {
  title: "Ti's Widgets",
  description: "Made by Love",
  icon: "https://raw.githubusercontent.com/EmrysChoo/Proxy/refs/heads/main/Forward/icon.png",
  widgets
};

fs.writeFileSync("Proxy/Forward/forward.fwd", JSON.stringify(fwd, null, 2));
console.log("✅ forward.fwd 已生成，包含", widgets.length, "个 widgets");

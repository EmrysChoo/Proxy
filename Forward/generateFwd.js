const fs = require("fs");
const path = require("path");

// 目标目录：Forward/JS
const widgetsDir = path.join(__dirname, "JS");

// 读取所有 .js 文件
const files = fs.existsSync(widgetsDir)
  ? fs.readdirSync(widgetsDir).filter(f => f.endsWith(".js"))
  : [];

console.log("找到的文件:", files);

// 构建 widgets 数组
const widgets = files.map(file => {
  return {
    id: path.basename(file, ".js"),
    title: path.basename(file, ".js"),
    description: "",
    requiredVersion: "0.0.1",
    version: "0.0.1",
    author: "unknown",
    url: `https://raw.githubusercontent.com/<你的GitHub用户名>/<你的仓库名>/refs/heads/main/Forward/JS/${file}`
  };
});

// 构建最终 fwd 对象
const fwd = {
  title: "My Widgets",
  description: "Made by Love",
  // 没有 icon.png 就用占位符，或者直接删掉这一行
  icon: "https://via.placeholder.com/64",
  widgets
};

// 输出路径：Forward/forward.fwd
const outputPath = path.join(__dirname, "forward.fwd");
fs.writeFileSync(outputPath, JSON.stringify(fwd, null, 2));
console.log("✅ forward.fwd 已生成:", outputPath);

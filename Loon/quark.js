// Loon 插件脚本 - Forward 挂载夸克网盘
// 使用方法：
// 1. 在 Loon 中创建本地脚本
// 2. 添加重写规则拦截 Alist API 请求
// 3. Forward 中配置 Alist 地址为你的代理地址

const QUARK_COOKIE_KEY = ‘quark_cookie’;
const QUARK_API_BASE = ‘https://drive.quark.cn/1/clouddrive’;
const PATH_CACHE_KEY = ‘quark_path_cache’;

// 主函数
(async () => {
const url = $request.url;
const method = $request.method;
const body = getRequestBody();

console.log(`[Quark-Forward] ${method} ${url}`);

try {
// 路由分发
if (url.includes(’/api/auth/login’)) {
await handleLogin(body);
} else if (url.includes(’/api/me’)) {
handleMe();
} else if (url.includes(’/api/fs/list’)) {
await handleList(body);
} else if (url.includes(’/api/fs/get’)) {
await handleGet(body);
} else if (url.includes(’/api/fs/link’)) {
await handleLink(body);
} else if (url.includes(’/api/fs/remove’)) {
await handleRemove(body);
} else if (url.includes(’/ping’)) {
handlePing();
} else {
$done({});
}
} catch (error) {
console.log(`[Quark-Forward] Error: ${error}`);
respondError(500, error.message || ‘服务器错误’);
}
})();

// ============ API 处理函数 ============

// 登录
async function handleLogin(body) {
const { username, password } = JSON.parse(body);

// password 就是夸克 Cookie
const cookie = password;

// 验证 Cookie
const isValid = await validateCookie(cookie);

if (!isValid) {
return respondError(401, ‘夸克 Cookie 无效或已过期’);
}

// 保存 Cookie
$persistentStore.write(cookie, QUARK_COOKIE_KEY);

// 清空路径缓存
$persistentStore.write(’{}’, PATH_CACHE_KEY);

respondSuccess({
token: Buffer.from(`${username}:${Date.now()}`).toString(‘base64’)
});
}

// 获取用户信息
function handleMe() {
respondSuccess({
id: 1,
username: ‘quark’,
base_path: ‘/’,
role: 2
});
}

// 列出文件
async function handleList(body) {
const { path } = JSON.parse(body);
const cookie = $persistentStore.read(QUARK_COOKIE_KEY);

if (!cookie) {
return respondError(401, ‘未登录’);
}

const folderId = await pathToFid(path || ‘/’, cookie);
const files = await getFileList(folderId, cookie);

respondSuccess({
content: files,
total: files.length,
readme: ‘’,
write: false,
provider: ‘Quark’
});
}

// 获取文件详情
async function handleGet(body) {
const { path } = JSON.parse(body);
const cookie = $persistentStore.read(QUARK_COOKIE_KEY);

if (!cookie) {
return respondError(401, ‘未登录’);
}

const folderId = await pathToFid(path, cookie);
const fileInfo = await getFileInfo(folderId, cookie);

if (!fileInfo) {
return respondError(404, ‘文件不存在’);
}

// 如果是文件，获取下载链接
if (!fileInfo.is_dir) {
fileInfo.raw_url = await getDownloadUrl(folderId, cookie);
}

respondSuccess(fileInfo);
}

// 获取下载链接
async function handleLink(body) {
const { path } = JSON.parse(body);
const cookie = $persistentStore.read(QUARK_COOKIE_KEY);

if (!cookie) {
return respondError(401, ‘未登录’);
}

const folderId = await pathToFid(path, cookie);
const downloadUrl = await getDownloadUrl(folderId, cookie);

if (!downloadUrl) {
return respondError(404, ‘获取下载链接失败’);
}

respondSuccess({
url: downloadUrl,
header: {
‘User-Agent’: ‘Mozilla/5.0’,
‘Referer’: ‘https://pan.quark.cn’
}
});
}

// 删除文件
async function handleRemove(body) {
const { names, dir } = JSON.parse(body);
const cookie = $persistentStore.read(QUARK_COOKIE_KEY);

if (!cookie) {
return respondError(401, ‘未登录’);
}

const fileIds = [];
for (const name of names) {
const fullPath = `${dir}/${name}`.replace(//+/g, ‘/’);
const fid = await pathToFid(fullPath, cookie);
if (fid) fileIds.push(fid);
}

await deleteFiles(fileIds, cookie);

respondSuccess(null);
}

// Ping
function handlePing() {
respondSuccess(‘pong’);
}

// ============ 夸克 API 调用 ============

// 验证 Cookie
async function validateCookie(cookie) {
const response = await http({
url: `${QUARK_API_BASE}/file/sort?pdir_fid=0&_page=1&_size=1&fr=pc&pr=ucpro`,
headers: { cookie }
}, ‘get’);

return response !== null;
}

// 获取文件列表
async function getFileList(folderId, cookie) {
const allFiles = [];
let page = 1;
let hasMore = true;

while (hasMore) {
const response = await http({
url: `${QUARK_API_BASE}/file/sort?_fetch_total=1&_page=${page}&_size=100&fr=pc&pdir_fid=${folderId}&pr=ucpro`,
headers: {
cookie,
‘content-type’: ‘application/json’
}
}, ‘get’);

```
if (!response) break;

const list = response.data?.list || [];

if (list.length === 0) {
  hasMore = false;
  break;
}

// 转换为 Alist 格式
const files = list.map(file => ({
  name: file.file_name,
  size: file.size || 0,
  is_dir: !file.file,
  modified: new Date(file.updated_at || file.created_at).toISOString(),
  created: new Date(file.created_at).toISOString(),
  sign: '',
  thumb: file.thumbnail || '',
  type: file.file ? getFileType(file.file_name) : 1,
  _fid: file.fid
}));

allFiles.push(...files);

// 检查是否还有更多
const total = response.metadata?._total || 0;
if (page * 100 >= total) {
  hasMore = false;
}

page++;
```

}

return allFiles;
}

// 获取文件信息
async function getFileInfo(folderId, cookie) {
const response = await http({
url: `${QUARK_API_BASE}/file/info?fid=${folderId}&fr=pc&pr=ucpro`,
headers: { cookie }
}, ‘get’);

if (!response) return null;

const file = response.data;

return {
name: file.file_name,
size: file.size || 0,
is_dir: !file.file,
modified: new Date(file.updated_at).toISOString(),
created: new Date(file.created_at).toISOString(),
sign: ‘’,
thumb: file.thumbnail || ‘’,
type: file.file ? getFileType(file.file_name) : 1,
_fid: file.fid
};
}

// 获取下载链接
async function getDownloadUrl(folderId, cookie) {
const response = await http({
url: `${QUARK_API_BASE}/file/download?fr=pc&pr=ucpro`,
headers: {
cookie,
‘content-type’: ‘application/json’
},
body: JSON.stringify({ fids: [folderId] })
}, ‘post’);

return response?.data?.[0]?.download_url || null;
}

// 删除文件
async function deleteFiles(fileIds, cookie) {
await http({
url: `${QUARK_API_BASE}/file/delete?fr=pc&pr=ucpro`,
headers: {
cookie,
‘content-type’: ‘application/json’
},
body: JSON.stringify({
action_type: 1,
exclude_fids: [],
filelist: fileIds
})
}, ‘post’);
}

// ============ 工具函数 ============

// 路径转文件 ID
async function pathToFid(path, cookie) {
if (path === ‘/’ || path === ‘’) return ‘0’;

// 读取缓存
const cache = JSON.parse($persistentStore.read(PATH_CACHE_KEY) || ‘{}’);

if (cache[path]) {
return cache[path];
}

// 解析路径
const parts = path.split(’/’).filter(p => p);
let currentFid = ‘0’;
let currentPath = ‘’;

for (const part of parts) {
currentPath += ‘/’ + part;

```
// 检查缓存
if (cache[currentPath]) {
  currentFid = cache[currentPath];
  continue;
}

// 获取当前目录的文件列表
const files = await getFileList(currentFid, cookie);
const found = files.find(f => f.name === part);

if (!found) {
  console.log(`[Quark-Forward] 路径不存在: ${currentPath}`);
  return null;
}

currentFid = found._fid;
cache[currentPath] = currentFid;
```

}

// 保存缓存
$persistentStore.write(JSON.stringify(cache), PATH_CACHE_KEY);

return currentFid;
}

// HTTP 请求封装
function http(options, method = ‘get’) {
return new Promise((resolve) => {
$httpClient[method](options, (error, response, data) => {
if (error) {
console.log(`[Quark-Forward] HTTP Error: ${error}`);
resolve(null);
return;
}

```
  if (response.status === 401) {
    console.log('[Quark-Forward] Cookie 已过期');
    resolve(null);
    return;
  }
  
  if (response.status !== 200) {
    console.log(`[Quark-Forward] HTTP Status: ${response.status}`);
    resolve(null);
    return;
  }
  
  try {
    resolve(JSON.parse(data));
  } catch {
    resolve(data);
  }
});
```

});
}

// 获取请求体
function getRequestBody() {
if ($request.method === ‘POST’) {
return $request.body || ‘{}’;
}
return ‘{}’;
}

// 文件类型判断
function getFileType(filename) {
const ext = filename.split(’.’).pop()?.toLowerCase() || ‘’;
const videoExts = [‘mp4’, ‘mkv’, ‘avi’, ‘mov’, ‘flv’, ‘wmv’, ‘webm’, ‘m3u8’, ‘ts’];
const audioExts = [‘mp3’, ‘flac’, ‘wav’, ‘aac’, ‘ogg’, ‘m4a’];
const imageExts = [‘jpg’, ‘jpeg’, ‘png’, ‘gif’, ‘bmp’, ‘webp’, ‘svg’];

if (videoExts.includes(ext)) return 2; // 视频
if (audioExts.includes(ext)) return 3; // 音频
if (imageExts.includes(ext)) return 4; // 图片
return 5; // 其他
}

// 成功响应
function respondSuccess(data) {
$done({
response: {
status: 200,
headers: {
‘Content-Type’: ‘application/json; charset=utf-8’
},
body: JSON.stringify({
code: 200,
message: ‘success’,
data: data
})
}
});
}

// 错误响应
function respondError(code, message) {
$done({
response: {
status: 200,
headers: {
‘Content-Type’: ‘application/json; charset=utf-8’
},
body: JSON.stringify({
code: code,
message: message,
data: null
})
}
});
}

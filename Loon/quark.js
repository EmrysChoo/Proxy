// Loon Plugin for Quark WebDAV
// 使用方法：在 WebDAV 客户端中，地址填 http://quark.example.com，密码填夸克 token

const type = "quark";

async function handleRequest(request) {
    const url = request.url;
    const body = request.body;
    
    try {
        if (url.includes("auth.cgi")) {
            return handleAuth(request);
        } else if (url.includes("entry.cgi")) {
            return handleEntry(request);
        } else if (url.includes("fbdownload") || url.includes("path=")) {
            return handleDownload(request);
        } else {
            // WebDAV 请求处理
            return handleWebDAV(request);
        }
    } catch (error) {
        console.log("处理请求出错: " + error);
        return new Response(JSON.stringify({error: "Internal Server Error"}), {
            status: 500,
            headers: {"Content-Type": "application/json"}
        });
    }
}

function handleAuth(request) {
    const body = request.body;
    const token = decodeURIComponent(body.match(/passwd=([^&]+)/)[1]);
    $persistentStore.write(token, "quark-ck");
    
    return new Response(JSON.stringify({
        success: true,
        data: {sid: token}
    }), {
        status: 200,
        headers: {"Content-Type": "application/json"}
    });
}

async function handleEntry(request) {
    const body = request.body;
    
    if (body.includes("Delete&")) {
        return handleDelete(request);
    } else if (body.includes("method=get")) {
        return handlePhoto(request);
    } else {
        return handleFileList(request);
    }
}

async function handleFileList(request) {
    const body = request.body;
    const token = $persistentStore.read("quark-ck");
    const folderId = body.match(/folder_path=([^&]+)/)?.[1] || "0";
    const isRoot = folderId === "0";
    const responseKey = isRoot ? "shares" : "files";
    
    const fileList = await getQuarkFileList(folderId, token);
    
    return new Response(JSON.stringify({
        success: true,
        data: {
            total: 0,
            offset: 0,
            [responseKey]: fileList
        }
    }), {
        status: 200,
        headers: {"Content-Type": "application/json"}
    });
}

async function getQuarkFileList(folderId, token) {
    let page = 1;
    const pageSize = 100;
    let allFiles = [];
    let totalPages = 1;
    
    do {
        const url = `https://drive.quark.cn/1/clouddrive/file/sort?_fetch_total=1&_page=${page}&_size=${pageSize}&fr=pc&pdir_fid=${folderId}&pr=ucpro`;
        
        const response = await $httpClient.get({
            url: url,
            headers: {
                "cookie": token,
                "content-type": "application/json"
            }
        });
        
        if (response.status === 200) {
            const data = JSON.parse(response.body);
            if (page === 1) {
                totalPages = Math.ceil(parseInt(data.metadata._total) / pageSize);
            }
            
            const files = data.data.list.map(item => ({
                isdir: !item.file, // 如果是文件夹，file 字段为 undefined
                path: item.fid,
                name: item.file_name,
                additional: {
                    size: item.size || 0
                }
            }));
            
            allFiles = allFiles.concat(files);
            page++;
        } else {
            break;
        }
    } while (page <= totalPages);
    
    return allFiles;
}

async function handleDelete(request) {
    const body = request.body;
    const fileId = body.match(/path=([^&]+)/)[1];
    const token = $persistentStore.read("quark-ck");
    
    const response = await $httpClient.post({
        url: "https://drive.quark.cn/1/clouddrive/file/delete?fr=pc&pr=ucpro",
        headers: {
            "cookie": token,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            "action_type": 1,
            "exclude_fids": [],
            "filelist": [fileId]
        })
    });
    
    return new Response(response.body, {
        status: response.status,
        headers: {"Content-Type": "application/json"}
    });
}

function handlePhoto(request) {
    const body = request.body;
    const filePath = body.match(/path=([^&?]+)/)[1];
    
    return new Response(null, {
        status: 301,
        headers: {
            "Location": `http://${type}.example.com:5000/webapi/entry.cgi?api=SYNO.FileStation.Download&version=2&method=download&mode=open&path=${filePath}`
        }
    });
}

async function handleDownload(request) {
    const url = request.url;
    let fileId;
    
    if (url.includes("fbdownload")) {
        fileId = hex2str(url.match(/dlink=%22(.*)%22/)[1]);
    } else {
        fileId = url.match(/path=(.*$)/)[1];
    }
    
    const token = $persistentStore.read("quark-ck");
    
    // 获取下载链接
    const downloadResponse = await $httpClient.post({
        url: "http://drive.quark.cn/1/clouddrive/file/download?fr=pc&pr=ucpro",
        headers: {
            "cookie": token,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            "fids": [fileId]
        })
    });
    
    if (downloadResponse.status === 200) {
        const data = JSON.parse(downloadResponse.body);
        const downloadUrl = data.data[0].download_url.replace(/https/, "http");
        
        // 对于下载请求，直接重定向到真实下载链接
        return new Response(null, {
            status: 302,
            headers: {
                "Location": downloadUrl
            }
        });
    } else {
        return new Response(JSON.stringify({error: "Download failed"}), {
            status: 500,
            headers: {"Content-Type": "application/json"}
        });
    }
}

// WebDAV 处理函数
async function handleWebDAV(request) {
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 从 Authorization 头获取 token
    const authHeader = request.headers["Authorization"];
    let token = "";
    
    if (authHeader && authHeader.startsWith("Basic ")) {
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = atob(base64Credentials);
        // WebDAV 通常用户名为任意值，密码为 token
        token = credentials.split(':')[1];
    } else {
        // 如果没有 Authorization 头，尝试从持久化存储获取
        token = $persistentStore.read("quark-ck");
    }
    
    if (!token) {
        return new Response("Unauthorized", {
            status: 401,
            headers: {
                "WWW-Authenticate": 'Basic realm="Quark WebDAV"'
            }
        });
    }
    
    switch (method) {
        case "PROPFIND":
            return handlePropfind(path, token);
        case "GET":
            return handleWebDAVDownload(path, token);
        case "HEAD":
            return handleHead(path, token);
        default:
            return new Response("Method Not Allowed", {status: 405});
    }
}

async function handlePropfind(path, token) {
    // 将路径转换为文件夹 ID
    const folderId = path === "/" ? "0" : path.split("/").pop();
    
    const fileList = await getQuarkFileList(folderId, token);
    
    // 生成 WebDAV PROPFIND 响应
    const xmlResponse = generatePropfindResponse(path, fileList);
    
    return new Response(xmlResponse, {
        status: 207,
        headers: {
            "Content-Type": "application/xml",
            "DAV": "1,2"
        }
    });
}

function generatePropfindResponse(currentPath, fileList) {
    const baseUrl = "http://quark.example.com";
    let xml = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">`;
    
    // 添加当前目录
    xml += `
<D:response>
    <D:href>${baseUrl}${currentPath}</D:href>
    <D:propstat>
        <D:prop>
            <D:resourcetype><D:collection/></D:resourcetype>
            <D:displayname>${currentPath === "/" ? "root" : currentPath.split("/").pop()}</D:displayname>
            <D:getlastmodified>${new Date().toUTCString()}</D:getlastmodified>
        </D:prop>
        <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
</D:response>`;
    
    // 添加文件列表
    fileList.forEach(file => {
        const filePath = currentPath === "/" ? `/${file.name}` : `${currentPath}/${file.name}`;
        xml += `
<D:response>
    <D:href>${baseUrl}${file.isdir ? filePath + "/" : filePath}</D:href>
    <D:propstat>
        <D:prop>
            <D:resourcetype>${file.isdir ? "<D:collection/>" : ""}</D:resourcetype>
            <D:displayname>${file.name}</D:displayname>
            <D:getcontentlength>${file.isdir ? "" : file.additional.size}</D:getcontentlength>
            <D:getlastmodified>${new Date().toUTCString()}</D:getlastmodified>
        </D:prop>
        <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
</D:response>`;
    });
    
    xml += "\n</D:multistatus>";
    return xml;
}

async function handleWebDAVDownload(path, token) {
    const fileId = path.split("/").pop();
    
    const downloadResponse = await $httpClient.post({
        url: "http://drive.quark.cn/1/clouddrive/file/download?fr=pc&pr=ucpro",
        headers: {
            "cookie": token,
            "content-type": "application/json"
        },
        body: JSON.stringify({
            "fids": [fileId]
        })
    });
    
    if (downloadResponse.status === 200) {
        const data = JSON.parse(downloadResponse.body);
        const downloadUrl = data.data[0].download_url.replace(/https/, "http");
        
        // 重定向到真实下载链接
        return new Response(null, {
            status: 302,
            headers: {
                "Location": downloadUrl
            }
        });
    } else {
        return new Response("Download failed", {status: 500});
    }
}

function handleHead(path, token) {
    // 返回 HEAD 响应
    return new Response(null, {
        status: 200,
        headers: {
            "Content-Type": "application/octet-stream",
            "DAV": "1,2"
        }
    });
}

function hex2str(hex) {
    const trimmedHex = hex.trim();
    const hexString = trimmedHex.toLowerCase().startsWith("0x") ? trimmedHex.substr(2) : trimmedHex;
    
    if (hexString.length % 2 !== 0) return "";
    
    const chars = [];
    for (let i = 0; i < hexString.length; i += 2) {
        const charCode = parseInt(hexString.substr(i, 2), 16);
        chars.push(String.fromCharCode(charCode));
    }
    return chars.join("");
}

// Loon 插件入口
(async () => {
    const response = await handleRequest($request);
    $done(response);
})();

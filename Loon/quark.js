// Loon Plugin for Quark WebDAV
// 使用方法：在 WebDAV 客户端中，地址填 http://quark.example.com，密码填夸克 token

const type = "quark";

(async () => {
    const request = $request;
    const response = await handleRequest(request);
    $done(response);
})();

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
            return await handleWebDAV(request);
        }
    } catch (error) {
        console.log("处理请求出错: " + error);
        return {
            status: 500,
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({error: "Internal Server Error"})
        };
    }
}

function handleAuth(request) {
    const body = $text.URLDecode(request.body);
    const token = body.match(/passwd=([^&]+)/)?.[1];
    if (token) {
        $persistentStore.write(token, "quark-ck");
        return {
            status: 200,
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                success: true,
                data: {sid: token}
            })
        };
    }
    return {status: 400};
}

async function handleEntry(request) {
    const body = $text.URLDecode(request.body);
    
    if (body.includes("Delete&")) {
        return await handleDelete(request);
    } else if (body.includes("method=get")) {
        return handlePhoto(request);
    } else {
        return await handleFileList(request);
    }
}

async function handleFileList(request) {
    const body = $text.URLDecode(request.body);
    const token = $persistentStore.read("quark-ck");
    const folderId = body.match(/folder_path=([^&]+)/)?.[1] || "0";
    const isRoot = folderId === "0";
    const responseKey = isRoot ? "shares" : "files";
    
    const fileList = await getQuarkFileList(folderId, token);
    
    return {
        status: 200,
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            success: true,
            data: {
                total: 0,
                offset: 0,
                [responseKey]: fileList
            }
        })
    };
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
                isdir: !item.file,
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
    const body = $text.URLDecode(request.body);
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
    
    return {
        status: response.status,
        headers: {"Content-Type": "application/json"},
        body: response.body
    };
}

function handlePhoto(request) {
    const body = $text.URLDecode(request.body);
    const filePath = body.match(/path=([^&?]+)/)[1];
    
    return {
        status: 301,
        headers: {
            "Location": `http://${type}.example.com:5000/webapi/entry.cgi?api=SYNO.FileStation.Download&version=2&method=download&mode=open&path=${filePath}`
        }
    };
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
        
        return {
            status: 302,
            headers: {
                "Location": downloadUrl
            }
        };
    } else {
        return {
            status: 500,
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({error: "Download failed"})
        };
    }
}

// WebDAV 处理函数
async function handleWebDAV(request) {
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;
    
    // 从持久化存储获取 token
    let token = $persistentStore.read("quark-ck");
    
    if (!token) {
        return {
            status: 401,
            headers: {
                "WWW-Authenticate": 'Basic realm="Quark WebDAV"'
            },
            body: "Unauthorized"
        };
    }
    
    switch (method) {
        case "PROPFIND":
            return await handlePropfind(path, token);
        case "GET":
            return await handleWebDAVDownload(path, token);
        case "HEAD":
            return handleHead(path, token);
        default:
            return {
                status: 405,
                body: "Method Not Allowed"
            };
    }
}

async function handlePropfind(path, token) {
    // 将路径转换为文件夹 ID
    const pathParts = path.split('/').filter(p => p);
    const folderId = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "0";
    
    const fileList = await getQuarkFileList(folderId, token);
    
    // 生成 WebDAV PROPFIND 响应
    const xmlResponse = generatePropfindResponse(path, fileList);
    
    return {
        status: 207,
        headers: {
            "Content-Type": "application/xml",
            "DAV": "1,2"
        },
        body: xmlResponse
    };
}

function generatePropfindResponse(currentPath, fileList) {
    const baseUrl = "http://quark.example.com";
    let xml = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">`;
    
    // 添加当前目录
    const displayName = currentPath === "/" ? "root" : currentPath.split("/").pop() || "root";
    xml += `
<D:response>
    <D:href>${baseUrl}${currentPath.endsWith('/') ? currentPath : currentPath + '/'}</D:href>
    <D:propstat>
        <D:prop>
            <D:resourcetype><D:collection/></D:resourcetype>
            <D:displayname>${displayName}</D:displayname>
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
            <D:getcontentlength>${file.isdir ? "0" : file.additional.size}</D:getcontentlength>
            <D:getlastmodified>${new Date().toUTCString()}</D:getlastmodified>
        </D:prop>
        <D

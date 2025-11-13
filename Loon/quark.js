/**
 * @name Quark WebDAV
 * @desc 将夸克网盘转换为 WebDAV 服务
 * @author YourName
 * @version 1.0.0
 * @module .
 * @license MIT
 */

const module = {
    name: "Quark WebDAV",
    version: "1.0.0",
    author: "YourName",
    description: "将夸克网盘转换为 WebDAV 服务",
    
    // 持久化存储 key
    storageKey: "quark_token",
    
    // 处理请求
    onRequest: async (request) => {
        const url = request.url;
        
        try {
            // WebDAV 相关请求
            if (url.includes("quark.example.com")) {
                return await module.handleWebDAVRequest(request);
            }
            
            // 原有的 API 请求
            if (url.includes("auth.cgi")) {
                return module.handleAuth(request);
            } else if (url.includes("entry.cgi")) {
                return await module.handleEntry(request);
            } else if (url.includes("fbdownload") || url.includes("path=")) {
                return await module.handleDownload(request);
            }
            
            return request;
        } catch (error) {
            console.log(`[Quark WebDAV] 处理请求出错: ${error}`);
            return {
                status: 500,
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({error: "Internal Server Error"})
            };
        }
    },
    
    // 处理认证
    handleAuth: (request) => {
        const body = request.body;
        const tokenMatch = body.match(/passwd=([^&]+)/);
        
        if (tokenMatch && tokenMatch[1]) {
            const token = decodeURIComponent(tokenMatch[1]);
            $persistentStore.write(token, module.storageKey);
            
            return {
                status: 200,
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    success: true,
                    data: {sid: token}
                })
            };
        }
        
        return {
            status: 400,
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({error: "Bad Request"})
        };
    },
    
    // 处理入口请求
    handleEntry: async (request) => {
        const body = request.body;
        
        if (body.includes("Delete&")) {
            return await module.handleDelete(request);
        } else if (body.includes("method=get")) {
            return module.handlePhoto(request);
        } else {
            return await module.handleFileList(request);
        }
    },
    
    // 处理文件列表
    handleFileList: async (request) => {
        const body = request.body;
        const token = $persistentStore.read(module.storageKey);
        const folderId = body.match(/folder_path=([^&]+)/)?.[1] || "0";
        const isRoot = folderId === "0";
        const responseKey = isRoot ? "shares" : "files";
        
        if (!token) {
            return {
                status: 401,
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({error: "Unauthorized"})
            };
        }
        
        const fileList = await module.getQuarkFileList(folderId, token);
        
        return {
            status: 200,
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                success: true,
                data: {
                    total: fileList.length,
                    offset: 0,
                    [responseKey]: fileList
                }
            })
        };
    },
    
    // 获取夸克文件列表
    getQuarkFileList: async (folderId, token) => {
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
                
                if (page === 1 && data.metadata && data.metadata._total) {
                    totalPages = Math.ceil(parseInt(data.metadata._total) / pageSize);
                }
                
                if (data.data && data.data.list) {
                    const files = data.data.list.map(item => ({
                        isdir: !item.file,
                        path: item.fid,
                        name: item.file_name,
                        additional: {
                            size: item.size || 0
                        }
                    }));
                    
                    allFiles = allFiles.concat(files);
                }
                
                page++;
            } else {
                break;
            }
        } while (page <= totalPages);
        
        return allFiles;
    },
    
    // 处理删除
    handleDelete: async (request) => {
        const body = request.body;
        const token = $persistentStore.read(module.storageKey);
        const fileIdMatch = body.match(/path=([^&]+)/);
        
        if (!fileIdMatch || !token) {
            return {
                status: 400,
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({error: "Bad Request"})
            };
        }
        
        const fileId = fileIdMatch[1];
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
    },
    
    // 处理照片
    handlePhoto: (request) => {
        const body = request.body;
        const pathMatch = body.match(/path=([^&?]+)/);
        
        if (pathMatch) {
            return {
                status: 301,
                headers: {
                    "Location": `http://quark.example.com:5000/webapi/entry.cgi?api=SYNO.FileStation.Download&version=2&method=download&mode=open&path=${pathMatch[1]}`
                }
            };
        }
        
        return {
            status: 400,
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({error: "Bad Request"})
        };
    },
    
    // 处理下载
    handleDownload: async (request) => {
        const url = request.url;
        let fileId;
        
        if (url.includes("fbdownload")) {
            const dlinkMatch = url.match(/dlink=%22(.*)%22/);
            if (dlinkMatch) {
                fileId = module.hex2str(dlinkMatch[1]);
            }
        } else {
            const pathMatch = url.match(/path=(.*$)/);
            if (pathMatch) {
                fileId = pathMatch[1];
            }
        }
        
        if (!fileId) {
            return {
                status: 400,
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({error: "Bad Request"})
            };
        }
        
        const token = $persistentStore.read(module.storageKey);
        
        if (!token) {
            return {
                status: 401,
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({error: "Unauthorized"})
            };
        }
        
        const downloadResponse = await $httpClient.post({
            url: "https://drive.quark.cn/1/clouddrive/file/download?fr=pc&pr=ucpro",
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
            if (data.data && data.data[0] && data.data[0].download_url) {
                const downloadUrl = data.data[0].download_url.replace(/^https:/, "http:");
                
                return {
                    status: 302,
                    headers: {
                        "Location": downloadUrl
                    }
                };
            }
        }
        
        return {
            status: 500,
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({error: "Download failed"})
        };
    },
    
    // 处理 WebDAV 请求
    handleWebDAVRequest: async (request) => {
        const method = request.method;
        const path = request.url.split('/').slice(3).join('/'); // 移除协议和域名部分
        
        const token = $persistentStore.read(module.storageKey);
        
        if (!token) {
            return {
                status: 401,
                headers: {
                    "WWW-Authenticate": 'Basic realm="Quark WebDAV"',
                    "Content-Type": "text/plain"
                },
                body: "Unauthorized"
            };
        }
        
        switch (method) {
            case "PROPFIND":
                return await module.handlePropfind(path, token);
            case "GET":
                return await module.handleWebDAVDownload(path, token);
            case "HEAD":
                return module.handleHead();
            default:
                return {
                    status: 405,
                    headers: {"Content-Type": "text/plain"},
                    body: "Method Not Allowed"
                };
        }
    },
    
    // 处理 PROPFIND 请求
    handlePropfind: async (path, token) => {
        const pathParts = path.split('/').filter(p => p);
        const folderId = pathParts.length > 0 ? pathParts[pathParts.length - 1] : "0";
        
        const fileList = await module.getQuarkFileList(folderId, token);
        const xmlResponse = module.generatePropfindResponse(path, fileList);
        
        return {
            status: 207,
            headers: {
                "Content-Type": "application/xml",
                "DAV": "1, 2"
            },
            body: xmlResponse
        };
    },
    
    // 生成 PROPFIND 响应
    generatePropfindResponse: (currentPath, fileList) => {
        const baseUrl = "http://quark.example.com";
        let xml = `<?xml version="1.0" encoding="utf-8"?>
<D:multistatus xmlns:D="DAV:">`;
        
        // 当前目录
        const displayName = currentPath === "" ? "root" : currentPath.split("/").pop() || "root";
        xml += `
<D:response>
    <D:href>${baseUrl}/${currentPath}</D:href>
    <D:propstat>
        <D:prop>
            <D:resourcetype><D:collection/></D:resourcetype>
            <D:displayname>${displayName}</D:displayname>
            <D:getlastmodified>${new Date().toUTCString()}</D:getlastmodified>
        </D:prop>
        <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
</D:response>`;
        
        // 文件列表
        fileList.forEach(file => {
            const filePath = currentPath === "" ? file.name : `${currentPath}/${file.name}`;
            xml += `
<D:response>
    <D:href>${baseUrl}/${filePath}</D:href>
    <D:propstat>
        <D:prop>
            <D:resourcetype>${file.isdir ? "<D:collection/>" : ""}</D:resourcetype>
            <D:displayname>${file.name}</D:displayname>
            <D:getcontentlength>${file.isdir ? "0" : (file.additional.size || "0")}</D:getcontentlength>
            <D:getlastmodified>${new Date().toUTCString()}</D:getlastmodified>
        </D:prop>
        <D:status>HTTP/1.1 200 OK</D:status>
    </D:propstat>
</D:response>`;
        });
        
        xml += "\n</D:multistatus>";
        return xml;
    },
    
    // WebDAV 下载
    handleWebDAVDownload: async (path, token) => {
        const fileId = path.split("/").pop();
        
        const downloadResponse = await $httpClient.post({
            url: "https://drive.quark.cn/1/clouddrive/file/download?fr=pc&pr=ucpro",
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
            if (data.data && data.data[0] && data.data[0].download_url) {
                const downloadUrl = data.data[0].download_url.replace(/^https:/, "http:");
                
                return {
                    status: 302,
                    headers: {
                        "Location": downloadUrl
                    }
                };
            }
        }
        
        return {
            status: 500,
            headers: {"Content-Type": "text/plain"},
            body: "Download failed"
        };
    },
    
    // 处理 HEAD 请求
    handleHead: () => {
        return {
            status: 200,
            headers: {
                "Content-Type": "application/octet-stream",
                "DAV": "1, 2"
            }
        };
    },
    
    // 十六进制转字符串
    hex2str: (hex) => {
        const trimmedHex = hex.trim();
        const hexString = trimmedHex.toLowerCase().startsWith("0x") ? 
            trimmedHex.substr(2) : trimmedHex;
        
        if (hexString.length % 2 !== 0) return "";
        
        const chars = [];
        for (let i = 0; i < hexString.length; i += 2) {
            const charCode = parseInt(hexString.substr(i, 2), 16);
            chars.push(String.fromCharCode(charCode));
        }
        return chars.join("");
    }
};

// 导出模块
typeof $loon !== "undefined" ? module : undefined;
typeof $task !== "undefined" ? module : undefined;

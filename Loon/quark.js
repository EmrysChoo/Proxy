// 适用于 Loon 的 Quark WebDAV 适配脚本
const url = $request.url;
const method = $request.method;
const body = $request.body;
const headers = $request.headers;

if (!url.includes("quark.example.com")) {
  $done({});
}

(async () => {
  try {
    // 认证请求
    if (url.match(/auth\.cgi$/)) {
      const token = decodeURIComponent((body.match(/passwd=([^&]+)/) || [])[1] || "");
      if (!token) {
        $done({
          status: 401,
          body: "Missing token"
        });
        return;
      }
      $done({
        status: 200,
        body: JSON.stringify({
          success: true,
          data: {
            sid: token
          }
        })
      });
      return;
    }

    // 文件列表请求
    if (url.match(/entry\.cgi$/)) {
      if (body.includes("method=get")) {
        $done({
          status: 301,
          headers: {
            Location: "http://quark.example.com:1789/webapi/entry.cgi"
          }
        });
        return;
      }

      const token = decodeURIComponent((body.match(/passwd=([^&]+)/) || [])[1] || "");
      const fid = (body.match(/path=([^&]+)/) || [])[1];
      const folder = (body.match(/folder_path=([^&]+)/) || [])[1] || "0";
      const actionDelete = body.includes("Delete&");

      // 删除操作
      if (actionDelete) {
        const deleteRequest = {
          url: "https://drive.quark.cn/1/clouddrive/file/delete?fr=pc&pr=ucpro",
          headers: {
            "Cookie": token,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action_type: 1,
            exclude_fids: [],
            filelist: [fid]
          })
        };
        
        $httpClient.post(deleteRequest, function(error, response, data) {
          if (error) {
            $done({
              status: 500,
              body: error
            });
          } else {
            $done({
              status: 200,
              body: JSON.stringify({
                success: true
              })
            });
          }
        });
        return;
      }

      // 获取文件列表
      const listRequest = {
        url: "https://drive.quark.cn/1/clouddrive/file/sort?_fetch_total=1&_page=1&_size=100&fr=pc&pdir_fid=" + folder + "&pr=ucpro",
        headers: {
          "Cookie": token,
          "Content-Type": "application/json"
        }
      };

      $httpClient.get(listRequest, function(error, response, data) {
        if (error || !data) {
          $done({
            status: 500,
            body: "Request failed"
          });
          return;
        }

        try {
          const resp = JSON.parse(data);
          if (!resp?.data?.list) {
            $done({
              status: 500,
              body: "No files"
            });
            return;
          }

          const list = resp.data.list.map(e => ({
            isdir: !e.file,
            path: e.fid,
            name: e.file_name,
            additional: {
              size: e.size
            }
          }));

          $done({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: {
                total: list.length,
                offset: 0,
                files: list
              }
            })
          });
        } catch (e) {
          $done({
            status: 500,
            body: "Parse error"
          });
        }
      });
      return;
    }

    // 文件下载请求
    const token = decodeURIComponent((headers.Authorization?.split(" ")[1] || ""));
    const fid = (url.match(/path=(.*$)/) || [])[1];
    
    const downloadRequest = {
      url: "https://drive.quark.cn/1/clouddrive/file/download?fr=pc&pr=ucpro",
      headers: {
        "Cookie": token,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        fids: [fid]
      })
    };

    $httpClient.post(downloadRequest, function(error, response, data) {
      if (error || !data) {
        $done({
          status: 404,
          body: "File not found"
        });
        return;
      }

      try {
        const res = JSON.parse(data);
        if (!res?.data?.[0]?.download_url) {
          $done({
            status: 404,
            body: "File not found"
          });
          return;
        }

        const direct = res.data[0].download_url.replace(/^https/, "http");
        $done({
          status: 302,
          headers: {
            Location: direct
          }
        });
      } catch (e) {
        $done({
          status: 500,
          body: "Parse error"
        });
      }
    });

  } catch (e) {
    $done({
      status: 500,
      body: e.message
    });
  }
})();

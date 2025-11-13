//$loon
let url = $request.url;
let method = $request.method;
let body = $request.body || "";
let headers = $request.headers || {};

if (!url.includes("quark.example.com")) {
  $done({});
}

(async () => {
  if (url.match(/auth\.cgi$/)) {
    // FileBall 登录 WebDAV 时，密码中填入 token
    const token = decodeURIComponent(body.match(/passwd=([^&]+)/)?.[1] || "");
    if (!token) return $done({ response: { status: 401, body: "Missing token" } });
    $done({
      response: {
        status: 200,
        body: `{"success":true,"data":{"sid":"${token}"}}`
      }
    });
    return;
  }

  if (url.match(/entry\.cgi$/)) {
    if (body.includes("method=get")) return redirect();

    const token = decodeURIComponent(body.match(/passwd=([^&]+)/)?.[1] || "");
    const fid = body.match(/path=([^&]+)/)?.[1];
    const folder = body.match(/folder_path=([^&]+)/)?.[1] || "0";
    const actionDelete = body.includes("Delete&");

    let api = {
      url: "https://drive.quark.cn/1/clouddrive/file/sort?_fetch_total=1&_page=1&_size=100&fr=pc&pdir_fid=" + folder + "&pr=ucpro",
      headers: {
        cookie: token,
        "content-type": "application/json"
      }
    };

    if (actionDelete) {
      api.url = "https://drive.quark.cn/1/clouddrive/file/delete?fr=pc&pr=ucpro";
      api.body = JSON.stringify({
        action_type: 1,
        exclude_fids: [],
        filelist: [fid]
      });
      return $done(api);
    }

    // 获取目录文件列表
    const resp = await http(api, "get");
    if (!resp?.data?.list) return $done({ response: { status: 500, body: "No files" } });

    const list = resp.data.list.map(e => ({
      isdir: !e.file,
      path: e.fid,
      name: e.file_name,
      additional: { size: e.size }
    }));

    $done({
      response: {
        status: 200,
        body: JSON.stringify({
          success: true,
          data: { total: list.length, offset: 0, files: list }
        })
      }
    });
    return;
  }

  // 文件下载
  const token = decodeURIComponent(headers.Authorization?.split(" ")[1] || "");
  const fid = url.match(/path=(.*$)/)?.[1];
  let req = {
    url: "https://drive.quark.cn/1/clouddrive/file/download?fr=pc&pr=ucpro",
    headers: { cookie: token, "content-type": "application/json" },
    body: JSON.stringify({ fids: [fid] })
  };
  const res = await http(req, "post");
  if (!res?.data?.[0]?.download_url)
    return $done({ response: { status: 404, body: "File not found" } });

  const direct = res.data[0].download_url.replace(/^https/, "http");
  $done({ response: { status: 302, headers: { Location: direct } } });
})().catch(e => $done({ response: { status: 500, body: e.message } }));

function redirect() {
  $done({
    response: {
      method: "GET",
      status: 301,
      headers: {
        Location: "http://quark.example.com:1789/webapi/entry.cgi"
      }
    }
  });
}

function http(req, method = "get") {
  return new Promise(resolve => {
    $httpClient[method](req, (err, resp, data) => {
      if (err || !data) return resolve(null);
      try {
        resolve(JSON.parse(data));
      } catch {
        resolve(null);
      }
    });
  });
}

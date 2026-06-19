/**
 * 夸克网盘 Alist - 公开设置
 * 返回Alist公开设置信息
 */

$done({
  response: {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: 200,
      message: "success",
      data: {
        allow_indexed: false,
        allow_mounted: false,
        announcement: "",
        audio_autoplay: true,
        audio_cover: true,
        favicon: "",
        filename_char_mapping: { "/": "|" },
        forward_direct: true,
        hide_files: [],
        logo: "",
        main_color: "",
        package_download: false,
        search_index: "",
        site_title: "Quark Alist",
        version: "v2.0.0"
      }
    })
  }
});

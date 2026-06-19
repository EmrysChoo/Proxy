/**
 * 夸克网盘 Alist 协议 - 公开设置
 * GET /api/public/settings
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

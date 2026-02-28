/*
 Puter Grok Gateway PRO
 Auto Login Detection
*/

const url = $request.url;
const headers = $request.headers || {};

const COOKIE =
headers.Cookie ||
headers.cookie ||
"";

/* =========================
   LOGIN CHECK
========================= */

function notifyLoginRequired() {

  $notification.post(
    "Puter Grok",
    "未检测到登录状态",
    "请先打开 puter.com 登录账号"
  );

}

/* =========================
   SESSION VALIDATION
========================= */

function hasSession() {

  return COOKIE.includes("puter") ||
         COOKIE.length > 20;

}

/* =========================
   /v1/models
========================= */

if (url.includes("/v1/models")) {

  if (!hasSession()) {
    notifyLoginRequired();
  }

  const models = {
    object:"list",
    data:[
      {id:"grok-beta",object:"model",owned_by:"xai"},
      {id:"grok-vision-beta",object:"model",owned_by:"xai"}
    ]
  };

  $done({
    response:{
      status:200,
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify(models)
    }
  });

  return;
}

/* =========================
   CHAT REQUEST
========================= */

if (url.includes("/v1/chat/completions")) {

  if (!hasSession()) {

    notifyLoginRequired();

    $done({
      response:{
        status:401,
        body:JSON.stringify({
          error:{
            message:"Not logged into Puter"
          }
        })
      }
    });

    return;
  }

  let newHeaders = Object.assign({}, headers);

  delete newHeaders.Authorization;

  newHeaders["Content-Type"] =
    "application/json";

  $done({
    url:"https://api.puter.com/v2/chat/completions",
    method:"POST",
    headers:newHeaders,
    body:$request.body
  });

  return;
}

$done({});

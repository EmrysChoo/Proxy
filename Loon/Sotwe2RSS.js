/**
 * sotwe2rss.js
 * Convert Sotwe user page → RSS feed
 */

let url = $request.url;
let username = url.match(/sotwe\.com\/([^\/\?]+)/)?.[1];

if (!username) {
  $done({ body: "Invalid Sotwe URL." });
}

let api = `https://www.sotwe.com/${username}`;

$httpClient.get(api, (err, resp, data) => {
  if (err || resp.status !== 200) {
    $done({ body: "Failed to fetch Sotwe page." });
    return;
  }

  // ---- Extract tweets from HTML ----

  // Tweet blocks usually in JSON inside <script> tag or rendered HTML
  let tweetMatches = [...data.matchAll(/"full_text":"(.*?)"/g)];
  let tweets = tweetMatches.map(m => decodeURIComponent(m[1].replace(/\\n/g, "<br>")));

  // Profile name
  let name = data.match(/<title>(.*?)<\/title>/)?.[1] || username;

  // ---- Build RSS ----
  let items = tweets.map(t => `
    <item>
      <title>${escape(t.slice(0, 30))}</title>
      <description><![CDATA[${t}]]></description>
      <guid>${Math.random()}</guid>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
  `).join("\n");

  let rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${name}</title>
    <link>${api}</link>
    <description>Sotwe RSS feed for ${username}</description>
    ${items}
  </channel>
</rss>`;

  $done({ body: rss, headers: { "Content-Type": "application/xml" } });
});

/**
 * Escape XML chars
 */
function escape(str) {
  return str.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
}

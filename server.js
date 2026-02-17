const express = require("express");
const https = require("https");
const http = require("http");
const { URL } = require("url");

const app = express();

app.get("/", (req, res) => {
  res.send("Video Downloader Server Running");
});

app.get("/download", (req, res) => {
  const fileUrl = req.query.url;
  if (!fileUrl) return res.status(400).send("Missing url");

  const MAX_REDIRECTS = 8;

  function fetchUrl(url, redirectsLeft) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).send("Bad url");
    }

    const client = parsed.protocol === "https:" ? https : http;

    const request = client.get(url, (r) => {
      // Handle redirects
      if (
        (r.statusCode === 301 ||
          r.statusCode === 302 ||
          r.statusCode === 303 ||
          r.statusCode === 307 ||
          r.statusCode === 308) &&
        r.headers.location
      ) {
        if (redirectsLeft <= 0) {
          return res.status(500).send("Too many redirects");
        }
        const nextUrl = new URL(r.headers.location, parsed).toString();
        return fetchUrl(nextUrl, redirectsLeft - 1);
      }

      // Errors
      if (r.statusCode && r.statusCode >= 400) {
        return res.status(500).send("Download error: " + r.statusCode);
      }

      // Filename (best effort)
      const fallbackName = parsed.pathname.split("/").pop() || "file.bin";

      // If server sends content-disposition, keep it; otherwise set ours
      if (!r.headers["content-disposition"]) {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${fallbackName}"`
        );
      }

      // Pass through content type/length when available
      if (r.headers["content-type"]) res.setHeader("Content-Type", r.headers["content-type"]);
      if (r.headers["content-length"]) res.setHeader("Content-Length", r.headers["content-length"]);

      r.pipe(res);
    });

    request.on("error", (e) => {
      res.status(500).send("Download error");
    });
  }

  fetchUrl(fileUrl, MAX_REDIRECTS);
});

// IMPORTANT for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

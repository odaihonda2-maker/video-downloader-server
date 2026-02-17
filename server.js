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

  if (!fileUrl) {
    return res.status(400).send("Missing url");
  }

  try {

    const parsedUrl = new URL(fileUrl);

    const client = parsedUrl.protocol === "https:" ? https : http;

    const filename = parsedUrl.pathname.split("/").pop();

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    client.get(fileUrl, (response) => {

      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        return res.redirect(`/download?url=${response.headers.location}`);
      }

      response.pipe(res);

    });

  } catch (err) {

    res.status(500).send("Download error");

  }

});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});

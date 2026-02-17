const express = require("express");
const ytdl = require("ytdl-core");

const app = express();

app.get("/", (req, res) => {
  res.send("Video Downloader Server Running");
});

app.get("/download", async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).send("Missing URL");
  }

  try {
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi, '');

    res.header(
      "Content-Disposition",
      `attachment; filename="${title}.mp4"`
    );

    ytdl(url, {
      format: "mp4",
      quality: "highest"
    }).pipe(res);

  } catch (error) {
    console.log(error);
    res.status(500).send("Error downloading video");
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

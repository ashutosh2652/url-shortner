import { createServer } from "http";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";
const DATA_FILE = path.join("data", "links.json");
const servefile = async (res, filepath, contenttype) => {
  try {
    const data = await readFile(filepath);
    res.writeHead(200, { "Content-Type": contenttype });
    res.end(data);
  } catch (error) {
    console.log(error);
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 page not found");
  }
};
const loadlink = async () => {
  try {
    const data = await readFile(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(DATA_FILE, JSON.stringify({}));
      return {};
    }
    throw error;
  }
};
const savelinks = async (links) => {
  await writeFile(DATA_FILE, JSON.stringify(links));
};
const server = createServer(async (req, res) => {
  if (req.method === "GET") {
    if (req.url === "/") {
      return servefile(res, path.join("public", "index.html"), "text/html");
    } else if (req.url === "/style.css") {
      return servefile(res, path.join("public", "style.css"), "text/css");
    }
  }
  if (req.method === "POST" && req.url === "/shorten") {
    const links = await loadlink();
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const { url, shortCode } = JSON.parse(body);
        if (!url) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          return res.end("URL is required!");
        }
        const finalshortcode =
          shortCode || crypto.randomBytes(4).toString("hex");
        if (links[finalshortcode]) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          return res.end("Short Code Already exist. Please choose other.");
        }
        links[finalshortcode] = url;
        await savelinks(links);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, shortCode: finalshortcode }));
      } catch (error) {
        res.writeHead(404, { "Content-type": "text/plain" });
        res.end("Invalid JSON data or missing data.");
      }
    });
  }
});
const PORT = 3002;
server.listen(PORT, () => {
  console.log(`Server is listening to port ${PORT}`);
});

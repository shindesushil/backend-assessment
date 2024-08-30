const sharp = require("sharp");
const axios = require("axios");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const { client } = require("./db.js");

async function processImages(products, requestId) {
  products.forEach((product) => {
    let urls = product["input_image_urls"].split(",");

    let outputUrls = [];

    urls.forEach(async (url) => {
      let compressedPath = await compressImage(url);
      if (compressedPath) {
        outputUrls.push(compressedPath);
        let query =
          "UPDATE compression_progress SET processed_images = processed_images + 1 WHERE request_id = $1";
        await client.query(query, [requestId]);

        query = `
                    UPDATE products 
                    SET output_image_urls = 
                        CASE 
                        WHEN output_image_urls IS NULL OR output_image_urls = '' THEN $1
                        ELSE output_image_urls || ',' || $1 
                        END 
                    WHERE request_id = $2 AND product_name = $3
                `;
        let params = [compressedPath, requestId, product["product_name"]];

        await client.query(query, params);
      }
    });
  });
}

async function compressImage(url) {
  try {
    const imageBuffer = await downloadImage(url);
    const compressedBuffer = await sharp(imageBuffer)
      .jpeg({ quality: 50 })
      .toBuffer();
    const compressedPath = `compressed/${uuidv4()}.jpg`;

    fs.writeFileSync(compressedPath, compressedBuffer);
    return compressedPath;
  } catch (error) {
    console.error("Error processing image:", error);
  }
  return false;
}

async function downloadImage(url) {
  const response = await axios.get(url, { responseType: "arraybuffer" });
  return Buffer.from(response.data, "binary");
}

module.exports = { processImages };

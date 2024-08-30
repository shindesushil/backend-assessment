require("dotenv").config();

const express = require("express");

const axios = require("axios");
const { client } = require("./db.js");
const { processImages } = require("./controller");

const app = express();

app.post("/compress/:requestId", async (req, res) => {
  const { requestId } = req.params;

  try {
    let query =
      "SELECT product_name, input_image_urls FROM products WHERE request_id = $1";
    let params = [requestId];

    const result = await client.query(query, params);

    let products = result.rows;

    processImages(products, requestId).then(async () => {
      console.log("trigger webhook");
      await triggerWebhook(requestId);
    });
  } catch (ex) {
    console.error("Error: while compressing images: ", ex);
  }

  res.json({ status: "testing" });
});

async function triggerWebhook(requestId) {
  await axios.post(process.env.IMG_UPLOAD_SERVICE + "/webhook", { requestId });
}

app.listen(4000, () => console.log("Server running on port 4000"));

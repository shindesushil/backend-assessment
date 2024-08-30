require("dotenv").config();
const express = require("express");
const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const axios = require("axios");
const { getProgress, addProduct } = require("./controller");

const { client } = require("./db");

const app = express();
app.use(express.json());

const upload = multer({ dest: "uploads/" });

// Endpoint: Upload CSV File
app.post("/upload", upload.single("file"), (req, res) => {
  const requestId = uuidv4();
  const filePath = req.file.path;
  const products = [];

  let totalImages = 0;

  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", (row) => {
      if (
        !row["Serial Number"] ||
        !row["Product Name"] ||
        !row["Input Image Urls"]
      ) {
        return res.status(400).send("Invalid CSV format");
      }

      totalImages += row["Input Image Urls"].split(",").length;

      products.push({
        serialNumber: row["Serial Number"],
        productName: row["Product Name"],
        inputImageUrls: row["Input Image Urls"].split(","),
        requestId,
      });
    })
    .on("end", async () => {
      try {
        for (const product of products) {
          await addProduct(product);
        }

        await client.query(
          "INSERT INTO compression_progress (request_id, total_images) VALUES ($1, $2)",
          [requestId, totalImages]
        );

        axios.post(
          process.env.IMG_PROCESSING_SERVICE + "/compress/" + requestId
        );

        res.json({ requestId });
      } catch (error) {
        console.log("Error: processing CSV file: ", error.message);

        res.status(500).send("Error processing CSV file");
      }
    });
});

// Endpoint: Check Processing Status
app.get("/status/:requestId", async (req, res) => {
  const { requestId } = req.params;

  if (!requestId) {
    return res.status(400).send("requestId required");
  }

  let progress = await getProgress(requestId);

  if (progress) {
    res.json({ status: progress + "%" });
  } else {
    return res.status(400).send("Something went wrong");
  }
});

// Webhook endpoint
app.post("/webhook", async (req, res) => {
  console.log("Got Webhook: ", req.body);
  res.status(200);
});

app.listen(3000, () => console.log("Server running on port 3000"));

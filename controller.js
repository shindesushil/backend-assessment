const { client } = require("./db");

const getProgress = async (requestId) => {
  try {
    let query = "SELECT * FROM compression_progress WHERE request_id = $1";
    const result = await client.query(query, [requestId]);

    if (result.rows.length <= 0) {
      return false;
    }

    let data = result.rows[0];

    let progress = (data["processed_images"] / data["total_images"]) * 100;

    return progress;
  } catch (ex) {
    console.log("Error: " + ex);
    return false;
  }
};

const addProduct = async (product) => {
  try {
    await client.query(
      "INSERT INTO products (serial_number, product_name, input_image_urls, output_image_urls, request_id) VALUES ($1, $2, $3, $4, $5)",
      [
        product.serialNumber,
        product.productName,
        product.inputImageUrls.join(","),
        "",
        product.requestId,
      ]
    );

    return true;
  } catch (ex) {
    console.log("Error: (addProduct) : ", ex);
    return false;
  }
};

module.exports = { getProgress, addProduct };

const { Client } = require("pg");

// PostgreSQL setup
const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: "",
  port: process.env.DB_PORT,
});

async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to PostgreSQL database");
  } catch (err) {
    console.error("Error connecting to the database:", err.stack);
    process.exit(1);
  }
}

connectToDatabase();

module.exports = { client };

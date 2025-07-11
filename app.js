const express = require("express");
const cors = require("cors");
const indexRouter = require("./router");
const app = express();
require("dotenv").config();
const db = require("./lib/connection");

app.use(
  cors({
    origin: process.env.frontend_url || "http://localhost:3001",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
); 
 
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/", indexRouter);
db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Database connected successfully");
  }
});

const PORT = process.env.PORT || 9000;

app.listen(PORT, () => {
  console.log("Express server is runing on server ", PORT);
});

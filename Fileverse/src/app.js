const express = require("express");
const cors = require("cors");
const systemRoutes = require("./routes/systemRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(systemRoutes);
app.use(userRoutes);

module.exports = app;
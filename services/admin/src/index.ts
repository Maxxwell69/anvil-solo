require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const app = express();
const path = require("path");
const appConfig1 = require('./app-config');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors({ origin: "*", methods: ["POST", "GET"] }));

const buildPath = path.join(__dirname, "/public");
app.use("/admin", require("./routes/admin"));
app.use(express.static(buildPath));

// Health check endpoints for Kubernetes
app.get('/health/liveness', (req: any, res: any) => {
  // Simple check to verify the application is running
  res.status(200).json({ status: 'UP' });
});

app.get('/health/readiness', (req: any, res: any) => {
  // Check if MongoDB connection is established
  const isMongoConnected = mongoose.connection.readyState === 1;
  
  if (isMongoConnected) {
    res.status(200).json({ 
      status: 'UP',
      checks: [
        { name: 'mongodb', status: 'UP' }
      ]
    });
  } else {
    res.status(503).json({ 
      status: 'DOWN',
      checks: [
        { name: 'mongodb', status: 'DOWN' }
      ]
    });
  }
});

process.on("uncaughtException", function (err) {
  console.log(err);
});
process.on("uncaughtExceptionMonitor", (err, origin) => {
  console.log(err);
});

app.get("/*", function (req: any, res: any) {
  res.sendFile(path.join(buildPath, "index.html"), function (err: any) {
    if (err) {
      res.status(500).send(err);
    }
  });
});

mongoose.set("strictQuery", true);
mongoose
  .connect(appConfig1.mongodb.url, { useUnifiedTopology: true, useNewUrlParser: true })
  .then(() => {
    app.listen(appConfig1.server.port, () =>
      console.log(`AnvilBot Admin Panel Server running on port ${appConfig1.server.port}`)
    );
  })
  .catch((err: any) => console.log(err));

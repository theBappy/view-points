import express from "express";
import { ENV } from "./libs/env.js";
import path from "path";
import { connectDB } from "./libs/db.js";

const app = express();

const __dirname = path.resolve();

app.get("/health", (req, res) => {
  res.status(200).json({ msg: "API is up and running" });
});
app.get("/books", (req, res) => {
  res.status(200).json({ msg: "This is the books endpoint" });
});

//make ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

const startServer = async () => {
  try {
    await connectDB();
    app.listen(ENV.PORT, () =>
      console.log(`Server is running on port ${ENV.PORT}`)
    );
  } catch (error) {
    console.error("💥 Error starting the server", error);
  }
};

startServer();

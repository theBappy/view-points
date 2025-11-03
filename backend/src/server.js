import path from "path";
import express from "express";
import cors from "cors";
import { serve } from "inngest/express";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./libs/env.js";
import { connectDB } from "./libs/db.js";
import { functions, inngest } from "./libs/inngest.js";
import chatRoutes from "./routes/chat-routes.js"
import sessionRoutes from "./routes/session-routes.js"

const app = express();

const __dirname = path.resolve();

app.use(express.json());
app.use(
  cors({
    origin: ENV.CLIENT_URL,
    credentials: true,
  })
);
app.use(clerkMiddleware()); //this adds auth field to request obj which allows to do: req.auth()

app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/chat", chatRoutes)
app.use("/api/sessions", sessionRoutes)

app.get("/health", (req, res) => {
  res.status(200).json({ msg: "API is up & running!" });
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

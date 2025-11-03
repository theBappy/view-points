import express from "express";

import { getStreamToken } from "../controllers/chat-controllers.js";
import { protectRoute } from "../middlewares/protect-route.js";

const router = express.Router()

router.get("/token", protectRoute, getStreamToken)

export default router
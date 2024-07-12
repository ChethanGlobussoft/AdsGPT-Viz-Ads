// Imports
import express from "express";
import ads from "./ads.routes.js";
import charts from "./charts.routes.js";

// Express router
const router = express.Router();

// Routes
router.use("/ads", ads);
router.use("/chart", charts);

export default router;

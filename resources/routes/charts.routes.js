import express from "express";
import {
  getTopChart,
  getBottomCharts,
} from "../../controllers/charts.controller.js";

const router = express.Router();

router.post("/get-top-chart", getTopChart);
router.post("/get-bottom-charts", getBottomCharts);

export default router;

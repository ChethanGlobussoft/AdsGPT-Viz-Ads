import express from "express";
import { getAds } from "../../controllers/ads.controller.js";

const router = express.Router();

router.post("/get-ads", getAds);

export default router;

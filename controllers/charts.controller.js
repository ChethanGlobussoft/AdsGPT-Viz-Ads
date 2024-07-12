import { bottomChartData, topChartData } from "../utils/elasticsearch.js";
import {
  sendBadRequestResponse,
  sendSuccessResponse,
} from "../utils/responseHandler.js";
import {
  bottomDataPayloadFormat,
  topDataPayloadFormat,
  formattedResponse,
} from "../utils/templates.js";
import {
  mostActiveSeason,
  processAdData,
  topPerformingNetwork,
} from "../utils/topChartHandler.js";
import { nerPayloadValidator } from "../utils/validationHandler.js";
import {
  barChart1DataFormat,
  barChart2DataFormat,
  pieChartDataFormat,
  worldMapDataFormat,
} from "../utils/bottomChartsHandler.js";
import { pub } from "../server.js";
import logger from "../resources/logs/logger.js";

// Top chart controller
export async function getTopChart(req, res, next) {
  try {
    const start = performance.now();
    const nerPayload = req.body;
    logger.info(`Received from ner for top chart - ${JSON.stringify(nerPayload)}`);

    // Validate the payload
    const { error, value } = nerPayloadValidator(nerPayload);
    if (error) {
      logger.error(`Validation error in top chart controller ${error.details}`);
      return sendBadRequestResponse(res, error.details);
    }

    const { uid, chatId, sessionId } = value;

    const payload = {
      network: value?.network,
      postOwner: value?.fuzzy_post_owners,
      category: value?.categories,
      country: value?.country,
    };
    // Network data based on network query
    const esData = await topChartData(payload);
    const totalAds = esData.length;
    const { chartData, currentMonthAds, topPostOwners } = processAdData(esData);
    const activeSeason = mostActiveSeason(chartData);
    const topNetwork = topPerformingNetwork(chartData);

    const data = topDataPayloadFormat(
      uid,
      chatId,
      sessionId,
      totalAds,
      currentMonthAds,
      activeSeason,
      topNetwork,
      topPostOwners,
      chartData
    );

    // Publish the data
    pub.publish(process.env.TOP_CHART, JSON.stringify(data));
    logger.info(
      `Published top chart to channel ${
        process.env.TOP_CHART
      } - ${JSON.stringify(data)}`
    );

    const end2 = performance.now();

    const response = formattedResponse(
      uid,
      chatId,
      sessionId,
      "vizStatusTopStatus",
      true,
      data,
      end2,
      start
    );

    logger.info("Sent top chart data.");
    return sendSuccessResponse(res, response);
  } catch (error) {
    logger.error(`${error.stack}`);
    return sendBadRequestResponse(res, error);
  }
}

// Bottom chrt controller
export async function getBottomCharts(req, res, next) {
  try {
    const start = performance.now();
    let nerPayload = req.body;
    logger.info(`Received from ner for bottom charts - ${JSON.stringify(nerPayload)}`);

    // Validate the payload
    const { error, value } = nerPayloadValidator(nerPayload);
    if (error) {
      logger.error(`Valodation error in top chart controller ${error.details}`);
      return sendBadRequestResponse(res, error.details);
    }
    const { uid, chatId, sessionId } = value;

    const payload = {
      network: value?.network,
      postOwner: value?.fuzzy_post_owners,
      category: value?.categories,
      country: value?.country,
    };

    const esData = await bottomChartData(payload);
    const pieChartData = pieChartDataFormat(esData?.type);
    const barChart1Data = barChart1DataFormat(esData?.owner);
    const barChart2Data = barChart2DataFormat(esData?.cta);
    const worldMapData = worldMapDataFormat(esData?.country);

    const data = bottomDataPayloadFormat(
      uid,
      chatId,
      sessionId,
      pieChartData,
      barChart1Data,
      barChart2Data,
      worldMapData
    );

    pub.publish(process.env.BOTTOM_CHART, JSON.stringify(data));
    logger.info(
      `Published top chart to channel ${
        process.env.BOTTOM_CHART
      } - ${JSON.stringify(data)}`
    );

    const end = performance.now();

    const response = formattedResponse(
      uid,
      chatId,
      sessionId,
      "vizStatusBottomStatus",
      true,
      data,
      end,
      start
    );

    logger.info("Sent bottom charts data.");
    return sendSuccessResponse(res, response);
  } catch (error) {
    logger.error(`${error.stack}`);
    return sendBadRequestResponse(res, error);
  }
}

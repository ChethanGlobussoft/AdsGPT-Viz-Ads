import logger from "../resources/logs/logger.js";
import { pub } from "../server.js";
import { searchAds, searchAds2 } from "../utils/elasticsearch.js";
import {
  sendSuccessResponse,
  sendBadRequestResponse,
} from "../utils/responseHandler.js";
import { adsDataPayloadFormat, formattedResponse } from "../utils/templates.js";

import { nerPayloadValidator } from "../utils/validationHandler.js";

export async function getAds(req, res, next) {
  try {
    const start = performance.now();
    const nerPayload = req.body;
    logger.info(`Received from ner for initial ads - ${JSON.stringify(nerPayload)}`);

    // Validate the payload
    const { error, value } = nerPayloadValidator(nerPayload);
    if (error) {
      logger.error(`Validation error in ads controller ${error.details}`);
      return sendBadRequestResponse(res, error.details);
    }

    const { uid, chatId, sessionId } = value;
    const payload = {
      postOwner: value?.fuzzy_post_owners,
      category: value?.categories,
      network: value?.network,
      country: value?.country,
    };
    
    // Send to elasticsearch function
    let esData = await searchAds2(payload);

    // If no ads found
    if (!esData.length) {
      logger.info("No ads found");
      return sendSuccessResponse(res, esData, "No ads found");
    }
    const data = adsDataPayloadFormat(uid, chatId, sessionId, esData);

    // Publish the data
    pub.publish(process.env.ADS_DATA, JSON.stringify(data));
    logger.info(
      `Published initial ads data to ${
        process.env.ADS_DATA
      } channel - ${JSON.stringify(data)}`
    );
    const end = performance.now();

    const response = formattedResponse(
      uid,
      chatId,
      sessionId,
      "adsStatus",
      true,
      data,
      end,
      start
    );

    logger.info("Sent initial ads data.");
    return sendSuccessResponse(res, response);
  } catch (error) {
    logger.error(error.stack);
    return sendBadRequestResponse(res, error);
  }
}

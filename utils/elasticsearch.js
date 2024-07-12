import { Client } from "@elastic/elasticsearch";
import { config } from "dotenv";
import logger from "../resources/logs/logger.js";
import { processAdsAdata } from "./adsHandler.js";
config();

// Single node client
// const client = new Client({
//   node: process.env.ELASTIC_SEARCH_URL,
// });

// Multi node client
const client = new Client({
  node: process.env.ELASTIC_SEARCH_URLS.split(", "),
});
const INDEX_NAME = process.env.INDEX_NAME;

// Elasticsearch function to fetch initial ads
export async function searchAds(payload) {
  const _source = [
    "id",
    "network",
    "postOwner",
    "postOwnerImage",
    "mediaUrl",
    "newsfeedDescription",
    "adUrl",
    "category",
    "network",
    "adTitle",
    "adType",
  ];
  try {
    // Filter query
    let query1 = {
      from: 0,
      size: 20,
      _source,
      query: {
        bool: {
          filter: [],
        },
      },
      sort: [
        {
          _script: {
            type: "number",
            script: {
              lang: "painless",
              source: `def order = params.order; if (order.containsKey(doc['postOwner'].value)) { return order[doc['postOwner'].value]; } else { return order.size(); }`,
              params: {
                order: payload.postOwner.reduce((acc, owner, index) => {
                  acc[owner] = index;
                  return acc;
                }, {}),
              },
            },
            order: "asc",
          },
        },
        { likes: { order: "asc" } },
      ],
    };

    // Add filters dynamically based on nerPayload
    Object.keys(payload).forEach((key) => {
      if (Array.isArray(payload[key]) && payload[key].length > 0) {
        const filterQuery =
          payload[key].length > 1
            ? { terms: { [key]: payload[key] } }
            : { term: { [key]: payload[key][0] } };
        query1.query.bool.filter.push(filterQuery);
      }
    });

    // Should query
    let query2 = {
      from: 0,
      size: 20,
      _source,
      query: {
        bool: {
          should: [],
          minimum_should_match: 1,
        },
      },
      sort: [
        {
          _script: {
            type: "number",
            script: {
              lang: "painless",
              source: `def order = params.order; if (order.containsKey(doc['postOwner'].value)) { return order[doc['postOwner'].value]; } else { return order.size(); }`,
              params: {
                order: payload.postOwner.reduce((acc, owner, index) => {
                  acc[owner] = index;
                  return acc;
                }, {}),
              },
            },
            order: "asc",
          },
        },
        { likes: { order: "asc" } },
      ],
    };

    // Add should conditions dynamically based on payload
    if (payload.postOwner) {
      let postOwnerShouldQueries = [];
      payload.postOwner.forEach((owner) => {
        postOwnerShouldQueries.push({ wildcard: { postOwner: `*${owner}*` } });
      });
      query2.query.bool.should.push(...postOwnerShouldQueries);
    }

    if (payload.category) {
      query2.query.bool.should.push({
        terms: { category: payload.category },
      });
    }

    if (payload.network) {
      query2.query.bool.should.push({
        terms: { network: payload.network },
      });
    }

    // Make a search
    const body = await client.msearch({
      body: [
        { index: process.env.INDEX_NAME },
        { ...query1 },
        { index: process.env.INDEX_NAME },
        { ...query2 },
      ],
    });

    let esData = [];

    // Combine results from both queries
    if (body.responses && body.responses.length === 2) {
      const response1 = body.responses[0];
      const response2 = body.responses[1];
      const totalResults =
        response1.hits.total.value + response2.hits.total.value;

      if (totalResults > 0) {
        // Determine how many results to take from each response
        const takeFromResponse1 = Math.min(response1.hits.hits.length, 20);
        const takeFromResponse2 = Math.min(
          20 - takeFromResponse1,
          response2.hits.hits.length
        );

        // Combine results
        esData = [
          ...response1.hits.hits.slice(0, takeFromResponse1),
          ...response2.hits.hits.slice(0, takeFromResponse2),
        ];
      }
    }

    // Convert to required format
    const results = esData.map((hit) => {
      let data = {
        id: hit?._source?.id || "",
        network: hit?._source?.network || "",
        postOwner: hit?._source?.postOwner || "",
        postOwnerImage:
          hit?._source?.postOwnerImage &&
          hit?._source?.postOwnerImage?.startsWith("pasimages")
            ? `https://contents.poweradspy.com/${hit?._source?.postOwnerImage}`
            : "",
        postImage:
          hit?._source?.mediaUrl &&
          (hit?._source?.mediaUrl?.startsWith("pasimages") ||
            hit?._source?.mediaUrl?.startsWith("pasvideos"))
            ? `https://contents.poweradspy.com/${hit?._source?.mediaUrl}`
            : hit?._source?.mediaUrl &&
              hit?._source?.mediaUrl?.startsWith("https")
            ? hit?._source?.mediaUrl
            : "",
        description: hit?._source?.newsfeedDescription || "",
        adUrl: hit?._source?.adUrl || "",
        category: hit?._source?.category || "",
        network: hit?._source?.network || "",
        adTitle: hit?._source?.adTitle || "",
        adType: hit?._source?.adType?.toUpperCase() || "",
        open_in_pas:
          `https://app-dev.poweradspy.com/${hit._source?.network}/getAdDetails/${hit._source?.id}` ||
          "",
      };
      return data;
    });
    // logger.info(
    //   `Got from elastic search for initial ads - ${JSON.stringify(results)}`
    // );
    return results;
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
}

// Elasticsearch function to fetch ads and generate top chart data
export const topChartData = async (payload) => {
  try {
    // Initialize empty query
    let query = { bool: { filter: [] } };

    // Create dynamic query
    Object.keys(payload).forEach((key) => {
      if (Array.isArray(payload[key]) && payload[key].length > 0) {
        const filterQuery =
          payload[key].length > 1
            ? { terms: { [key]: payload[key] } }
            : { term: { [key]: payload[key][0] } };
        query.bool.filter.push(filterQuery);
      }
    });

    // Modify the query to match_all if  the above query is empty
    if (query.bool.filter.length === 0) query = { match_all: {} };
    const INDEX_NAME = process.env.INDEX_NAME;

    // Make a search
    let response = await client.search({
      index: INDEX_NAME,
      body: {
        query,
        _source: ["postOwner", "network", "lastSeen", "category"],
      },
      scroll: "1m",
      size: 5000,
    });

    // Scroll through whole elastic search
    const sid = response._scroll_id;
    let hits = response.hits.hits;
    let data = hits.map((hit) => hit._source);

    while (hits.length) {
      response = await client.scroll({
        scroll_id: sid,
        scroll: "1m",
      });

      hits = response.hits.hits;
      data = data.concat(hits.map((hit) => hit._source));
    }

    return data;
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
};

// Elasticsearch function to fetch ads to generate top chart
export const bottomChartData = async (payload) => {
  // Initialize empty query
  let query = {
    bool: {
      filter: [],
    },
  };

  // Aggregation
  const aggs = {
    type: {
      terms: {
        field: "type",
        size: 7,
      },
    },
    country: {
      terms: {
        field: "country",
        size: 12,
      },
    },
    cta: {
      terms: {
        field: "callToAction",
        size: 10,
      },
    },
    owner: {
      terms: {
        field: "postOwner",
        size: 10,
      },
    },
  };

  // Create dynamic query
  Object.keys(payload).forEach((key) => {
    if (Array.isArray(payload[key]) && payload[key].length > 0) {
      const filterQuery =
        payload[key].length > 1
          ? { terms: { [key]: payload[key] } }
          : { term: { [key]: payload[key][0] } };
      query.bool.filter.push(filterQuery);
    }
  });

  // Modify the query to match_all if  the above query is empty
  if (query.bool.filter.length === 0) query = { match_all: {} };

  try {
    // Make a search
    const response = await client.search({
      index: INDEX_NAME,
      body: {
        query,
        aggs,
      },
    });

    return response.aggregations;
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
};

export async function searchAds2(payload, limit = 30) {
  // Initialize empty query
  let query = { bool: { filter: [] } };

  // Create dynamic query
  Object.keys(payload).forEach((key) => {
    if (Array.isArray(payload[key]) && payload[key].length > 0) {
      const filterQuery =
        payload[key].length > 1
          ? { terms: { [key]: payload[key] } }
          : { term: { [key]: payload[key][0] } };
      query.bool.filter.push(filterQuery);
    }
  });

  // Modify the query to match_all if the above query is empty
  if (query.bool.filter.length === 0) query = { match_all: {} };
  try {
    let response = await client.search({
      index: INDEX_NAME,
      body: {
        query,
        _source: [
          "id",
          "network",
          "postOwner",
          "postOwnerImage",
          "mediaUrl",
          "newsfeedDescription",
          "adUrl",
          "category",
          "network",
          "adTitle",
          "adType",
        ],
      },
      scroll: "1m",
      size: limit,
    });

    let sid = response._scroll_id;
    let hits = response.hits.hits;
    let data = hits.map((hit) => hit._source);
    let totalHitsProcessed = hits.length;

    while (hits.length && totalHitsProcessed < limit) {
      response = await client.scroll({
        scroll_id: sid,
        scroll: "1m",
      });

      hits = response.hits.hits;
      data = data.concat(hits.map((hit) => hit._source));
      totalHitsProcessed += hits.length;

      // Stop scrolling if we've reached the limit
      if (totalHitsProcessed >= limit) {
        data = data.slice(0, limit); // Ensure we only have up to the limit
        break;
      }
    }

    // Clear the scroll context
    await client.clearScroll({
      scroll_id: sid,
    });
    if (data.length < limit) {
      let categoryData = await reSearch(payload?.category, limit - data.length);
      if (categoryData) data.push(...categoryData);
    }
    let esData = data || [];
    return processAdsAdata(esData);
  } catch (error) {
    logger.error(error.stack);
    throw error;
  }
}

async function reSearch(payload, limit = 30) {
  let query = { bool: { filter: [] } };
  if (Array.isArray(payload) && payload.length > 0) {
    const filterQuery =
      payload.length > 1
        ? { terms: { category: payload } }
        : { term: { category: payload[0] } };
    query.bool.filter.push(filterQuery);
  }
  try {
    let response = await client.search({
      index: INDEX_NAME,
      body: {
        query,
        _source: [
          "id",
          "network",
          "postOwner",
          "postOwnerImage",
          "mediaUrl",
          "newsfeedDescription",
          "adUrl",
          "category",
          "network",
          "adTitle",
          "adType",
        ],
      },
      scroll: "1m",
      size: limit,
    });

    let sid = response._scroll_id;
    let hits = response.hits.hits;
    let data = hits.map((hit) => hit._source);
    let totalHitsProcessed = hits.length;

    while (hits.length && totalHitsProcessed < limit) {
      response = await client.scroll({
        scroll_id: sid,
        scroll: "1m",
      });

      hits = response.hits.hits;
      data = data.concat(hits.map((hit) => hit._source));
      totalHitsProcessed += hits.length;

      // Stop scrolling if we've reached the limit
      if (totalHitsProcessed >= limit) {
        data = data.slice(0, limit); // Ensure we only have up to the limit
        break;
      }
    }

    // Clear the scroll context
    await client.clearScroll({
      scroll_id: sid,
    });
    return data.length > 0 ? data : null;
  } catch (error) {
    throw new Error(error);
  }
}

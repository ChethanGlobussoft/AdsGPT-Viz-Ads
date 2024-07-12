import { getCurrentMonth } from "./topChartHandler.js";

// Top chart format
export const topDataPayloadFormat = (
  uid,
  chatId,
  sessionId,
  totalAds,
  currentMonthAds,
  activeSeason,
  topNetwork,
  topAdvertisers,
  chartData = []
) => {
  return {
    uid,
    chatId,
    sessionId,
    position: "T1",
    title: "Overall advertisement market analysis",
    cards: {
      card1: { caption: "Total number of ads", value: totalAds },
      card2: {
        caption: `Total ads in the month of ${getCurrentMonth()}`,
        value: currentMonthAds,
      },
      card3: { caption: "Most active season", value: activeSeason },
      card4: { caption: "Top performing network", value: topNetwork },
      card5: { caption: "Top advertisers", value: topAdvertisers },
    },
    analyticsChart: {
      chartType: "",
      chartData,
      chartDescription: "",
    },
  };
};

// Ads data format
export function adsDataPayloadFormat(uid, chatId, sessionId, data) {
  return {
    uid,
    chatId,
    sessionId,
    adsData: data || [],
  };
}

// Bottom charts format
export function bottomDataPayloadFormat(
  uid,
  chatId,
  sessionId,
  pieChartData,
  barChart1Data,
  barChart2Data,
  worldMapData
) {
  let data = [];
  pieStructure.chartData = pieChartData;
  barChart1Structure.chartData = barChart1Data;
  barChart2Structure.chartData = barChart2Data;
  worldmapStructure.chartData = worldMapData;

  if (pieStructure.chartData && pieStructure.chartData.length > 0)
    data.push(pieStructure);
  if (barChart1Structure.chartData && barChart1Structure.chartData.length > 0)
    data.push(barChart1Structure);
  if (barChart2Structure.chartData && barChart2Structure.chartData.length > 0)
    data.push(barChart2Structure);
  if (worldmapStructure.chartData && worldmapStructure.chartData.length > 0)
    data.push(worldmapStructure);

  return {
    uid,
    chatId,
    sessionId,
    position: "B1",
    analyticsChart: data,
  };
}

const pieStructure = {
  title: "Comparison of Engagement for Different Ad Formats",
  chartType: "pieChart",
  chartData: [],
  chartDescription: "",
};

const barChart1Structure = {
  title: "Post Owner Ads Count Based On Network And Category",
  chartType: "barChart1",
  chartData: [],
  chartDescription: "",
};
const barChart2Structure = {
  title:
    "Call To Action Distribution Based on Category, Post Owner and Network",
  chartType: "barChart2",
  chartData: [],
  chartDescription: "",
};
const worldmapStructure = {
  title: "Country wise distribution",
  chartType: "worldMap",
  chartData: [],
  chartDescription: "",
};

// Response format
export const formattedResponse = (
  uid,
  chatId,
  sessionId,
  statusName,
  status,
  data,
  end,
  start
) => {
  return [
    {
      uid,
      chatId,
      sessionId,
      [statusName]: status,
      timestamp: formatDateTime(),
    },
    data,
    { time_taken_in_secs: (end - start) / 1000 },
  ];
};

function formatDateTime() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

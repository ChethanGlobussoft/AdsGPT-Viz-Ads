import { titleCase } from "title-case";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Get current month
export function getCurrentMonth() {
  const date = new Date();
  const monthIndex = date.getMonth();
  return monthNames[monthIndex];
}

// Get most active season (Jan-Mar, Apr-Jun, Jul-Sep, Oct-Dec)
// export function mostActiveSeason(data) {
//   const seasons = ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"];
//   const seasonSums = [0, 0, 0, 0];

//   data.forEach((platform) => {
//     for (let i = 0; i < platform.data.length; i += 3) {
//       const seasonIndex = i / 3;
//       const seasonSum = platform.data
//         .slice(i, i + 3)
//         .reduce((sum, ads) => sum + ads, 0);
//       seasonSums[seasonIndex] += seasonSum;
//     }
//   });

//   const maxSumIndex = seasonSums.indexOf(Math.max(...seasonSums));
//   return seasons[maxSumIndex];
// }
export function mostActiveSeason(data) {
  const months = [
    "Jan-Feb-Mar",
    "Feb-Mar-Apr",
    "Mar-Apr-May",
    "Apr-May-Jun",
    "May-Jun-Jul",
    "Jun-Jul-Aug",
    "Jul-Aug-Sep",
    "Aug-Sep-Oct",
    "Sep-Oct-Nov",
    "Oct-Nov-Dec",
    "Nov-Dec-Jan",
    "Dec-Jan-Feb",
  ];
  const monthSums = Array(12).fill(0);

  data.forEach((platform) => {
    const extendedData = [...platform.data, ...platform.data.slice(0, 2)]; // to handle the wrapping of months

    for (let i = 0; i < 12; i++) {
      const monthSum = extendedData
        .slice(i, i + 3)
        .reduce((sum, ads) => sum + ads, 0);
      monthSums[i] += monthSum;
    }
  });

  const maxSumIndex = monthSums.indexOf(Math.max(...monthSums));

  let monthsArr = months[maxSumIndex].split("-");
  const index = monthsArr.indexOf(monthsArr[1]);

  if (index > -1) {
    monthsArr.splice(index, 1);
  }

  return monthsArr.join(" - ");
}

// Get top performing network
export function topPerformingNetwork(networkPayload) {
  let topNetwork = null;
  let maxSum = 0;

  networkPayload.forEach((network) => {
    const sum = network.data.reduce((acc, value) => acc + value, 0);

    if (sum > maxSum) {
      maxSum = sum;
      topNetwork = network;
    }
  });
  return topNetwork?.name;
}

// Process ads data to get chartData, currentMonthAds, topPostOwners,
export function processAdData(adPayloads) {
  const networkData = {};
  const postOwnerCounts = {};
  let currentMonthAds = 0;

  const now = new Date();
  const currentMonth = now.getMonth();

  adPayloads.forEach((ad) => {
    const network = ad.network;
    const lastSeenDate = new Date(ad.lastSeen);
    const month = lastSeenDate.getMonth();
    const postOwner = ad.postOwner;

    // Increment the count for the respective month
    if (!networkData[network]) {
      networkData[network] = Array(12).fill(0);
    }
    networkData[network][month]++;

    // Count current month ads
    if (month === currentMonth) {
      currentMonthAds++;
    }

    // Count post owners
    if (!postOwnerCounts[postOwner]) {
      postOwnerCounts[postOwner] = 0;
    }
    postOwnerCounts[postOwner]++;
  });

  // Convert network data to the desired output format
  const chartData = Object.keys(networkData).map((network) => ({
    name: network.charAt(0).toUpperCase() + network.slice(1),
    data: networkData[network],
  }));

  // Get top 3 post owners
  const sortedPostOwners = Object.entries(postOwnerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const topPostOwners = sortedPostOwners.map(([postOwner]) =>
    titleCase(postOwner)
  );

  return {
    chartData,
    currentMonthAds,
    topPostOwners: topPostOwners.join(", "),
  };
}

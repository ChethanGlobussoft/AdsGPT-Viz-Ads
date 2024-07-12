import { titleCase } from "title-case";
import { getCountryCode } from "countries-list";

// Pie chart
export function pieChartDataFormat(dataFromES) {
  if (!dataFromES) return undefined;
  
  return dataFromES.buckets.map(({ key, doc_count }) => {
    return {
      category: titleCase(key),
      value: doc_count,
    };
  });
}

// Barchart 1
export function barChart1DataFormat(dataFromES) {
  if (!dataFromES) return undefined;

  let data = dataFromES.buckets.map(({ key, doc_count }) => {
    return {
      name: titleCase(key),
      steps: doc_count,
      pictureSettings: {
        src: "",
      },
    };
  });
  data.sort((a, b) => b.steps - a.steps);
  return data.slice(0, 10);
}

// Barchart2
export function barChart2DataFormat(dataFromES) {
  if (!dataFromES) return undefined;

  let data = dataFromES.buckets.map(({ key, doc_count }) => {
    return {
      country: key,
      value: doc_count,
    };
  });
  data.sort((a, b) => b.value - a.value);
  return data.slice(0, 10);
}

// Worldmap
export function worldMapDataFormat(dataFromES) {
  if (!dataFromES) return undefined;

  let data = dataFromES.buckets.map(({ key, doc_count }) => {
    return {
      id: getCountryCode(key),
      name: titleCase(key),
      value: doc_count,
    };
  });
  data.sort((a, b) => b.value - a.value);
  return data.slice(0, 12);
}

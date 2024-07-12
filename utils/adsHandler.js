import { titleCase } from "title-case";

export function processAdsAdata(esData) {
  const results = esData.map((ad) => {
    let data = {
      id: ad?.id || "",
      network: ad?.network || "",
      postOwner: ad?.postOwner || "",
      postOwnerImage:
        ad?.postOwnerImage && ad?.postOwnerImage?.startsWith("pasimages")
          ? `https://${
              ad?.network?.toLowerCase() === "facebook" ? "media" : "contents"
            }.poweradspy.com/${ad?.postOwnerImage}`
          : "",
      postImage:
        ad?.mediaUrl &&
        (ad?.mediaUrl?.startsWith("pasimages") ||
          ad?.mediaUrl?.startsWith("pasvideos"))
          ? `https://${
              ad?.network?.toLowerCase() === "facebook" ? "media" : "contents"
            }.poweradspy.com/${ad?.mediaUrl}`
          : ad?.mediaUrl && ad?.mediaUrl?.startsWith("https")
          ? ad?.mediaUrl
          : "",
      description: ad?.adText || "",
      newsfeedDescription: ad?.newsfeedDescription || "",
      adUrl: ad?.adUrl || "",
      category: ad?.category || "",
      network: ad?.network ? titleCase(ad?.network) : "",
      adTitle: ad?.adTitle || "",
      adType: ad?.adType?.toUpperCase() || "",
      open_in_pas:
        `https://app-dev.poweradspy.com/${ad?.network}/getAdDetails/${ad?.id}` ||
        "",
    };
    return data;
  });
  return results;
}

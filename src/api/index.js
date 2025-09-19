import axios from "@/utils/request";
import fetchJsonp from "fetch-jsonp";

/**
 * 获取天气
 * https://lbs.amap.com/api/webservice/guide/api/weatherinfo
 */
// 获取高德地理位置信息
export const getAdcode = async (key) => {
  return axios({
    method: "GET",
    url: "https://restapi.amap.com/v3/ip",
    params: { key },
  });
};

// 获取高德地理天气信息
export const getWeather = async (key, city) => {
  return axios({
    method: "GET",
    url: "https://restapi.amap.com/v3/weather/weatherInfo",
    params: { key, city, extensions: "base" },
  });
};

/**
 * 获取搜索建议
 * https://suggestion.baidu.com
 * @param {String} keyWord - 搜索关键字
 */
export const getSearchSuggestions = async (keyWord) => {
  try {
    const encodedKeyword = encodeURIComponent(keyWord);
    const response = await fetchJsonp(
      `https://suggestion.baidu.com/su?wd=${encodedKeyword}`,
      {
        // 回调参数名，让fetch-jsonp自动生成
        jsonpCallback: "cb",
        // 增加超时时间
        timeout: 5000,
      },
    );
    const data = await response.json();
    // 确保返回数组，避免null迭代错误
    return Array.isArray(data.s) ? data.s : [];
  } catch (error) {
    console.error("处理搜索建议发生错误：", error);
    // 返回空数组而不是null，避免迭代错误
    return [];
  }
};

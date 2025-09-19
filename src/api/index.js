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
    
    // 检测当前环境是否为HTTPS，如果是则使用HTTPS API
    const isHttps = window.location.protocol === 'https:';
    const apiUrl = isHttps 
      ? `https://suggestion.baidu.com/su?wd=${encodedKeyword}&cb=json`
      : `http://suggestion.baidu.com/su?wd=${encodedKeyword}&cb=json`;
    
    const response = await fetchJsonp(apiUrl, {
      // 指定回调函数名为json，与百度API期望的一致
      jsonpCallback: "cb",
      jsonpCallbackFunction: "json",
      // 增加超时时间
      timeout: 5000,
    });
    
    const data = await response.json();
    // 确保返回数组，避免null迭代错误
    return Array.isArray(data?.s) ? data.s : [];
  } catch (error) {
    console.error("处理搜索建议发生错误：", error);
    
    // 如果HTTPS请求失败，尝试使用备用方案
    if (window.location.protocol === 'https:') {
      console.warn("HTTPS环境下搜索建议请求失败，可能是由于混合内容限制");
      try {
        // 尝试使用其他搜索引擎的HTTPS API作为备用
        const fallbackResponse = await fetchJsonp(
          `https://sug.so.360.cn/suggest?encodein=utf-8&encodeout=utf-8&format=json&word=${encodedKeyword}&callback=json`,
          {
            jsonpCallback: "callback",
            jsonpCallbackFunction: "json",
            timeout: 3000,
          }
        );
        const fallbackData = await fallbackResponse.json();
        // 360搜索API返回格式不同，需要适配
        if (fallbackData?.result && Array.isArray(fallbackData.result)) {
          return fallbackData.result.map(item => item.word || item);
        }
      } catch (fallbackError) {
        console.error("备用搜索建议API也失败：", fallbackError);
      }
    }
    
    // 返回空数组而不是null，避免迭代错误
    return [];
  }
};

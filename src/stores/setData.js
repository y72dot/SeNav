import { defineStore } from "pinia";
import { sanitizeSetData } from "@/utils/settings/schema";

const useSetDataStore = defineStore("setData", {
  state: () => {
    return {
      // 主题类别
      themeType: "light",
      // 壁纸类别
      // 0 本地 / 1 必应 / 2 随机风景 / 3 随机动漫 / 4 随机风景2 / 5 随机二次元2 / 6 预留 / 7 自定义
      backgroundType: 1,
      backgroundCustom: "",
      // 壁纸遮罩
      showBackgroundGray: true,
      // 壁纸模糊
      backgroundBlur: 0,
      // 搜索引擎
      searchEngine: "bing",
      lastSearchEngine: "bing",
      customEngineUrl: "",
      // 搜索框收起
      smallInput: false,
      // 清空搜索框
      showCleanInput: true,
      // 搜索框自动 focus
      autoFocus: false,
      // 搜索后搜索框自动失焦
      autoInputBlur: true,
      // 时间样式
      timeStyle: "one",
      // 显示农历
      showLunar: false,
      // 是否显秒
      showSeconds: false,
      // 是否显零
      showZeroTime: true,
      // 12 小时制
      use12HourFormat: false,
      // 天气显示
      showWeather: false,
      // 是否显示搜索建议
      showSuggestions: true,
      // 是否显示搜索建议（搜索联想）
      showSearchSuggestions: true,
      // 子开关：命令建议
      showCommandSuggestions: true,
      // 子开关：iframe 网页浮窗提示
      showIframeSuggestions: true,
      // 子开关：快捷翻译
      showQuickTranslate: true,
      // 子开关：直接访问
      showDirectAccess: true,
      // 是否显示捷径建议（来自站点捷径数据的优先选项）
      showShortcutSuggestions: true,
      // 跳转方式
      // open 新标签页 / href 当前页面
      urlJumpType: "open",
    };
  },
  actions: {
    setSearchEngine(value, custom = false) {
      // 储存上次
      if (this.searchEngine !== "custom") {
        this.lastSearchEngine = this.searchEngine;
      }
      // 设置新引擎
      if (custom) {
        this.customEngineUrl = value;
        this.searchEngine = "custom";
        return;
      }
      this.searchEngine = value;
    },
    // 恢复数据（带校验与清洗）
    recoverSiteData(data) {
      let isSuccess = false;
      try {
        const sanitized = sanitizeSetData(data)
        for (const key in sanitized) {
          if (Object.hasOwnProperty.call(sanitized, key)) {
            this[key] = sanitized[key]
          }
        }
        isSuccess = true;
      } catch (error) {
        console.error("站点数据恢复时处理失败：", error);
        isSuccess = false;
      }
      return isSuccess;
    },
  },
  // 开启数据持久化
  persist: {
    key: "setData",
    storage: window.localStorage,
  },
});

export default useSetDataStore;

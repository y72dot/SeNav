<template>
  <!-- 天气时钟 -->
  <div
    :class="[
      'weather-time',
      status.siteStatus,
      status.mainBoxBig && status.siteStatus !== 'normal' && status.siteStatus !== 'focus'
        ? 'hidden'
        : null,
      set.timeStyle,
    ]"
    ref="weatherRef"
    :style="{ zIndex: timeComponentZIndex, transform: weatherTransform }"
    @click.stop
  >
    <div
      class="time"
      ref="timeRef"
      @click.stop="windowManager.setWindowVisibleByType('setting', true)"
    >
      <span class="hour">{{ timeData.hour ?? "00" }}</span>
      <span class="separator" :key="set.showSeconds">:</span>
      <span class="minute">{{ timeData.minute ?? "00" }}</span>
      <Transition name="fade" mode="out-in">
        <span v-if="set.showSeconds" class="second">
          <span class="separator">:</span>
          <span class="second-num">{{ timeData.second ?? "00" }}</span>
        </span>
      </Transition>
      <template v-if="set.use12HourFormat">
        <span class="amPm">{{ timeData.amPm ?? "am" }}</span>
      </template>
    </div>
    <div v-if="set.showWeather" class="weather">
      <span class="status">{{ weatherData?.condition ?? "N/A" }}</span>
      <span class="temperature">{{ weatherData?.temp ?? "N/A" }} ℃</span>
      <span class="wind">{{ weatherData?.windDir ?? "N/A" }}</span>
      <span v-if="weatherData?.windLevel" class="wind-level"> {{ weatherData.windLevel }} 级 </span>
    </div>
  </div>
  <div class="date-box" :style="{ zIndex: timeComponentZIndex, transform: dateTransform }">
    <div class="date" ref="dateRef">
      <span class="month">{{ timeData.month ?? "0" }}</span>
      <span class="day">{{ timeData.day ?? "0" }}</span>
      <span class="weekday">{{ timeData.weekday ?? "星期八" }}</span>
    </div>
    <div v-if="set.showLunar" class="lunar">
      <span class="year">{{ timeData.lunar?.GanZhiYear }}</span>
      <span class="text">{{ timeData.lunar?.text }}</span>
    </div>
  </div>
</template>

<script setup>
import { getCurrentTime } from "@/utils/timeTools";
import { ref, onMounted, onBeforeUnmount, watch, computed } from "vue";
import { statusStore, setStore } from "@/stores";
import { useWindowManagerStore } from "@/stores/windowManager";
import { getAdcode, getWeather } from "@/api";

const set = setStore();
const status = statusStore();
const windowManager = useWindowManagerStore();

// 时间数据
const timeData = ref({});
const timeInterval = ref(null);

// 天气数据
const weatherData = ref(null);
const weatherKey = import.meta.env.VITE_WEATHER_KEY;

// 动态z-index计算
const timeComponentZIndex = computed(() => windowManager.timeComponentZIndex);
const weatherRef = ref(null);

const timeRef = ref(null);
const dateRef = ref(null);

const weatherTransform = computed(() => {
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const sx = clamp(set.timeOffsetX, -30, 30);
  const sy = clamp(set.timeOffsetY, -30, 30);
  const el = weatherRef.value;
  const rect = el ? el.getBoundingClientRect() : null;
  const w = rect?.width ?? 480;
  const h = rect?.height ?? 140;
  const vw = window.innerWidth || 0;
  const vh = window.innerHeight || 0;
  const safe = 60;
  const rangeX = Math.max(0, vw - w - safe * 2);
  const rangeY = Math.max(0, vh - h - safe * 2);
  const mapRangeX = Math.max(0, vw - safe * 2);
  const mapRangeY = Math.max(0, vh - safe * 2);
  const nx = sx / 30;
  const ny = sy / 30;
  const dxTarget = nx * (mapRangeX / 2);
  const dyTarget = ny * (mapRangeY / 2);
  const isSmall = window.innerWidth <= 478;
  let baseY = -140;
  if (status.siteStatus === 'focus' || status.siteStatus === 'hidden') {
    baseY = -180;
  } else if (status.siteStatus === 'box' || status.siteStatus === 'set') {
    baseY = -(vh * (isSmall ? 0.32 : 0.34));
  }
  const finalX = clamp(dxTarget, -rangeX / 2, rangeX / 2);
  const finalY = clamp(baseY + dyTarget, -rangeY / 2, rangeY / 2);
  return `translate(${finalX}px, ${finalY}px)`;
});

const dateTransform = computed(() => {
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const sx = clamp(set.dateOffsetX, -30, 30);
  const sy = clamp(set.dateOffsetY, -30, 30);
  const el = dateRef.value;
  const rect = el ? el.getBoundingClientRect() : null;
  const w = rect?.width ?? 360;
  const h = rect?.height ?? 32;
  const vw = window.innerWidth || 0;
  const vh = window.innerHeight || 0;
  const safe = 60;
  const rangeX = Math.max(0, vw - w - safe * 2);
  const rangeY = Math.max(0, vh - h - safe * 2);
  const mapRangeX = Math.max(0, vw - safe * 2);
  const mapRangeY = Math.max(0, vh - safe * 2);
  const nx = sx / 30;
  const ny = sy / 30;
  const dxTarget = nx * (mapRangeX / 2);
  const dyTarget = ny * (mapRangeY / 2);
  const isSmall = window.innerWidth <= 478;
  let baseY = -140;
  if (status.siteStatus === 'focus' || status.siteStatus === 'hidden') {
    baseY = -180;
  } else if (status.siteStatus === 'box' || status.siteStatus === 'set') {
    baseY = -(vh * (isSmall ? 0.32 : 0.34));
  }
  const lunarShift = set.showLunar ? -8 : 0;
  const fixedDownShift = 50;
  const dx = clamp(dxTarget, -rangeX / 2, rangeX / 2);
  const dy = clamp(baseY + lunarShift + fixedDownShift + dyTarget, -rangeY / 2, rangeY / 2);
  return `translate(${dx}px, ${dy}px)`;
});

// 更新时间
const updateTimeData = () => {
  timeData.value = getCurrentTime(set.showZeroTime, set.use12HourFormat);
};

// 获取天气数据
const getWeatherData = async () => {
  if (!weatherKey) {
    return;
  }
  // 当前时间戳
  const currentTime = Date.now();
  // 上次获取天气数据的数据
  let lastWeatherData = JSON.parse(localStorage.getItem("lastWeatherData")) || {
    data: {},
    lastFetchTime: 0,
  };
  // 上次获取天气数据的时间戳与当前时间的时间差（毫秒）
  const timeDifference = currentTime - lastWeatherData.lastFetchTime;
  // 是否超出 5 分钟
  if (timeDifference >= 5 * 60 * 1000) {
    const adCodeResult = await getAdcode(weatherKey);
    if (adCodeResult.infocode !== "10000") {
      return $message.error("地区查询失败");
    }
    // 获取天气数据
    const weatherResult = await getWeather(weatherKey, adCodeResult.adcode);
    if (weatherResult.infocode !== "10000") {
      return $message.error("地区查询失败");
    }
    const data = weatherResult.lives[0];
    weatherData.value = {
      condition: data.weather,
      temp: data.temperature,
      windDir: data.winddirection + "风",
      windLevel: data.windpower,
    };
    lastWeatherData = { data: weatherData.value, lastFetchTime: currentTime };
    // 储存新天气数据
    localStorage.setItem("lastWeatherData", JSON.stringify(lastWeatherData));
  } else {
    console.log("从缓存中读取天气数据：", lastWeatherData);
    weatherData.value = lastWeatherData.data;
  }
};

// 监听配置发生改变
watch(
  () => [set.showZeroTime, set.use12HourFormat],
  () => {
    updateTimeData();
  },
);

onMounted(() => {
  // 时间
  updateTimeData();
  timeInterval.value = setInterval(updateTimeData, 1000);
  // 天气
  getWeatherData();
});

onBeforeUnmount(() => {
  clearInterval(timeInterval.value);
});
</script>

<style lang="scss" scoped>
.weather-time {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  transform: translateY(-140px);
  color: var(--main-text-color);
  animation: fade-time-in 0.6s cubic-bezier(0.21, 0.78, 0.36, 1);
  transition:
    transform 0.3s,
    opacity 0.5s,
    margin-bottom 0.3s;
  z-index: var(--time-component-z-index, 1);
  .time {
    cursor: pointer;
    font-size: 3rem;
    margin: 6px 0px;
    text-shadow: var(--main-text-shadow);
    transition: transform 0.3s;
    .separator {
      opacity: 0.8;
      font-size: 2.8rem;
      display: inline-block;
      margin: 0 5px;
      transform: translateY(-4px);
      animation: separator-breathe 0.7s infinite alternate;
    }
    .amPm {
      font-size: 1rem;
      opacity: 0.6;
      margin-left: 6px;
    }
    &:hover {
      transform: scale(1.08);
    }
    &:active {
      transform: scale(1);
    }
  }
  .date {
    font-size: 1.15rem;
    opacity: 0.8;
    margin: 4px 0px;
    text-shadow: var(--main-text-shadow);
    .month {
      &::after {
        margin: 0 4px;
        content: "月";
      }
    }
    .day {
      &::after {
        margin: 0 8px 0 4px;
        content: "日";
      }
    }
  }
  .weather {
    opacity: 0.7;
    font-size: 1rem;
    text-shadow: var(--main-text-shadow);
    .temperature {
      margin: 0 6px;
    }
    .wind-level {
      margin-left: 6px;
    }
  }

  &.focus {
    transform: translateY(-180px);
    // transform: translateY(-24vh);
  }
  &.box,
  &.set {
    // transform: translateY(-220px);
    transform: translateY(-34vh);
    @media (max-width: 478px) {
      transform: translateY(-32vh);
    }
  }
  &.hidden {
    transform: translateY(-180px);
    // transform: translateY(-24vh);
    opacity: 0;
  }
  &.two {
    padding-bottom: 60px;
    .time {
      display: flex;
      flex-direction: column;
      align-items: center;
      span {
        line-height: normal;
      }
      .separator,
      .second {
        display: none;
      }
      .hour {
        &::after {
          content: "/";
          font-size: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
          opacity: 0.4;
          transform: rotate(50deg);
          margin: 12px 0;
        }
      }
    }
  }
}

.date-box {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--main-text-color);
  z-index: var(--time-component-z-index, 1);
  transition: transform 0.3s, opacity 0.5s;
  .date {
    font-size: 1.15rem;
    opacity: 0.8;
    margin: 4px 0px;
    text-shadow: var(--main-text-shadow);
    transition: transform 0.3s, opacity 0.5s;
    .month {
      &::after {
        margin: 0 4px;
        content: "月";
      }
    }
    .day {
      &::after {
        margin: 0 8px 0 4px;
        content: "日";
      }
    }
  }
  .lunar {
    font-size: 0.9rem;
    opacity: 0.6;
    text-shadow: var(--main-text-shadow);
    margin-top: 6px;
    .year {
      &::after {
        margin-right: 4px;
        content: "年";
      }
    }
  }
}
</style>

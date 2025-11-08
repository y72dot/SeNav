<template>
  <Provider>
    <!-- 壁纸 -->
    <Cover @loadComplete="loadComplete" />
    <!-- 主界面 -->
    <Transition name="fade" mode="out-in">
      <main
        v-if="status.imgLoadStatus"
        tabindex="0"
        id="main"
        :class="`main-${status.siteStatus}`"
        :style="{ outline: 'none' }"
        @click="handleMainClick"
        @contextmenu="mainContextmenu"
        @keydown="mainPressKeyboard"
      >
        <WeatherTime />
        <SearchInp @contextmenu.stop />
        <AllFunc @contextmenu.stop />
        <Footer />
        <!-- 全局虚化遮罩 -->
        <BlurOverlay />
        <!-- 状态切换 -->
        <Transition name="fade">
          <div
            class="all-controls"
            v-show="status.siteStatus !== 'focus' && status.siteStatus !== 'normal'"
          >
            <div
              class="change-status"
              :title="status.mainBoxBig ? '收起' : '展开'"
              @click.stop="status.setMainBoxBig(!status.mainBoxBig)"
            >
              <Transition name="fade" mode="out-in">
                <SvgIcon
                  :iconName="`icon-${status.mainBoxBig ? 'packup' : 'unfold'}`"
                  :key="status.mainBoxBig ? 'packup' : 'unfold'"
                />
              </Transition>
            </div>
            <div
              class="change-status"
              :title="status.siteStatus !== 'set' ? '设置' : '首页'"
              @click.stop="status.setSiteStatus(status.siteStatus !== 'set' ? 'set' : 'normal')"
            >
              <Transition name="fade" mode="out-in">
                <SvgIcon
                  :iconName="`icon-${status.siteStatus !== 'set' ? 'setting' : 'home'}`"
                  :key="status.siteStatus !== 'set' ? 'setting' : 'home'"
                />
              </Transition>
            </div>
          </div>
        </Transition>
      </main>
      <div v-else id="loading">
        <img src="/icon/logo.png" alt="logo" class="logo" />
        <span class="tip">SeNav</span>
      </div>
    </Transition>
  </Provider>
</template>

<script setup>
import { onMounted, nextTick, watch, ref } from "vue";
import { statusStore, setStore } from "@/stores";
import { useWindowManagerStore } from "@/stores/windowManager";
import { getGreeting } from "@/utils/timeTools";
import Provider from "@/components/Provider.vue";
import Cover from "@/components/Cover.vue";
import WeatherTime from "@/components/WeatherTime.vue";
import SearchInp from "@/components/SearchInput/SearchInp.vue";
import AllFunc from "@/components/AllFunc/AllFunc.vue";
import Footer from "@/components/Footer.vue";
import BlurOverlay from "@/components/BlurOverlay.vue";

const set = setStore();
const status = statusStore();
const windowManager = useWindowManagerStore();
const mainClickable = ref(false);

// 获取配置
const welcomeText = import.meta.env.VITE_WELCOME_TEXT ?? "欢迎访问本站";

// 鼠标右键
const mainContextmenu = (event) => {
  event.preventDefault();
  status.setSiteStatus("box");
};

// 全局键盘事件
const mainPressKeyboard = (event) => {
  // ESC键处理 - 关闭当前聚焦的窗口或搜索引擎面板
  if (event.key === 'Escape') {
    const closedWindowId = windowManager.closeFocusedWindow();
    if (closedWindowId) {
      // 如果成功关闭了窗口，阻止默认行为
      event.preventDefault();
      return;
    }
    // 若无可关闭的浮动窗口，尝试关闭搜索引擎选择面板
    if (windowManager.openedWindows.engineSelector) {
      windowManager.setWindowVisibleByType('engineSelector', false);
      // 同步旧状态字段，保持兼容
      status.setEngineChangeStatus(false);
      event.preventDefault();
      return;
    }
  }
  
  // 只在主界面状态下响应其他键盘事件
  if (status.siteStatus !== 'normal') {
    return;
  }
  
  // 回车或空格
  if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
    // 检查是否在搜索框中
    const mainInput = document.getElementById("main-input");
    const isInputFocused = document.activeElement === mainInput;
    
    // 如果搜索框已聚焦且输入的是空格，不处理（让输入框正常处理空格）
    if (isInputFocused && event.key === ' ') {
      return;
    }
    
    console.log('触发搜索框聚焦');
    // focus 元素
    status.setSiteStatus("focus");
    mainInput?.focus();
    // 只在处理搜索框聚焦时阻止默认行为
    event.preventDefault();
  }
  
  // 斜杠键 / 聚焦搜索框并填入 /
  if (event.key === '/') {
    // 检查是否在搜索框中
    const mainInput = document.getElementById("main-input");
    const isInputFocused = document.activeElement === mainInput;
    
    // 如果搜索框已聚焦，让输入框正常处理斜杠
    if (isInputFocused) {
      return;
    }
    
    console.log('斜杠键触发搜索框聚焦并填入/');
    // focus 元素
    status.setSiteStatus("focus");
    // 设置搜索框内容为 /
    status.setSearchInputValue('/');
    mainInput?.focus();
    // 阻止默认行为
    event.preventDefault();
  }
};

// 加载完成事件
const loadComplete = () => {
  nextTick().then(() => {
    // 设置main元素可点击
    mainClickable.value = true;
    // 确保main元素获得焦点
    const mainElement = document.getElementById("main");
    mainElement?.focus();
    $message.info(getGreeting() + "，" + welcomeText, {
      showIcon: false,
      duration: 3000,
    });
  });
};

// 根据主题类别更改
const changeThemeType = (val) => {
  const htmlElement = document.querySelector("html");
  const themeType = val === "light" ? "light" : "dark";
  htmlElement.setAttribute("theme", themeType);
};

// 监听颜色变化
watch(
  () => set.themeType,
  (val) => changeThemeType(val),
);

onMounted(() => {
  changeThemeType(set.themeType);
});
</script>

<style lang="scss" scoped>
#main,
#loading {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  &.main-normal,
  &.main-focus {
    .main-box {
      opacity: 0;
      margin-top: 0;
      transform: scale(0.35);
      pointer-events: none;
    }
  }
  &.main-box,
  &.main-set {
    .main-box {
      opacity: 1;
      margin-top: 20vh;
      transform: scale(1);
      visibility: visible;
      @media (max-width: 478px) {
        margin-top: 22vh;
      }
    }
    .search-input {
      :deep(.all) {
        opacity: 0;
        width: 0;
        visibility: hidden;
      }
    }
  }
  .all-controls {
    position: fixed;
    width: 100%;
    top: 0;
    padding: 10px;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
    .change-status {
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      padding: 8px;
      border-radius: 8px;
      color: var(--main-text-color);
      z-index: 1;
      transition:
        opacity 0.3s,
        background-color 0.3s,
        transform 0.3s;
      &:hover {
        backdrop-filter: blur(20px);
        background-color: var(--main-background-light-color);
      }
      &:active {
        transform: scale(0.95);
      }
    }
  }
}
#loading {
  color: var(--main-text-color);
  .logo {
    width: 100px;
    height: 100px;
    margin-bottom: 24px;
    animation: logo-breathe 3s infinite alternate;
  }
  .tip {
    font-size: 20px;
  }
}
</style>

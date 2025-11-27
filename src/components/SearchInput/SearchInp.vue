<template>
  <!-- 搜索框 -->
  <div
    :class="[
      'search-input',
      set.smallInput ? 'small' : null,
      status.siteStatus === 'focus' ? 'focus' : null,
    ]"
    @click.stop
  >

    <!-- 主搜索框 -->
    <div class="all" ref="searchAllRef" @animationend="inputAnimationEnd" :style="{ zIndex: searchBoxZIndex, '--search-box-z-index': searchBoxZIndex, transform: searchTransform }">
      <div class="engine" title="切换搜索引擎" @click="changeEngine">
        <Transition name="fade" mode="out-in">
          <SvgIcon
            :iconName="`icon-${
              set.searchEngine !== 'custom' ? defaultEngine[set.searchEngine]?.icon : 'custom'
            }`"
            :key="set.searchEngine"
          />
        </Transition>
      </div>
      <input autocomplete="off" name="search"
        class="input"
        id="main-input"
        ref="searchInputRef"
        type="text"
        label="search"
        title="请输入搜索内容"
        :placeholder="inputTip"
        v-model="status.searchInputValue"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
        @click.stop="closeEngineSelector"
        @keydown.stop="pressKeyboard"
        @input="handleInput"
      />
      <div class="go" title="搜索" @click="handleSearchAction(status.searchInputValue)">
        <SvgIcon iconName="icon-search" className="search" />
      </div>
    </div>
    <!-- 搜索引擎切换 -->
    <SearchEngine />
    <!-- 搜索建议 -->
    <Suggestions 
      ref="suggestionsRef" 
      :keyWord="status.searchInputValue" 
      @toSearch="handleSearchAction" 
      @commandExecuted="handleCommandExecuted"
      @tabCompletion="handleTabCompletion"
    />
    <!-- 帮助窗口 -->
    <HelpWindow
      :visible="helpWindowVisible"
      :commands-by-category="helpCommandsByCategory"
      @close="closeHelpWindow"
      @commandClick="handleHelpCommandClick"
    />
    <!-- 捷径管理窗口 -->
    <ShortcutWindow
      :visible="shortcutWindowVisible"
      @close="closeShortcutWindow"
    />
    
    <!-- 便签窗口 -->
    <NoteWindow
      :visible="noteWindowVisible"
      @close="closeNoteWindow"
    />
    
    <!-- 设置窗口 -->
    <SettingWindow
      :visible="settingWindowVisible"
      @close="closeSettingWindow"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, computed, onMounted, onBeforeUnmount } from "vue";
import { statusStore, setStore } from "@/stores";
import { useWindowManagerStore } from "@/stores/windowManager";
import SearchEngine from "@/components/SearchInput/SearchEngine.vue";
import Suggestions from "@/components/SearchInput/Suggestions.vue";
import HelpWindow from "@/components/HelpWindow.vue";
import ShortcutWindow from "@/components/ShortcutWindow.vue";
import NoteWindow from "@/components/NoteWindow.vue";
import SettingWindow from "@/components/SettingWindow.vue";
import defaultEngine from "@/assets/defaultEngine.json";

const set = setStore();
const status = statusStore();
const windowManager = useWindowManagerStore();

// 搜索框配置
const inputTip = import.meta.env.VITE_INPUT_TIP ?? "想要搜点什么";

// 搜索框数据
const searchAllRef = ref(null);

// 动态z-index计算
const searchBoxZIndex = computed(() => windowManager.searchBoxZIndex);
const searchComponentsZIndex = computed(() => windowManager.searchComponentsZIndex);
const searchInputRef = ref(null);
const searchTransform = computed(() => {
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const sx = clamp(set.searchBoxOffsetX, -30, 30);
  const sy = clamp(set.searchBoxOffsetY, -30, 30);
  const el = searchAllRef.value;
  const rect = el ? el.getBoundingClientRect() : null;
  const w = rect?.width ?? 680;
  const h = rect?.height ?? 42;
  const vw = window.innerWidth || 0;
  const vh = window.innerHeight || 0;
  const safeX = 60;
  const safeY = 60;
  const rangeX = Math.max(0, vw - w - safeX * 2);
  const rangeY = Math.max(0, vh - h - safeY * 2);
  const dw = 680;
  const dh = 42;
  const mapRangeX = Math.max(0, vw - dw - safeX * 2);
  const mapRangeY = Math.max(0, vh - dh - safeY * 2);
  const nx = sx / 30;
  const ny = sy / 30;
  const dxTarget = nx * (mapRangeX / 2);
  const dyTarget = ny * (mapRangeY / 2);
  const focusShift = status.siteStatus === 'focus' ? 60 : 0;
  const dx = clamp(dxTarget, -rangeX / 2, rangeX / 2);
  const dy = clamp(dyTarget - focusShift, -rangeY / 2, rangeY / 2);
  return `translate(${dx}px, ${dy}px)`;
});

// 搜索建议子组件
const suggestionsRef = ref(null);

// 帮助窗口状态（持久化）
const helpWindowVisible = computed(() => windowManager.openedWindows.help)
const helpCommandsByCategory = ref({});

// 捷径窗口状态（持久化）
const shortcutWindowVisible = computed(() => windowManager.openedWindows.shortcut);

// 便签窗口状态（持久化）
const noteWindowVisible = computed(() => windowManager.openedWindows.note);

// 设置窗口状态（持久化）
const settingWindowVisible = computed(() => windowManager.openedWindows.setting);

// 关闭搜索框
const closeSearchInput = (check = false) => {
  if (check && !set.autoInputBlur) {
    status.setSiteStatus("focus");
  } else {
    status.setSearchInputValue("");
    status.setSiteStatus("normal");
    searchInputRef.value?.blur();
    // 确保main元素获得焦点
    nextTick(() => {
      const mainElement = document.getElementById("main");
      mainElement?.focus();
    });
  }
  // 同步关闭搜索引擎选择面板
  windowManager.setWindowVisibleByType('engineSelector', false);
  // 兼容旧状态字段
  status.setEngineChangeStatus(false);
};

// 统一的搜索处理函数
const handleSearchAction = async (val, type = 1) => {
  console.log("🔍 搜索按钮被点击，输入值：", val, "类型：", type);
  const searchValue = val?.trim();
  
  // 如果为空，提示用户输入
  if (!searchValue) {
    console.log("❌ 搜索值为空");
    if (status.siteStatus === "focus") {
      $message.info("请输入搜索内容", { duration: 1500 });
    }
    status.setSiteStatus("focus");
    searchInputRef.value?.focus();
    return;
  }

  console.log("✅ 搜索值有效，开始处理：", searchValue);

  // 导入命令识别函数
  const { identifyCommand } = await import("@/utils/commandRegistry");
  
  // 如果是以 / 开头的输入，进行命令识别
  if (searchValue.startsWith('/')) {
    console.log("🔧 检测到命令输入");
    const commandResult = identifyCommand(searchValue);
    console.log("🔧 命令识别结果：", commandResult);
    
    // 如果是完整的命令，执行命令而不是搜索
    if (commandResult.type === 'command' && commandResult.command && !commandResult.isPartial) {
      console.log("🚀 执行完整命令");
      const { executeCommand } = await import("@/utils/commandRegistry");
      const result = executeCommand(searchValue);
      handleCommandExecuted(result);
      return;
    }
    
    // 如果是命令但不完整，不执行搜索，直接返回
    if (commandResult.type === 'command' || commandResult.type === 'command-partial') {
      console.log("⏸️ 命令不完整，不执行搜索");
      return;
    }
  }
  
  // 非命令类型，执行正常搜索
  console.log("🌐 执行正常搜索");
  toSearch(searchValue, type);
};

// 前往搜索
const toSearch = (val, type = 1) => {
  const searchValue = val?.trim();
  // 定义跳转方法
  const jumpLink = (url) => {
    if (set.urlJumpType === "href") {
      window.location.href = url;
    } else if (set.urlJumpType === "open") {
      window.open(url, "_blank");
    }
  };
  // 是否为空
  if (searchValue) {
    const searchFormat = encodeURIComponent(searchValue);
    console.log("前往搜索：" + searchValue, type);
    switch (type) {
      // 默认搜索
      case 1:
        if (set.searchEngine !== "custom") {
          const engine = defaultEngine[set.searchEngine];
          jumpLink(engine?.url + searchFormat);
        } else {
          jumpLink(set.customEngineUrl + searchFormat);
        }
        break;
      // 快捷翻译
      case 2: {
        const hasTranslation = defaultEngine[set.searchEngine]?.translation;
        jumpLink(
          hasTranslation
            ? hasTranslation + searchFormat
            : `https://fanyi.baidu.com/#en/zh/${searchFormat}`,
        );
        break;
      }
      // 电子邮件
      case 3:
        jumpLink(`mailto:${searchFormat}`);
        break;
      // 直接访问
      case 4: {
        // 注意：不要对 URL 做整体编码，否则会造成类似 //https%3A... 的非法地址
        const raw = searchValue;
        const hasProtocol = /^(https?:\/\/)/i.test(raw);
        // 域名或 IP（可选端口）用于判断是否可用协议相对URL
        const looksLikeHost = /^(?:[a-z0-9-]+\.)+[a-z]{2,}|^(?:(?:\d{1,3}\.){3}\d{1,3})(?::\d+)?$/i.test(raw);
        const url = hasProtocol ? raw : looksLikeHost ? `//${raw}` : `https://${raw}`;
        jumpLink(url);
        break;
      }
      default:
        break;
    }
    closeSearchInput(true);
  } else {
    if (status.siteStatus === "focus") {
      $message.info("请输入搜索内容", { duration: 1500 });
    }
    status.setSiteStatus("focus");
    searchInputRef.value?.focus();
  }
};

// 搜索框动画结束
const inputAnimationEnd = () => {
  console.log("搜索框动画结束");
  // 自动 focus
  if (set.autoFocus) {
    status.setSiteStatus("focus");
    searchInputRef.value?.focus();
  }
};

// 键盘事件
const pressKeyboard = (event) => {
  const keyCode = event.keyCode;
  // ESC 键退出搜索聚焦
  if (keyCode === 27) {
    event.preventDefault();
    closeSearchInput(false);
    return;
  }
  // Tab键阻止默认行为避免焦点切换
  if (keyCode === 9) {
    event.preventDefault();
  }
  // 子组件事件
  suggestionsRef.value?.keyboardEvents(keyCode, event);
};

// 更换搜索引擎
// 关闭搜索引擎选择面板（输入框点击时触发）
const closeEngineSelector = () => {
  windowManager.setWindowVisibleByType('engineSelector', false);
  status.setEngineChangeStatus(false);
};

// 更换搜索引擎面板显隐
const changeEngine = () => {
  status.setSiteStatus("focus", false);
  // 未聚焦点击引擎按钮也需要前置搜索相关组件层级，避免虚化遮罩覆盖
  windowManager.setSearchBoxFocused(true);
  const nextVisible = !windowManager.openedWindows.engineSelector;
  windowManager.setWindowVisibleByType('engineSelector', nextVisible);
  // 兼容旧状态字段
  status.setEngineChangeStatus(nextVisible);
};

// 处理输入事件
const handleInput = (event) => {
  const value = event.target.value;
  // 如果只输入了一个空格，清除内容并失焦
  if (value === ' ') {
    status.setSearchInputValue('');
    closeSearchInput(false);
  }
};

// 处理命令执行结果
const handleCommandExecuted = (result) => {
  console.log("命令执行结果：", result);
  
  // 特殊处理 iframe 命令
  if (result.success && result.data && result.data.action === 'open_iframe') {
    console.log("🖼️ 触发 iframe 窗口显示，URL：", result.data.url);
    // 通过子组件方法打开 iframe 窗口
    if (suggestionsRef.value && suggestionsRef.value.openIframeViewer) {
      // 直接传递URL给openIframeViewer方法
      suggestionsRef.value.openIframeViewer(result.data.url);
    } else {
      console.log("⚠️ 无法通过子组件打开窗口，suggestionsRef不可用");
    }
  }
  
  // 特殊处理 help 命令
  if (result.success && result.data && result.data.action === 'show_help_window') {
    console.log("📋 显示帮助信息");
    // 设置帮助窗口数据并显示
    helpCommandsByCategory.value = result.data.commandsByCategory || {};
    windowManager.setWindowVisibleByType('help', true);
  } 
  // 特殊处理 shortcut 命令
  else if (result.success && result.data && result.data.action === 'show_shortcut_window') {
    console.log("🔗 显示捷径管理窗口");
    windowManager.setWindowVisibleByType('shortcut', true);
  } 
  // 特殊处理 note 命令
  else if (result.success && result.data && result.data.action === 'show_note_window') {
    console.log("📝 显示便签管理窗口");
    windowManager.setWindowVisibleByType('note', true);
  } 
  // 特殊处理 setting 命令
  else if (result.success && result.data && result.data.action === 'show_setting_window') {
    console.log("⚙️ 显示设置窗口");
    windowManager.setWindowVisibleByType('setting', true);
  } 
  else if (result.success) {
    $message.success(result.message || "命令执行成功");
  } else {
    $message.error(result.message || "命令执行失败");
  }
  // 关闭搜索框
  closeSearchInput(false);
};

// 处理TAB补全
const handleTabCompletion = (completion) => {
  console.log("TAB补全：", completion);
  // 更新搜索框内容但避免触发失焦或重置
  status.setSearchInputValue(completion);
  // 保持聚焦
  nextTick(() => {
    const input = searchInputRef.value;
    input?.focus();
    // 确保光标在末尾
    if (input) {
      input.setSelectionRange(completion.length, completion.length);
    }
  });
};

// 处理输入框聚焦事件
const handleInputFocus = () => {
  status.setSiteStatus('focus');
  windowManager.setSearchBoxFocused(true);
};

// 处理输入框失焦事件
const handleInputBlur = () => {
  // 如果站点状态仍为 'focus'（例如点击了搜索建议或引擎切换面板），保持搜索相关组件的前置层级，避免虚化遮罩遮挡
  if (status.siteStatus === 'focus') {
    windowManager.setSearchBoxFocused(true);
    return;
  }
  windowManager.setSearchBoxFocused(false);
};

  // 关闭帮助窗口
  const closeHelpWindow = () => {
    windowManager.setWindowVisibleByType('help', false)
    helpCommandsByCategory.value = {}
  }

  // 关闭捷径窗口
  const closeShortcutWindow = () => {
    windowManager.setWindowVisibleByType('shortcut', false)
  }

  // 关闭便签窗口
  const closeNoteWindow = () => {
    windowManager.setWindowVisibleByType('note', false)
  }

  // 关闭设置窗口
  const closeSettingWindow = () => {
    windowManager.setWindowVisibleByType('setting', false)
  }

  // 处理帮助窗口中的命令点击
  const handleHelpCommandClick = (commandName) => {
    console.log("帮助窗口命令点击：", commandName)
    // 设置搜索框内容为点击的命令
    status.setSearchInputValue(commandName)
    // 聚焦搜索框
    nextTick(() => {
      searchInputRef.value?.focus()
      // 设置搜索框状态为聚焦
      status.setSiteStatus("focus")
    })
  }

// 监听来自捷径组件的全局执行事件，复用搜索逻辑
onMounted(() => {
  const handler = (e) => {
    try {
      const { value, type = 1 } = e.detail || {};
      handleSearchAction(value, type);
    } catch (err) {
      console.error('处理全局执行事件出错：', err);
    }
  };
  window.addEventListener('snav:exec', handler);
  // 在卸载时移除监听器
  onBeforeUnmount(() => {
    window.removeEventListener('snav:exec', handler);
  });
});
</script>

<style lang="scss" scoped>
  .search-input {
  position: absolute;
  display: flex;
  flex-direction: row;
  align-items: center;
  max-width: 680px;
  width: calc(100% - 60px);
  transition: width 0.35s linear;
  .all {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    height: 42px;
    width: 100%;
    border-radius: 30px;
    color: var(--main-text-color);
    background-color: var(--main-background-color);
    backdrop-filter: blur(10px);
    opacity: 1;
    animation: fade-up-in 0.7s cubic-bezier(0.37, 0.99, 0.36, 1);
    transition:
      transform 0.3s,
      background-color 0.3s,
      opacity 0.5s;
    z-index: var(--search-box-z-index, 1);
    .input {
      display: flex;
      justify-content: center;
      height: 100%;
      width: 100%;
      padding: 0;
      margin: 0;
      border: none;
      outline: none;
      background: none;
      font-size: 16px;
      color: var(--main-text-color);
      &::placeholder {
        width: 100%;
        text-align: center;
        color: var(--main-text-color);
        letter-spacing: 2px;
        transition: opacity 0.3s;
      }
    }
    .engine,
    .go {
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      width: 64px;
      font-size: 20px;
      border-radius: 30px;
      transition:
        background-color 0.3s,
        opacity 0.3s;
      &:hover {
        background-color: var(--main-background-color);
      }
      @media (max-width: 520px) {
        font-size: 18px;
      }
    }
  }
  &.small {
    width: 260px;
    .all {
      .engine,
      .go {
        opacity: 0;
      }
      .input {
        &::placeholder {
          opacity: 0.6;
        }
      }
      &.focus {
        .engine,
        .go {
          opacity: 1;
        }
      }
    }
    &:hover {
      // width: calc(100% - 60px);
      .all {
        .input {
          &::placeholder {
            opacity: 1;
          }
        }
      }
    }
  }
  &.focus {
    width: calc(100% - 60px);
    .all {
      transform: translateY(-60px);
      background-color: var(--main-input-hover-color);
      .input {
        color: var(--main-text-hover-color);
        &::placeholder {
          opacity: 0;
        }
      }
      .engine,
      .go,
      .delete {
        opacity: 1;
        color: var(--main-text-hover-color);
      }
    }
  }
}
</style>

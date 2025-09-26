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
    <!-- 搜索框遮罩 -->
    <div
      v-if="status.siteStatus === 'focus'"
      class="mask"
      @click="closeSearchInput(false)"
      @contextmenu.stop="
        (event) => {
          event.preventDefault();
        }
      "
    />
    <!-- 主搜索框 -->
    <div class="all" ref="searchAllRef" @animationend="inputAnimationEnd">
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
        @focus="status.setSiteStatus('focus')"
        @click.stop="status.setEngineChangeStatus(false)"
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
  </div>
</template>

<script setup>
import { ref, nextTick } from "vue";
import { statusStore, setStore } from "@/stores";
import SearchEngine from "@/components/SearchInput/SearchEngine.vue";
import Suggestions from "@/components/SearchInput/Suggestions.vue";
import HelpWindow from "@/components/HelpWindow.vue";
import ShortcutWindow from "@/components/ShortcutWindow.vue";
import NoteWindow from "@/components/NoteWindow.vue";
import defaultEngine from "@/assets/defaultEngine.json";

const set = setStore();
const status = statusStore();

// 搜索框配置
const inputTip = import.meta.env.VITE_INPUT_TIP ?? "想要搜点什么";

// 搜索框数据
const searchAllRef = ref(null);
const searchInputRef = ref(null);

// 搜索建议子组件
const suggestionsRef = ref(null);

// 帮助窗口状态
const helpWindowVisible = ref(false)
const helpCommandsByCategory = ref({});

// 捷径窗口状态
const shortcutWindowVisible = ref(false);

// 便签窗口状态
const noteWindowVisible = ref(false);

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
        const urlRegex = /^(https?:\/\/)/i;
        const url = urlRegex.test(searchFormat) ? searchFormat : `//${searchFormat}`;
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
  // 获取键的键码
  const keyCode = event.keyCode;
  // 子组件事件
  suggestionsRef.value?.keyboardEvents(keyCode, event);
};

// 更换搜索引擎
const changeEngine = () => {
  status.setSiteStatus("focus", false);
  status.setEngineChangeStatus(!status.engineChangeStatus);
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
    helpWindowVisible.value = true;
  } 
  // 特殊处理 shortcut 命令
  else if (result.success && result.data && result.data.action === 'show_shortcut_window') {
    console.log("🔗 显示捷径管理窗口");
    shortcutWindowVisible.value = true;
  } 
  // 特殊处理 note 命令
  else if (result.success && result.data && result.data.action === 'show_note_window') {
    console.log("📝 显示便签管理窗口");
    noteWindowVisible.value = true;
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
  // 更新搜索框内容
  status.setSearchInputValue(completion);
  // 保持焦点，不关闭搜索框
  nextTick(() => {
    searchInputRef.value?.focus();
    // 确保光标在末尾
    const input = searchInputRef.value;
    if (input) {
      input.setSelectionRange(completion.length, completion.length);
    }
  });
};

  // 关闭帮助窗口
  const closeHelpWindow = () => {
    helpWindowVisible.value = false
    helpCommandsByCategory.value = {}
  }

  // 关闭捷径窗口
  const closeShortcutWindow = () => {
    shortcutWindowVisible.value = false
  }

  // 关闭便签窗口
  const closeNoteWindow = () => {
    noteWindowVisible.value = false
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
  .mask {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }
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
    z-index: 1;
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

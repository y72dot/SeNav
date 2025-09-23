<template>
  <Transition name="fadeDown" mode="out-in">
    <div
      v-if="
        set.showSuggestions &&
        searchKeyword !== null &&
        status.siteStatus === 'focus' &&
        !status.engineChangeStatus
      "
      class="suggestions"
      :style="{ height: `${suggestionsHeights}px` }"
    >
      <n-scrollbar style="max-height: 45vh">
        <!-- 快捷操作 -->
        <Transition
          name="fade"
          mode="out-in"
          @after-enter="changeSuggestionsHeights"
          @after-leave="changeSuggestionsHeights"
        >
          <div v-if="searchKeyword !== null && set.showOtherSuggestions" class="special-result" ref="specialallResultsRef">
            <!-- iframe 命令建议 -->
            <div
              v-if="searchKeywordType === 'iframe' || searchKeywordType === 'iframe-partial'"
              class="s-result iframe-result"
              @click.stop="searchKeywordType === 'iframe' ? openIframeViewer() : null"
            >
              <SvgIcon iconName="icon-link" />
              <div class="command-info">
                <span class="command-name">{{ searchKeywordType === 'iframe' ? '打开网页' : 'iframe 命令' }}</span>
                <span class="command-desc">
                  {{ searchKeywordType === 'iframe' ? 
                     `在浮窗中打开：${getIframeUrl(searchKeyword)}` : 
                     '输入完整的 /iframe 网址 来打开网页' 
                  }}
                </span>
              </div>
            </div>
            <!-- 命令建议 -->
            <div
              v-if="searchKeywordType === 'command' || searchKeywordType === 'command-partial'"
              class="s-result command-result"
              v-for="cmd in commandSuggestions"
              :key="cmd.name"
              :data-command="cmd.name"
              @click.stop="completeCommand(cmd.name)"
            >
              <SvgIcon iconName="icon-code" />
              <div class="command-info">
                <span class="command-name">{{ cmd.name }}</span>
                <span class="command-desc">{{ cmd.description }}</span>
              </div>
            </div>
            <!-- 快捷翻译 -->
            <div
              v-if="searchKeywordType === 'text'"
              class="s-result"
              @click.stop="toSearch(keyWord, 2)"
            >
              <SvgIcon iconName="icon-translation-two" />
              <span class="text">快捷翻译：{{ keyWord }}</span>
            </div>
            <!-- 直接访问 -->
            <div
              v-if="searchKeywordType !== 'text' && searchKeywordType !== 'command'"
              class="s-result"
              @click.stop="toSearch(searchKeyword, searchKeywordType === 'email' ? 3 : 4)"
            >
              <SvgIcon :iconName="`icon-${searchKeywordType === 'email' ? 'email' : 'link'}`" />
              <span class="text">
                {{ searchKeywordType === "email" ? "发送邮件至" : "直接访问" }}：{{ searchKeyword }}
              </span>
            </div>
          </div>
        </Transition>
        <!-- 搜索建议 -->
        <Transition
          name="fade"
          mode="out-in"
          @after-enter="changeSuggestionsHeights"
          @after-leave="changeSuggestionsHeights"
        >
          <div
            v-if="searchKeyword !== null && searchSuggestionsData[0] && searchKeywordType !== 'command' && set.showSearchSuggestions"
            class="all-result"
            ref="allResultsRef"
          >
            <div
              v-for="item in searchSuggestionsData"
              class="s-result"
              :key="item"
              @click.stop="toSearch(item, 1)"
            >
              <SvgIcon iconName="icon-search" className="search" />
              <span class="text">{{ item }}</span>
            </div>
          </div>
        </Transition>
      </n-scrollbar>
    </div>
  </Transition>
  
  <!-- IframeViewer 组件 - 支持多窗口 -->
  <IframeViewer
    v-for="window in iframeWindows"
    :key="window.id"
    :url="window.url"
    :visible="window.visible"
    @close="() => closeIframeViewer(window.id)"
  />
</template>

<script setup>
import { NScrollbar } from "naive-ui";
import { nextTick, ref, watch } from "vue";
import { statusStore, setStore } from "@/stores";
import { getSearchSuggestions } from "@/api";
import debounce from "@/utils/debounce";
import identifyInput from "@/utils/identifyInput";
import { getCommandSuggestions, executeCommand as execCommand, getTabCompletion, identifyCommand } from "@/utils/commandRegistry";
import IframeViewer from "@/components/IframeViewer.vue";

const set = setStore();
const status = statusStore();
const emit = defineEmits(["toSearch", "commandExecuted", "tabCompletion"]);

// 搜索关键字
const searchKeyword = ref(null);
// 搜索关键字类别
const searchKeywordType = ref("text");
// 搜索建议数据
const searchSuggestionsData = ref([]);
// 命令建议数据
const commandSuggestions = ref([]);
// iframe 相关状态 - 支持多窗口
const iframeWindows = ref([]);
let windowIdCounter = 0;
// 搜索建议元素
const specialallResultsRef = ref(null);
const allResultsRef = ref(null);
// 搜索建议高度
const suggestionsHeights = ref(0);
// 接收搜索框内容
const props = defineProps({
  // 搜索关键字
  keyWord: {
    type: String,
    required: true,
  },
});

// 执行命令
const executeCommand = (command) => {
  const result = execCommand(command);
  emit("commandExecuted", result);
  // 清空搜索框
  searchKeyword.value = null;
  commandSuggestions.value = [];
};

// 补全命令到输入框（只对命令类型）
const completeCommand = (command) => {
  // 检查是否为命令类型
  if (command && command.startsWith('/')) {
    emit("tabCompletion", command);
    // 清空建议
    searchKeyword.value = null;
    commandSuggestions.value = [];
  } else {
    // 非命令类型，执行搜索
    emit("toSearch", command, 1);
  }
};

// 处理TAB补全
const handleTabCompletion = () => {
  if (searchKeywordType.value === 'command') {
    const completion = getTabCompletion(searchKeyword.value);
    if (completion) {
      emit("tabCompletion", completion);
      return true;
    }
  }
  return false;
};

// 获取 iframe URL
const getIframeUrl = (input) => {
  const match = input.match(/^\/iframe\s+(.+)/i);
  if (match) {
    let url = match[1].trim();
    // 如果没有协议，默认添加 https://
    if (!url.match(/^https?:\/\//i)) {
      url = 'https://' + url;
    }
    return url;
  }
  return '';
};

// 打开 iframe 查看器 - 支持多窗口
const openIframeViewer = (url = null) => {
  // 如果传入了URL参数，直接使用；否则从搜索框获取
  const targetUrl = url || getIframeUrl(searchKeyword.value);
  console.log("🖼️ openIframeViewer 被调用，URL：", targetUrl);
  
  if (targetUrl) {
    // 创建新的窗口对象
    const newWindow = {
      id: ++windowIdCounter,
      url: targetUrl,
      visible: true
    };
    
    // 添加到窗口数组
    iframeWindows.value.push(newWindow);
    console.log("✅ 新iframe窗口已创建，ID：", newWindow.id, "URL：", targetUrl);
    console.log("📊 当前窗口数量：", iframeWindows.value.length);
    
    // 清空搜索框
    searchKeyword.value = null;
  } else {
    console.log("❌ 无效的URL，无法打开iframe窗口");
  }
};

// 关闭 iframe 查看器 - 支持多窗口
const closeIframeViewer = (windowId) => {
  const index = iframeWindows.value.findIndex(window => window.id === windowId);
  if (index !== -1) {
    iframeWindows.value.splice(index, 1);
    console.log("✅ iframe窗口已关闭，ID：", windowId);
    console.log("📊 剩余窗口数量：", iframeWindows.value.length);
  }
};

// 搜索框联想 - 为命令提示移除延迟，为搜索建议保留少量延迟
const keywordsSearch = (val) => {
  const searchValue = val?.trim();
  // 是否为空
  if (!searchValue || searchValue === "") {
    searchKeyword.value = null;
    commandSuggestions.value = [];
    searchSuggestionsData.value = [];
    return false;
  }
  // 关闭切换搜索引擎
  status.setEngineChangeStatus(false);
  // 赋值关键字
  searchKeyword.value = searchValue;
  // 识别输入类型
  searchKeywordType.value = identifyInput(searchValue);
  
  // 若为命令或部分命令 - 即时显示，无延迟
  if ((searchKeywordType.value === 'command' || searchKeywordType.value === 'command-partial') && set.showOtherSuggestions) {
    console.log(val + "的命令建议");
    // 获取命令建议
    commandSuggestions.value = getCommandSuggestions(searchValue);
    // 清空搜索建议
    searchSuggestionsData.value = [];
    // 计算高度
    nextTick().then(() => {
      changeSuggestionsHeights();
    });
  }
  // 若为 iframe 命令或部分 iframe 命令 - 即时显示，无延迟
  else if ((searchKeywordType.value === 'iframe' || searchKeywordType.value === 'iframe-partial') && set.showOtherSuggestions) {
    console.log(val + "的iframe命令");
    // 清空其他建议
    commandSuggestions.value = [];
    searchSuggestionsData.value = [];
    // 计算高度
    nextTick().then(() => {
      changeSuggestionsHeights();
    });
  } else {
    // 清空命令建议
    commandSuggestions.value = [];
    // 若为文字，获取搜索建议 - 保留少量延迟
    if (searchKeywordType.value === 'text' && set.showSearchSuggestions) {
      console.log(val + "的搜索建议");
      // 调用搜索建议
      getSearchSuggestions(searchValue)
        .then((res) => {
          console.log(res);
          // 确保res是数组，写入结果
          searchSuggestionsData.value = Array.isArray(res) ? res : [];
          // 计算高度
          nextTick().then(() => {
            changeSuggestionsHeights();
          });
        })
        .catch((error) => {
          // 清空结果
          searchSuggestionsData.value = [];
          console.error("处理搜索建议发生错误：", error);
        });
    } else {
      // 对于URL和邮箱，或者关闭了搜索建议，清空搜索建议
      searchSuggestionsData.value = [];
      // 计算高度
      nextTick().then(() => {
        changeSuggestionsHeights();
      });
    }
  }
};

// 为搜索建议添加防抖，但命令提示不使用防抖
const debouncedSearchSuggestions = debounce((val) => {
  const searchValue = val?.trim();
  if (!searchValue || searchValue === "") {
    return false;
  }
  
  const inputType = identifyInput(searchValue);
  // 只对非命令类型使用防抖
  if (inputType !== 'command') {
    keywordsSearch(val);
  }
}, 200);

// 响应键盘事件
const keyboardEvents = (keyCode, event) => {
  try {
    // 获取元素
    const mainInput = document.getElementById("main-input");
    
    // 9 TAB键 - 处理命令自动补全
    if (keyCode === 9) {
      event.preventDefault();
      if (handleTabCompletion()) {
        return;
      }
    }
    
    // 38 上 / 40 下
    if (keyCode === 38 || keyCode === 40) {
      // 阻止默认事件
      event.preventDefault();
      
      // 处理命令建议导航
      if (searchKeywordType.value === 'command' && commandSuggestions.value.length > 0) {
        const commandItems = document.querySelectorAll(".command-result");
        if (commandItems.length > 0) {
          // 获取当前已聚焦的元素
          const focusedItem = document.querySelector(".command-result.focus");
          // 确定当前聚焦的元素在列表中的索引
          const currentIndex = Array.from(commandItems).indexOf(focusedItem);
          // 移除所有元素的选中状态
          commandItems.forEach((item) => item.classList.toggle("focus", false));
          // 计算下一个要聚焦的元素的索引
          let nextIndex = keyCode === 38 ? currentIndex - 1 : currentIndex + 1;
          // 确保索引不越界
          nextIndex = Math.max(0, Math.min(nextIndex, commandItems.length - 1));
          // 操作元素
          if (nextIndex !== -1) {
            commandItems[nextIndex].classList.toggle("focus", true);
            mainInput.value = commandItems[nextIndex].dataset.command;
          }
        }
      } 
      // 处理搜索建议导航
      else if (mainInput && allResultsRef.value && searchSuggestionsData.value[0]) {
        const suggestionItems = allResultsRef.value.querySelectorAll(".s-result");
        if (suggestionItems.length > 0) {
          // 获取当前已聚焦的元素
          const focusedItem = document.querySelector(".s-result.focus");
          // 确定当前聚焦的元素在列表中的索引
          const currentIndex = Array.from(suggestionItems).indexOf(focusedItem);
          // 移除所有元素的选中状态
          suggestionItems.forEach((item) => item.classList.toggle("focus", false));
          // 计算下一个要聚焦的元素的索引
          let nextIndex = keyCode === 38 ? currentIndex - 1 : currentIndex + 1;
          // 确保索引不越界
          nextIndex = Math.max(0, Math.min(nextIndex, suggestionItems.length - 1));
          // 操作元素
          if (nextIndex !== -1) {
            suggestionItems[nextIndex].classList.toggle("focus", true);
            mainInput.value = suggestionItems[nextIndex].querySelector(".text").textContent;
          }
        }
      }
    }
    // 13 回车
    if (keyCode === 13) {
      // 如果是命令类型
      if (searchKeywordType.value === 'command') {
        // 首先检查是否有聚焦的命令项
        const focusedCommand = document.querySelector(".command-result.focus");
        if (focusedCommand) {
          executeCommand(focusedCommand.dataset.command);
          return;
        }
        
        // 如果没有聚焦项，检查输入的命令是否完整匹配
        const commandResult = identifyCommand(mainInput.value);
        if (commandResult.type === 'command' && commandResult.command && !commandResult.isPartial) {
          executeCommand(mainInput.value);
          return;
        }
        
        // 如果是命令但不完整，不触发搜索，直接返回
        return;
      }
      
      // 非命令类型才触发搜索
      toSearch(mainInput.value, 1);
    }
  } catch (error) {
    $message.error("出现问题，请尝试重置程序");
    console.error("键盘事件出现错误：" + error);
  }
};

// 计算元素高度并改变
const changeSuggestionsHeights = () => {
  try {
    const allResultsHeight = allResultsRef.value?.offsetHeight;
    const specialallResultsHeight = specialallResultsRef.value?.offsetHeight;
    suggestionsHeights.value = (specialallResultsHeight || 0) + (allResultsHeight || 0);
  } catch (error) {
    console.error("计算高度时出现错误：" + error);
  }
};

// 触发父组件搜索事件
const toSearch = (val, type = 1) => {
  emit("toSearch", val, type);
};

// 监听搜索框变化
watch(
  () => props.keyWord,
  (val) => {
    if (set.showSuggestions) {
      // 清空结果
      searchSuggestionsData.value = [];
      // 判断类型
      const inputType = identifyInput(val);
      searchKeywordType.value = inputType;
      
      // 命令类型、command-partial类型、iframe 类型和 iframe-partial 类型立即执行，其他类型使用防抖
      if ((inputType === 'command' || inputType === 'command-partial' || inputType === 'iframe' || inputType === 'iframe-partial') && set.showOtherSuggestions) {
        keywordsSearch(val);
      } else if (inputType !== 'command' && inputType !== 'command-partial' && inputType !== 'iframe' && inputType !== 'iframe-partial' && (set.showSearchSuggestions || set.showOtherSuggestions)) {
        debouncedSearchSuggestions(val);
      }
    }
  },
);

// 暴露方法
defineExpose({ keyboardEvents, handleTabCompletion, openIframeViewer });
</script>

<style lang="scss" scoped>
.suggestions {
  position: absolute;
  top: -10px;
  left: 0;
  width: 100%;
  max-height: 45vh;
  overflow: hidden;
  color: var(--main-text-color);
  background-color: var(--main-background-light-color);
  backdrop-filter: blur(30px) saturate(1.25);
  border-radius: 16px;
  transition:
    height 0.2s ease,
    opacity 0.3s ease,
    transform 0.3s ease;
  z-index: 1;

  .all-result,
  .special-result {
    .s-result,
    .command-item {
      cursor: pointer;
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 6px 12px;
      font-size: 14px;
      transition:
        background-color 0.3s,
        padding-left 0.3s;
      .i-icon {
        opacity: 0.8;
        margin-right: 8px;
      }
      .text {
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .command-name {
        font-weight: 500;
        color: var(--main-color);
        margin-right: 8px;
      }
      .command-desc {
        opacity: 0.7;
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      // iframe 命令特殊样式
      &.iframe-result {
        .command-name {
          color: var(--main-color);
        }
        .command-desc {
          color: var(--main-text-color);
          opacity: 0.8;
        }
      }
      
      @media (min-width: 520px) {
        &:hover,
        &.focus {
          background-color: var(--main-background-light-color);
          padding-left: 18px;
        }
      }
      &:active {
        background-color: var(--main-background-light-color);
        padding-left: 18px;
      }
    }
  }
}
</style>

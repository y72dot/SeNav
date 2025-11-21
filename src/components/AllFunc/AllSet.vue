<template>
  <div class="all-set">
    <n-tabs class="set" size="large" justify-content="space-evenly" animated>
      <!-- 全局外观 -->
      <n-tab-pane name="appearance" tab="外观">
        <n-scrollbar class="scrollbar">
          <n-h6 prefix="bar"> 主题 </n-h6>
          <n-card class="set-item">
            <div class="name">
              <span class="title">主题类别</span>
              <span class="tip">切换全站主题类别</span>
            </div>
            <n-select class="set" v-model:value="themeType" :options="themeTypeOptions" />
          </n-card>
          
          <n-h6 prefix="bar"> 壁纸 </n-h6>
          <n-card class="set-item cover" :content-style="{ flexDirection: 'column', alignItems: 'flex-start' }">
            <div class="desc">
              <div class="name">
                <span class="title">壁纸偏好</span>
                <span class="tip"> 除默认以外的其他选项可能会导致页面载入缓慢 </span>
              </div>
              <n-space>
                <Transition name="fade" mode="out-in">
                  <n-button v-if="backgroundType !== 0 || backgroundLocal" strong secondary @click="resetWallpaper()">恢复默认</n-button>
                </Transition>
                <input ref="localImageInputRef" type="file" style="display: none" accept="image/*" @change="chooseLocalImage" />
                <n-button strong secondary @click="localImageInputRef?.click()">本地图片</n-button>
                <n-button strong secondary @click="customCoverModal = true">自定义</n-button>
              </n-space>
            </div>
            <n-grid class="cover-selete" responsive="screen" cols="2 s:3 m:4 l:4" :x-gap="16" :y-gap="16">
              <n-grid-item v-for="(item, index) in backgroundTypeArr" :key="index" :class="index === backgroundType ? 'item check' : 'item'" @click="changeBackground(index)">
                <span class="name" v-html="item.name" />
              </n-grid-item>
            </n-grid>
          </n-card>
          <n-card class="set-item">
            <div class="name">
              <span class="title">壁纸遮罩</span>
              <span class="tip">壁纸周围是否显示暗色遮罩</span>
            </div>
            <n-switch v-model:value="showBackgroundGray" :round="false" />
          </n-card>
          <n-card class="set-item">
            <div class="name">
              <span class="title">壁纸模糊</span>
              <span class="tip">调整壁纸高斯模糊的程度</span>
            </div>
            <n-slider class="set" v-model:value="backgroundBlur" :step="0.01" :min="0" :max="10" :tooltip="false" />
          </n-card>
        </n-scrollbar>
      </n-tab-pane>

      <!-- 搜索与建议 -->
      <n-tab-pane name="search" tab="搜索">
        <n-scrollbar class="scrollbar">
          <n-h6 prefix="bar"> 搜索引擎 </n-h6>
          <n-card class="set-item">
            <div class="name">
              <span class="title">当前搜索引擎：{{ set.searchEngine }}</span>
              <span class="tip">点击按钮快速切换或自定义</span>
            </div>
            <n-space>
              <n-button strong secondary @click="() => { status.setSiteStatus('focus'); windowManager.setSearchBoxFocused(true); windowManager.setWindowVisibleByType('engineSelector', true); status.setEngineChangeStatus(true); }">前往调整</n-button>
            </n-space>
          </n-card>

          

          <n-h6 prefix="bar"> 跳转方式 </n-h6>
          <n-card class="set-item">
            <div class="name">
              <span class="title">全站链接跳转方式</span>
            </div>
            <n-select class="set" v-model:value="urlJumpType" :options="urlJumpTypeOptions" />
          </n-card>

          <n-h6 prefix="bar"> 建议与联想 </n-h6>
          <n-card class="set-item">
            <div class="name">
              <span class="title">搜索建议总开关</span>
            </div>
            <n-switch v-model:value="showSuggestions" :round="false" />
          </n-card>
          <n-card class="set-item">
            <div class="name">
              <span class="title">搜索联想</span>
            </div>
            <n-switch v-model:value="showSearchSuggestions" :round="false" />
          </n-card>
          <n-card class="set-item">
            <div class="name">
              <span class="title">命令建议</span>
            </div>
            <n-switch v-model:value="showCommandSuggestions" :round="false" />
          </n-card>
          <n-card class="set-item">
            <div class="name">
              <span class="title">网页浮窗提示</span>
            </div>
            <n-switch v-model:value="showIframeSuggestions" :round="false" />
          </n-card>
          <n-card class="set-item">
            <div class="name">
              <span class="title">快捷翻译</span>
            </div>
            <n-switch v-model:value="showQuickTranslate" :round="false" />
          </n-card>
          <n-card class="set-item">
            <div class="name">
              <span class="title">直接访问</span>
            </div>
            <n-switch v-model:value="showDirectAccess" :round="false" />
          </n-card>
          <n-card class="set-item">
            <div class="name">
              <span class="title">捷径建议</span>
            </div>
            <n-switch v-model:value="showShortcutSuggestions" :round="false" />
          </n-card>
        </n-scrollbar>
      </n-tab-pane>

      <!-- 时间与天气 -->
      <n-tab-pane name="time" tab="时间天气">
        <n-scrollbar class="scrollbar">
          <n-h6 prefix="bar"> 天气与时间 </n-h6>
          <n-card class="set-item">
            <div class="name">
              <span class="title">天气显示</span>
              <span class="tip">是否在首页时间下展示天气</span>
            </div>
            <n-switch v-model:value="showWeather" :round="false" />
          </n-card>
          <n-card class="set-item">
            <div class="name">
              <span class="title">时钟样式</span>
              <span class="tip">选择一种时钟样式</span>
            </div>
            <n-select class="set" v-model:value="timeStyle" :options="timeStyleOptions" />
          </n-card>
          <n-card v-if="timeStyle === 'one'" class="set-item">
            <div class="name">
              <span class="title">时间显秒</span>
              <span class="tip">是否在分钟后面显示秒数</span>
            </div>
            <n-switch v-model:value="showSeconds" :round="false" />
          </n-card>
          <n-card class="set-item">
            <div class="name">
              <span class="title">时钟显零</span>
              <span class="tip">是否在时钟小于 10 时补 0</span>
            </div>
            <n-switch v-model:value="showZeroTime" :round="false" />
          </n-card>
          <n-card class="set-item">
            <div class="name">
              <span class="title">显示农历</span>
            </div>
            <n-switch v-model:value="showLunar" :round="false" />
          </n-card>
          <n-card class="set-item">
            <div class="name">
              <span class="title">12 小时制</span>
            </div>
            <n-switch v-model:value="use12HourFormat" :round="false" />
          </n-card>
        </n-scrollbar>
      </n-tab-pane>

      <!-- 搜索框行为 -->
      <n-tab-pane name="behavior" tab="搜索框">
        <n-scrollbar class="scrollbar">
          <n-h6 prefix="bar"> 搜索框行为 </n-h6>
          <n-card class="set-item">
            <div class="name">
              <span class="title">自动收缩</span>
              <span class="tip">是否在非搜索状态时收起搜索框</span>
            </div>
            <n-switch v-model:value="smallInput" :round="false" />
          </n-card>
          <n-card class="set-item">
            <div class="name">
              <span class="title">自动聚焦</span>
              <span class="tip">打开网站时自动聚焦搜索框</span>
            </div>
            <n-switch v-model:value="autoFocus" :round="false" />
          </n-card>
          <n-card class="set-item">
            <div class="name">
              <span class="title">自动失焦</span>
              <span class="tip">跳转搜索后搜索框自动失焦</span>
            </div>
            <n-switch v-model:value="autoInputBlur" :round="false" />
          </n-card>
        </n-scrollbar>
      </n-tab-pane>

      <!-- 备份与恢复、重置 -->
      <n-tab-pane name="other" tab="数据">
        <n-scrollbar class="scrollbar">
          <n-h6 prefix="bar"> 重置 </n-h6>
          <n-card class="set-item">
            <div class="name">
              <span class="title">站点重置</span>
              <span class="tip">若站点显示异常或出现问题时可尝试此操作</span>
            </div>
            <n-button strong secondary @click="resetSite"> 重置 </n-button>
          </n-card>
          <n-h6 prefix="bar"> 备份 </n-h6>
          <n-card class="set-item">
            <div class="name">
              <span class="title">站点备份</span>
              <span class="tip">将站点配置及个性化内容进行备份</span>
            </div>
            <n-button strong secondary @click="backupSite"> 备份 </n-button>
          </n-card>
          <n-h6 prefix="bar"> 恢复 </n-h6>
          <n-card class="set-item">
            <div class="name">
              <span class="title">数据恢复</span>
              <span class="tip">将备份的站点内容进行恢复</span>
            </div>
            <input ref="recoverRef" type="file" style="display: none" accept=".json" @change="recoverSite" />
            <n-button strong secondary @click="recoverRef?.click()"> 恢复 </n-button>
          </n-card>
        </n-scrollbar>
      </n-tab-pane>
    </n-tabs>
    <!-- 自定义壁纸 -->
    <n-modal preset="card" title="自定义壁纸" v-model:show="customCoverModal" :bordered="false">
      <n-form>
        <n-form-item label="自定义壁纸链接">
          <n-input
            clearable
            type="text"
            v-model:value="customCoverUrl"
            placeholder="请输入自定义壁纸链接"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button strong secondary @click="customCoverModal = false"> 取消 </n-button>
          <n-button strong secondary @click="setCustomCover"> 确认 </n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import {
  NH6,
  NTabs,
  NTabPane,
  NSpace,
  NCard,
  NSwitch,
  NSelect,
  NScrollbar,
  NButton,
  NGrid,
  NGridItem,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSlider,
} from "naive-ui";
import { storeToRefs } from "pinia";
import { setStore, statusStore } from "@/stores";
import { useWindowManagerStore } from "@/stores/windowManager";
import { backupSetData, recoverSetData } from "@/utils/settings/service";
import identifyInput from "@/utils/identifyInput";
import { saveImage, deleteImage } from "@/utils/idb";

const set = setStore();
const status = statusStore();
const windowManager = useWindowManagerStore();
  const {
    themeType,
    backgroundType,
    backgroundCustom,
    backgroundLocal,
    showBackgroundGray,
    backgroundBlur,
  smallInput,
  autoFocus,
  autoInputBlur,
  showLunar,
  showWeather,
  showSeconds,
  showZeroTime,
  use12HourFormat,
  showSuggestions,
  showSearchSuggestions,
  showCommandSuggestions,
  showIframeSuggestions,
  showQuickTranslate,
  showDirectAccess,
  showShortcutSuggestions,
  urlJumpType,
  timeStyle,
} = storeToRefs(set);
const recoverRef = ref(null);
const customCoverModal = ref(false);
const customCoverUrl = ref("");
const localImageInputRef = ref(null);

// 壁纸类别
const backgroundTypeArr = [
  { name: "本地默认", tip: "默认壁纸，随机更换" },
  { name: "每日必应", tip: "必应每日一图，每天更新" },
  { name: "随机风景", tip: "随机风景图，随机更换" },
  { name: "随机动漫", tip: "随机二次元图，随机更换" },
  { name: "随机风景2", tip: "备用风景API，随机更换" },
  { name: "随机二次元2", tip: "备用二次元API，随机更换" },
  { name: "本地图片", tip: "选择本地图片作为壁纸" },
  { name: "自定义壁纸", tip: "使用自定义链接的壁纸" },
];

// 主题类别
const themeTypeOptions = [
  {
    label: "浅色模式",
    value: "light",
  },
  {
    label: "深色模式",
    value: "dark",
  },
];

// 切换壁纸
const changeBackground = (type, reset = false) => {
  if (reset) {
    $dialog.warning({
      title: "壁纸恢复",
      content: "确认恢复默认壁纸？若当前为自定义壁纸，你的自定义壁纸将丢失！",
      positiveText: "恢复",
      negativeText: "取消",
      onPositiveClick: () => {
        backgroundType.value = 0;
        $message.info("已恢复为默认壁纸，刷新后生效");
      },
    });
    return true;
  }
  backgroundType.value = type;
  $message.success(`已切换为${backgroundTypeArr[type].name}，刷新后生效`);
};

// 链接跳转方式
const urlJumpTypeOptions = [
  {
    label: "新页面打开",
    value: "open",
  },
  {
    label: "当前页打开",
    value: "href",
  },
];

// 时钟样式
const timeStyleOptions = [
  {
    label: "横向排布",
    value: "one",
  },
  {
    label: "竖向排布",
    value: "two",
  },
];

// 自定义壁纸
const setCustomCover = () => {
  if (identifyInput(customCoverUrl.value) === "url") {
    backgroundType.value = 7;
    backgroundCustom.value = customCoverUrl.value;
    customCoverModal.value = false;
    $message.success("已切换为自定义壁纸，刷新后生效");
  } else {
    $message.error("请输入正确的网址");
  }
};

const resetWallpaper = () => {
  $dialog.warning({
    title: "壁纸恢复",
    content: "确认恢复默认壁纸并清除本地壁纸（如有）？若当前为自定义壁纸，你的自定义壁纸将丢失！",
    positiveText: "恢复",
    negativeText: "取消",
    onPositiveClick: () => {
      backgroundType.value = 0;
      clearLocalImage();
      $message.info("已恢复为默认壁纸，刷新后生效");
    },
  });
};

const chooseLocalImage = async (e) => {
  const file = e?.target?.files?.[0];
  if (!file) return;
  if (!file.type?.startsWith("image/")) {
    $message.error("请选择图片文件");
    return;
  }
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    $message.error("图片过大，建议 ≤50MB");
    return;
  }
  try {
    const id = await saveImage(file);
    backgroundLocal.value = id;
    backgroundType.value = 6;
    $message.success("已切换为本地图片，刷新后生效");
    if (localImageInputRef.value) localImageInputRef.value.value = null;
  } catch (err) {
    $message.error("保存图片失败，请重试");
  }
};

const clearLocalImage = () => {
  const id = backgroundLocal.value;
  backgroundLocal.value = "";
  if (id && !String(id).startsWith("data:")) {
    deleteImage(id).catch(() => {});
  }
  $message.info("已清除本地壁纸，刷新后生效");
};

// 站点重置
const resetSite = () => {
  $dialog.warning({
    title: "站点重置",
    content: "确认重置站点为默认状态？你的全部数据以及自定义设置都将丢失！",
    positiveText: "重置",
    negativeText: "取消",
    onPositiveClick: () => {
      localStorage.clear();
      $message.info("站点重置成功，即将刷新");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
  });
};

// 站点备份
const backupSite = () => {
  try {
    const date = new Date();
    const dateString = date.toISOString().replace(/[:.]/g, "-");
    const fileName = `SeNav_Backup_${dateString}.json`;
    // 采用统一备份格式（包含元信息），兼容旧恢复逻辑
    const jsonData = backupSetData(set.$state);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    // 备份完成
    $message.success("站点备份成功");
  } catch (error) {
    console.error("站点备份失败：", error);
    $message.error("站点备份失败");
  }
};

// 站点恢复
const recoverSite = async () => {
  try {
    const fileInput = recoverRef.value;
    if (!fileInput?.files.length) {
      $message.error("请选择要恢复的备份文件");
      return false;
    }
    const file = fileInput.files[0];
    const jsonData = await file.text();
    const data = JSON.parse(jsonData);
    // 恢复数据
    $dialog.warning({
      title: "站点恢复",
      content: "确认使用该恢复文件？你现有的数据以及自定义设置都将被覆盖！",
      positiveText: "恢复",
      negativeText: "取消",
      onPositiveClick: async () => {
        const result = recoverSetData(set, data);
        if (result.success) {
          $message.info("站点恢复成功，即将刷新");
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else {
          $message.error("站点数据恢复失败，请重试");
        }
      },
      onNegativeClick: () => {
        recoverRef.value.value = null;
      },
    });
  } catch (error) {
    console.error("站点数据恢复失败：", error);
    $message.error("站点数据恢复失败，请重试");
  }
};

onMounted(() => {
  // 检测是否存在自定义壁纸
  if (backgroundCustom.value) customCoverUrl.value = backgroundCustom.value;
});
</script>

<style lang="scss">
.cover-selete {
  margin-top: 12px;
  .item {
    cursor: pointer;
    position: relative;
    width: 100%;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    background-color: var(--main-background-light-color);
    transition:
      background-color 0.3s,
      box-shadow 0.3s;
    &.check {
      background-color: var(--main-background-hover-color);
      &::before {
        content: "";
        position: absolute;
        border-radius: 12px;
        top: -4px;
        left: -4px;
        right: -4px;
        bottom: -4px;
        border: 2px solid var(--main-background-hover-color);
        transition: opacity 0.3s;
      }
    }
    &:hover {
      background-color: var(--main-background-hover-color);
      box-shadow: 0 0 0px 2px var(--main-background-hover-color);
      &::before {
        opacity: 0;
      }
    }
    &:active {
      box-shadow: none;
    }
  }
}
</style>

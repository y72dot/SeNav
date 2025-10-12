<template>
  <Transition name="blur-overlay">
    <div 
      v-if="visible" 
      class="blur-overlay"
      :style="{ zIndex: blurOverlayZIndex }"
      @click.stop="handleClick"
    >
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { statusStore } from '@/stores'
import { useWindowManagerStore } from '@/stores/windowManager'

const status = statusStore()
const windowManager = useWindowManagerStore()

// 当搜索框聚焦时显示虚化遮罩
const visible = computed(() => status.siteStatus === 'focus')

// 计算虚化遮罩的z-index，应该在浮动窗口之上但在搜索框之下
const blurOverlayZIndex = computed(() => {
  if (status.siteStatus === 'focus') {
    // 搜索框聚焦时，虚化遮罩应该在所有窗口之上但在搜索框之下
    // 搜索框的z-index是 maxZIndex + 1，搜索组件是 maxZIndex + 2
    // 所以虚化遮罩应该是 maxZIndex（与最高窗口同级，但通过DOM顺序在其上方）
    return windowManager.maxZIndex
  }
  return 999 // 默认值，确保在大部分内容上方
})

// 点击遮罩时失焦搜索框
const handleClick = () => {
  status.setSearchInputValue("");
  status.setSiteStatus('normal');
  
  // 确保搜索框失焦
  const searchInput = document.getElementById("main-input");
  searchInput?.blur();
  
  // 同步窗口管理器状态，避免维持搜索组件的前置层级
  windowManager.setSearchBoxFocused(false);
  
  // 确保main元素获得焦点
  const mainElement = document.getElementById("main");
  mainElement?.focus();
}
</script>

<style lang="scss" scoped>
.blur-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(8px) saturate(1.2);
  pointer-events: auto;
  cursor: pointer;
}

// 虚化遮罩的进入和离开动画
.blur-overlay-enter-active,
.blur-overlay-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.blur-overlay-enter-from,
.blur-overlay-leave-to {
  opacity: 0;
  backdrop-filter: blur(0px) saturate(1);
}

.blur-overlay-enter-to,
.blur-overlay-leave-from {
  opacity: 1;
  backdrop-filter: blur(8px) saturate(1.2);
}
</style>
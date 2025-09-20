<template>
  <div
    v-if="visible"
    class="iframe-viewer-overlay"
    @click.self="closeViewer"
  >
    <div
      ref="iframeContainer"
      class="iframe-container"
      :style="containerStyle"
      @mousedown="startDrag"
    >
      <!-- 标题栏 -->
      <div class="iframe-header" @mousedown="startDrag">
        <div class="iframe-title">
          <svg-icon name="link" />
          <span>{{ displayUrl }}</span>
        </div>
        <div class="iframe-controls">
          <button class="control-btn" @click="toggleFullscreen" title="全屏">
            <svg-icon :name="isFullscreen ? 'compress' : 'expand'" />
          </button>
          <button class="control-btn" @click="closeViewer" title="关闭">
            <svg-icon name="close" />
          </button>
        </div>
      </div>

      <!-- iframe 内容 -->
      <div class="iframe-content">
        <iframe
          :src="url"
          frameborder="0"
          allowfullscreen
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        ></iframe>
      </div>

      <!-- 缩放控制点 -->
      <div
        v-if="!isFullscreen"
        class="resize-handle resize-handle-se"
        @mousedown="startResize"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import SvgIcon from './SvgIcon.vue'

const props = defineProps({
  url: {
    type: String,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

// 组件状态
const iframeContainer = ref(null)
const isFullscreen = ref(false)
const isDragging = ref(false)
const isResizing = ref(false)

// 位置和尺寸状态
const position = ref({ x: 100, y: 100 })
const size = ref({ width: 800, height: 600 })
const dragStart = ref({ x: 0, y: 0 })
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })

// 计算属性
const displayUrl = computed(() => {
  try {
    const urlObj = new URL(props.url)
    return urlObj.hostname
  } catch {
    return props.url
  }
})

const containerStyle = computed(() => {
  if (isFullscreen.value) {
    return {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100vw',
      height: '100vh',
      zIndex: 9999
    }
  }
  
  return {
    position: 'fixed',
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    width: `${size.value.width}px`,
    height: `${size.value.height}px`,
    zIndex: 1000
  }
})

// 拖动功能
const startDrag = (e) => {
  if (isFullscreen.value || e.target.closest('.iframe-controls')) return
  
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
  
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  e.preventDefault()
}

const handleDrag = (e) => {
  if (!isDragging.value) return
  
  position.value = {
    x: Math.max(0, Math.min(window.innerWidth - size.value.width, e.clientX - dragStart.value.x)),
    y: Math.max(0, Math.min(window.innerHeight - size.value.height, e.clientY - dragStart.value.y))
  }
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// 缩放功能
const startResize = (e) => {
  isResizing.value = true
  resizeStart.value = {
    x: e.clientX,
    y: e.clientY,
    width: size.value.width,
    height: size.value.height
  }
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  e.preventDefault()
  e.stopPropagation()
}

const handleResize = (e) => {
  if (!isResizing.value) return
  
  const deltaX = e.clientX - resizeStart.value.x
  const deltaY = e.clientY - resizeStart.value.y
  
  size.value = {
    width: Math.max(300, Math.min(window.innerWidth - position.value.x, resizeStart.value.width + deltaX)),
    height: Math.max(200, Math.min(window.innerHeight - position.value.y, resizeStart.value.height + deltaY))
  }
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// 全屏切换
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
}

// 关闭查看器
const closeViewer = () => {
  emit('close')
}

// 键盘事件处理
const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    if (isFullscreen.value) {
      isFullscreen.value = false
    } else {
      closeViewer()
    }
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  
  // 居中显示
  position.value = {
    x: (window.innerWidth - size.value.width) / 2,
    y: (window.innerHeight - size.value.height) / 2
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})
</script>

<style lang="scss" scoped>
.iframe-viewer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.iframe-container {
  background: var(--main-background-color);
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-width: 300px;
  min-height: 200px;
  border: 1px solid var(--main-border-color);
  
  &:hover .resize-handle {
    opacity: 1;
  }
}

.iframe-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--main-background-light-color);
  border-bottom: 1px solid var(--main-border-color);
  cursor: move;
  user-select: none;
  
  .iframe-title {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--main-text-color);
    font-size: 14px;
    font-weight: 500;
    
    svg {
      width: 16px;
      height: 16px;
      opacity: 0.7;
    }
    
    span {
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
  
  .iframe-controls {
    display: flex;
    gap: 4px;
    
    .control-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--main-text-color);
      transition: all 0.2s ease;
      
      &:hover {
        background: var(--main-background-color);
        color: var(--main-text-color);
      }
      
      svg {
        width: 14px;
        height: 14px;
      }
    }
  }
}

.iframe-content {
  flex: 1;
  position: relative;
  
  iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }
}

.resize-handle {
  position: absolute;
  background: var(--main-text-color);
  opacity: 0;
  transition: opacity 0.2s ease;
  
  &.resize-handle-se {
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    cursor: se-resize;
    border-radius: 12px 0 12px 0;
    
    &::before {
      content: '';
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 8px;
      height: 8px;
      background: linear-gradient(
        -45deg,
        transparent 30%,
        currentColor 30%,
        currentColor 40%,
        transparent 40%,
        transparent 60%,
        currentColor 60%,
        currentColor 70%,
        transparent 70%
      );
    }
  }
}

// 全屏模式样式
.iframe-container:has(.iframe-header .control-btn:first-child svg[name="compress"]) {
  .iframe-header {
    cursor: default;
  }
}

// 响应式设计
@media (max-width: 768px) {
  .iframe-container {
    width: 95vw !important;
    height: 90vh !important;
    left: 2.5vw !important;
    top: 5vh !important;
  }
  
  .iframe-header .iframe-title span {
    max-width: 200px;
  }
}
</style>
<template>
  <div
    v-if="visible"
    class="floating-window-overlay"
    :style="{ zIndex: currentZIndex }"
    @click.self="handleOverlayClick"
  >
    <div
      ref="windowContainer"
      class="floating-window-container"
      :style="containerStyle"
      :class="{ 'no-drag': isDragging || isResizing || isZooming }"
      @mouseenter="showControls = true"
      @mouseleave="showControls = false"
      @mousedown="bringToFront"
    >
      <!-- 胶囊状态的拖拽区域 -->
      <div 
        v-show="isMinimized"
        class="capsule-drag-area"
        @mousedown="startDrag"
        @dblclick="expandWindow"
        title="拖拽移动 | 双击展开"
      >
        <div class="capsule-content">
          <div class="capsule-text-container">
            <span class="capsule-text">{{ displayTitle }}</span>
          </div>
        </div>
      </div>

      <!-- 最小化按钮（左上角） - 拖动移动，双击最小化 -->
      <button 
        v-show="!isMinimized"
        class="minimize-btn"
        :class="{ 'visible': showControls }"
        @mousedown="startMinimizeDrag"
        @dblclick="minimizeWindow"
        :title="'拖动移动窗口 | 双击最小化'"
      >
      </button>

      <!-- 关闭按钮（右上角） -->
      <button 
        v-show="showCloseButton && !isMinimized"
        class="close-btn"
        :class="{ 'visible': showControls }"
        @click="handleClose"
        title="关闭窗口"
      >
      </button>

      <!-- 调整大小手柄（右下角） -->
      <div
        v-show="!isMinimized"
        class="resize-handle"
        :class="{ 'visible': showControls }"
        @mousedown="startResize"
        title="拖拽调整窗口大小"
      >
      </div>

      <!-- 缩放控制按钮（左下角） -->
      <button 
        v-show="!isMinimized"
        class="zoom-btn"
        :class="{ 'visible': showControls }"
        @mousedown="startZoomDrag"
        @dblclick="resetZoom"
        :title="`页面缩放: ${Math.round(zoomLevel * 100)}% - 拖拽调整，双击重置`"
      >
      </button>

      <!-- 窗口内容区域 -->
      <div 
        v-show="!isMinimized"
        class="window-content" 
        :class="contentClass" 
        :style="contentStyle"
      >
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useTitleDetection } from '@/utils/titleDetection'
import { windowManagerStore } from '@/stores/index'

const props = defineProps({
  // 显示状态
  visible: {
    type: Boolean,
    default: false
  },
  // 窗口标题
  title: {
    type: String,
    default: ''
  },
  // 窗口副标题
  subtitle: {
    type: String,
    default: ''
  },
  // 是否自动识别标题和副标题
  autoDetectTitle: {
    type: Boolean,
    default: true
  },
  // 初始宽度
  width: {
    type: Number,
    default: 900
  },
  // 初始高度
  height: {
    type: Number,
    default: 600
  },
  // 最小宽度
  minWidth: {
    type: Number,
    default: 300
  },
  // 最小高度
  minHeight: {
    type: Number,
    default: 200
  },
  // 是否显示关闭按钮
  showCloseButton: {
    type: Boolean,
    default: true
  },
  // 是否可拖拽
  draggable: {
    type: Boolean,
    default: true
  },
  // 点击遮罩是否关闭
  closeOnOverlay: {
    type: Boolean,
    default: true
  },
  // 按Escape键是否关闭
  closeOnEscape: {
    type: Boolean,
    default: true
  },
  // 内容区域的自定义类名
  contentClass: {
    type: String,
    default: ''
  },
  // 初始位置
  initialPosition: {
    type: Object,
    default: () => ({ x: null, y: null })
  },
  // 窗口类型 (用于窗口管理)
  windowType: {
    type: String,
    default: 'default'
  },
  // 窗口数据 (用于窗口管理)
  windowData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'drag-start', 'drag-end', 'resize-start', 'resize-end', 'pin-change', 'zoom-change'])

// 窗口管理store
const windowManager = windowManagerStore()

// 组件状态
const windowContainer = ref(null)
const isDragging = ref(false)
const isResizing = ref(false)
const isZooming = ref(false)
const showControls = ref(false)
const isMinimized = ref(false) // 最小化状态

// 窗口唯一标识
const windowId = ref(null)

// 创建一个响应式的 z-index 计算属性
const currentZIndex = computed(() => {
  if (!windowId.value) return 999
  const window = windowManager.windows.get(windowId.value)
  return window ? window.zIndex : 999
})

// 使用标题检测composable
const {
  detectedTitle,
  detectedSubtitle,
  capsuleWidth,
  displayTitle,
  displaySubtitle,
  detectTitleAndSubtitle,
  updateCapsuleWidth,
  setupIframeListeners
} = useTitleDetection({
  autoDetect: computed(() => props.autoDetectTitle),
  defaultTitle: '窗口',
  enableIframeDetection: true,
  capsuleConfig: {
    baseWidth: 120,
    charWidth: 8,
    maxWidth: 300
  }
})

// 位置和尺寸状态
const position = ref({ x: 100, y: 100 })
const size = ref({ width: props.width, height: props.height })
const originalSize = ref({ width: props.width, height: props.height }) // 保存原始尺寸
const dragStart = ref({ x: 0, y: 0 })
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })
const zoomStart = ref({ x: 0, y: 0 })
const zoomLevel = ref(1) // 缩放级别，1为100%
const initialZoomLevel = ref(1) // 拖拽开始时的缩放级别

// 计算当前实际显示的窗口尺寸
const currentDisplaySize = computed(() => {
  return {
    width: isMinimized.value ? capsuleWidth.value : size.value.width,
    height: isMinimized.value ? 40 : size.value.height
  }
})

// 计算样式
const containerStyle = computed(() => {
  return {
    position: 'fixed',
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    width: `${currentDisplaySize.value.width}px`,
    height: `${currentDisplaySize.value.height}px`,
    zIndex: currentZIndex.value,
    borderRadius: isMinimized.value ? '20px' : '12px',
    overflow: 'hidden'
  }
})

// iframe内容缩放样式
const contentStyle = computed(() => {
  return {
    transform: `scale(${zoomLevel.value})`,
    transformOrigin: 'top left',
    width: `${100 / zoomLevel.value}%`,
    height: `${100 / zoomLevel.value}%`
  }
})

// 拖动功能
const startDrag = (e) => {
  if (!props.draggable) return
  
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
  
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  e.preventDefault()
  
  emit('drag-start')
}

// 最小化按钮拖动功能
const startMinimizeDrag = (e) => {
  if (!props.draggable) return
  
  isDragging.value = true
  dragStart.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y
  }
  
  document.addEventListener('mousemove', handleDrag)
  document.addEventListener('mouseup', stopDrag)
  e.preventDefault()
  
  emit('drag-start')
}

const handleDrag = (e) => {
  if (!isDragging.value) return
  
  const newX = e.clientX - dragStart.value.x
  const newY = e.clientY - dragStart.value.y
  
  // 限制窗口不超出屏幕边界，使用当前实际显示的尺寸
  position.value = {
    x: Math.max(0, Math.min(window.innerWidth - currentDisplaySize.value.width, newX)),
    y: Math.max(0, Math.min(window.innerHeight - currentDisplaySize.value.height, newY))
  }
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  
  emit('drag-end')
}

// 调整大小功能
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
  
  emit('resize-start')
}

const handleResize = (e) => {
  if (!isResizing.value) return
  
  const deltaX = e.clientX - resizeStart.value.x
  const deltaY = e.clientY - resizeStart.value.y
  
  const newWidth = Math.max(props.minWidth, resizeStart.value.width + deltaX)
  const newHeight = Math.max(props.minHeight, resizeStart.value.height + deltaY)
  
  // 限制窗口不超出屏幕边界
  const maxWidth = window.innerWidth - position.value.x
  const maxHeight = window.innerHeight - position.value.y
  
  size.value = {
    width: Math.min(newWidth, maxWidth),
    height: Math.min(newHeight, maxHeight)
  }
}

const stopResize = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  
  emit('resize-end')
}

// 置顶切换功能
const togglePin = () => {
  isPinned.value = !isPinned.value
  emit('pin-change', isPinned.value)
}

// 最小化功能
const minimizeWindow = () => {
  if (!isMinimized.value) {
    // 保存当前尺寸
    originalSize.value = { ...size.value }
    isMinimized.value = true
    // 最小化窗口时更新状态
    if (windowId.value) {
      windowManager.updateWindow(windowId.value, { minimized: true })
    }
    emit('minimize', true)
  }
}

// 展开功能
const expandWindow = () => {
  if (isMinimized.value) {
    // 恢复原始尺寸
    size.value = { ...originalSize.value }
    isMinimized.value = false
    
    // 检查恢复后的窗口是否超出屏幕边界，如果超出则调整位置
    const maxX = window.innerWidth - size.value.width
    const maxY = window.innerHeight - size.value.height
    
    if (position.value.x > maxX || position.value.y > maxY) {
      position.value = {
        x: Math.max(0, Math.min(position.value.x, maxX)),
        y: Math.max(0, Math.min(position.value.y, maxY))
      }
    }
    
    // 展开窗口时更新状态并置于最前面
    if (windowId.value) {
      windowManager.updateWindow(windowId.value, { minimized: false })
      windowManager.bringToFront(windowId.value)
    }
    
    emit('minimize', false)
  }
}

// 缩放拖拽功能
const startZoomDrag = (e) => {
  // 防止双击事件触发
  if (e.detail === 2) return
  
  isZooming.value = true
  initialZoomLevel.value = zoomLevel.value // 保存当前缩放级别
  zoomStart.value = {
    x: e.clientX,
    y: e.clientY
  }
  
  document.addEventListener('mousemove', handleZoomDrag)
  document.addEventListener('mouseup', stopZoomDrag)
  e.preventDefault()
  e.stopPropagation()
}

const handleZoomDrag = (e) => {
  if (!isZooming.value) return
  
  const deltaX = e.clientX - zoomStart.value.x
  const deltaY = e.clientY - zoomStart.value.y
  
  // 计算缩放变化：向右上拖拽增大缩放，向左下拖拽减小缩放
  const zoomDelta = (deltaX - deltaY) * 0.002
  const newZoom = Math.max(0.25, Math.min(3, initialZoomLevel.value + zoomDelta))
  
  zoomLevel.value = newZoom
  emit('zoom-change', newZoom)
}

const stopZoomDrag = () => {
  isZooming.value = false
  document.removeEventListener('mousemove', handleZoomDrag)
  document.removeEventListener('mouseup', stopZoomDrag)
}

// 重置缩放
const resetZoom = () => {
  zoomLevel.value = 1
  emit('zoom-change', 1)
}

// 关闭窗口
const handleClose = () => {
  emit('close')
}

// 遮罩点击处理
const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    handleClose()
  }
}

// 键盘事件处理
const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.closeOnEscape) {
    // 检查当前窗口是否是聚焦窗口（z-index最高的窗口）
    const topWindow = windowManager.topWindow
    if (topWindow && topWindow.id === windowId.value) {
      console.log(`🎯 ESC键关闭聚焦窗口: ${windowId.value}`)
      handleClose()
    } else {
      console.log(`🎯 ESC键忽略，当前窗口不是聚焦窗口: ${windowId.value}`)
    }
  }
}

// 将窗口置于最前面
const bringToFront = (event) => {
  // 如果是拖拽、调整大小或缩放操作，不触发置顶
  if (isDragging.value || isResizing.value || isZooming.value) {
    return
  }
  
  if (windowId.value) {
    windowManager.bringToFront(windowId.value)
  }
}

// 居中窗口
const centerWindow = () => {
  const { x, y } = props.initialPosition
  
  if (x !== null && y !== null) {
    position.value = { x, y }
  } else {
    position.value = {
      x: Math.max(0, (window.innerWidth - currentDisplaySize.value.width) / 2),
      y: Math.max(0, (window.innerHeight - currentDisplaySize.value.height) / 2)
    }
  }
}

// 更新窗口尺寸
const updateSize = () => {
  size.value = {
    width: Math.max(props.minWidth, props.width),
    height: Math.max(props.minHeight, props.height)
  }
}

// 监听props变化
watch([() => props.width, () => props.height], () => {
  updateSize()
  centerWindow()
})

watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    updateSize()
    centerWindow()
    // 窗口显示时自动置于最前面
    if (windowId.value) {
      windowManager.bringToFront(windowId.value)
      windowManager.updateWindow(windowId.value, { visible: true })
    }
    // 延迟执行自动识别，确保DOM已渲染
    setTimeout(() => {
      const slotContent = windowContainer.value?.querySelector('.window-content')
      if (slotContent) {
        detectTitleAndSubtitle(slotContent, props.title, props.subtitle)
        // 设置iframe监听器
        setupIframeListeners(slotContent)
      }
    }, 100)
  } else {
    // 窗口隐藏时更新状态
    if (windowId.value) {
      windowManager.updateWindow(windowId.value, { visible: false })
    }
  }
})

// 监听标题和副标题变化
watch([() => props.title, () => props.subtitle], () => {
  const slotContent = windowContainer.value?.querySelector('.window-content')
  if (slotContent) {
    detectTitleAndSubtitle(slotContent, props.title, props.subtitle)
  }
})

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  updateSize()
  centerWindow()
  
  // 注册窗口到管理器
  windowId.value = windowManager.registerWindow({
    type: props.windowType,
    title: props.title || '窗口',
    data: props.windowData,
    visible: props.visible,
    minimized: isMinimized.value
  })
  
  // 初始化时执行自动识别
  setTimeout(() => {
    const slotContent = windowContainer.value?.querySelector('.window-content')
    if (slotContent) {
      detectTitleAndSubtitle(slotContent, props.title, props.subtitle)
      // 设置iframe监听器
      setupIframeListeners(slotContent)
    }
  }, 100)
})

onUnmounted(() => {
  // 从管理器中注销窗口
  if (windowId.value) {
    windowManager.unregisterWindow(windowId.value)
  }
  
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('mousemove', handleDrag)
  document.removeEventListener('mouseup', stopDrag)
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('mousemove', handleZoomDrag)
  document.removeEventListener('mouseup', stopZoomDrag)
})
</script>

<style lang="scss" scoped>
.floating-window-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; // 允许点击穿透到主界面
}

.floating-window-container {
  background-color: var(--main-background-color);
  border-radius: 16px;
  box-shadow: var(--main-box-shadow);
  overflow: hidden;
  position: relative;
  backdrop-filter: blur(20px);
  transition: transform 0.2s ease;
  pointer-events: auto; // 恢复窗口本身的交互能力
  
  &.no-drag {
    user-select: none;
    
    .window-content {
      pointer-events: none;
    }
  }
}

// 按钮基础样式
%button-base {
  position: absolute;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 10;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  
  // 统一的背景样式
  background: rgba(100, 100, 100, 0.8);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  
  &.visible {
    opacity: 0.3;
    transform: scale(1);
  }
  
  &:hover {
    transform: scale(1.1);
    background: rgba(120, 120, 120, 0.9);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
    opacity: 0.8;
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  @media (prefers-color-scheme: dark) {
    background: rgba(60, 60, 60, 0.8);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    
    &:hover {
      background: rgba(80, 80, 80, 0.9);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
      opacity: 0.8;
    }
  }
}

// 置顶切换按钮（左上角）
.minimize-btn {
  @extend %button-base;
  top: -16px;
  left: -16px;
  background-color: var(--main-background-hover-color);
  
  &:hover {
    background-color: var(--main-background-hover-color);
    opacity: 0.8;
  }
}

// 关闭按钮（右上角）
.close-btn {
  @extend %button-base;
  top: -16px;
  right: -16px;
  background-color: var(--main-background-hover-color);
  
  &:hover {
    background-color: #ff5f57;
  }
}

// 调整大小手柄（右下角）
.resize-handle {
  // 保持统一的按钮基础样式与位置
  @extend %button-base;
  bottom: -16px;
  right: -16px;
  cursor: nw-resize;
  background-color: var(--main-background-hover-color);
  // 移除固定不透明度，统一交由 %button-base 与 .visible 控制
  // opacity: 0.6;
  // transition: opacity 0.2s ease;
  
  &:hover {
    // 与其他按钮保持一致的 hover 颜色与透明度
    background-color: var(--main-background-hover-color);
    opacity: 0.8;
  }
}

// 缩放控制按钮（左下角）
.zoom-btn {
  @extend %button-base;
  bottom: -16px;
  left: -16px;
  background-color: var(--main-background-hover-color);
  
  &:hover {
    background-color: var(--main-background-hover-color);
    opacity: 0.8;
    
    .zoom-indicator {
      opacity: 1;
      transform: translateY(-40px) scale(1);
    }
  }
  
  .zoom-indicator {
    position: absolute;
    top: -35px;
    left: 50%;
    transform: translateX(-50%) translateY(-10px) scale(0.8);
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
    opacity: 0;
    transition: all 0.2s ease;
    pointer-events: none;
    
    &::after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      transform: translateX(-50%);
      border: 4px solid transparent;
      border-top-color: rgba(0, 0, 0, 0.8);
    }
    
    @media (prefers-color-scheme: dark) {
      background: rgba(255, 255, 255, 0.9);
      color: black;
      
      &::after {
        border-top-color: rgba(255, 255, 255, 0.9);
      }
    }
  }
}

// 胶囊状态的拖拽区域
.capsule-drag-area {
  width: 100%;
  height: 100%;
  background-color: var(--main-background-light-color);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: var(--main-box-shadow);
  position: relative;
  
  &:hover {
    background-color: var(--main-background-hover-color);
    box-shadow: var(--main-box-shadow);
    transform: scale(1.02);
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &::before {
    /* 已移除顶部指示条伪元素样式 */
  }
  
  &:hover::before {
    /* 已禁用 hover 时的伪元素显示 */
  }
}

.capsule-content {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--main-text-color);
  font-size: 12px;
  font-weight: 500;
}

.capsule-text-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  flex: 1;
}

.capsule-text {
  font-size: 11px;
  opacity: 0.8;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

// 窗口内容区域
.window-content {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 0;
  overflow: hidden;
}

// 响应式设计
@media (max-width: 768px) {
  .floating-window-container {
    width: 95vw !important;
    height: 85vh !important;
    left: 2.5vw !important;
    top: 7.5vh !important;
    min-width: 320px;
    min-height: 400px;
  }
  
  .close-btn,
  .resize-handle,
  .minimize-btn,
  .zoom-btn {
    width: 36px;
    height: 36px;
  }
}

@media (max-width: 480px) {
  .floating-window-container {
    width: 100vw !important;
    height: 100vh !important;
    left: 0 !important;
    top: 0 !important;
    border-radius: 0;
    
    .window-content {
      border-radius: 0;
    }
  }
  
  .close-btn {
    top: -18px;
    right: -18px;
    width: 40px;
    height: 40px;
  }
  
  .minimize-btn {
    top: -18px;
    left: -18px;
    width: 40px;
    height: 40px;
  }
  
  .resize-handle {
    bottom: -18px;
    right: -18px;
    width: 40px;
    height: 40px;
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
  
  .zoom-btn {
    bottom: -18px;
    left: -18px;
    width: 40px;
    height: 40px;
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
}
</style>
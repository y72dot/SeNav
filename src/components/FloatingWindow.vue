<template>
  <div
    v-if="visible"
    class="floating-window-overlay"
    @click.self="handleOverlayClick"
  >
    <div
      ref="windowContainer"
      class="floating-window-container"
      :style="containerStyle"
      :class="{ 'no-drag': isDragging || isResizing || isZooming }"
      @mouseenter="showControls = true"
      @mouseleave="showControls = false"
    >
      <!-- 拖拽区域（顶部边缘） -->
      <div 
        v-show="!isMinimized"
        class="drag-handle"
        :class="{ 'visible': showControls }"
        @mousedown="startDrag"
        title="按住拖拽移动窗口"
      >
        <div class="drag-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <!-- 胶囊状态的拖拽区域 -->
      <div 
        v-show="isMinimized"
        class="capsule-drag-area"
        @mousedown="startDrag"
        @dblclick="expandWindow"
        title="拖拽移动 | 双击展开"
      >
        <div class="capsule-content">
          <div class="capsule-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
            </svg>
          </div>
          <span class="capsule-text">窗口</span>
        </div>
      </div>

      <!-- 最小化按钮（左上角） -->
      <button 
        v-show="!isMinimized"
        class="minimize-btn"
        :class="{ 'visible': showControls }"
        @click="minimizeWindow"
        @dblclick="expandWindow"
        :title="'最小化窗口'"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      <!-- 关闭按钮（右上角） -->
      <button 
        v-show="showCloseButton && !isMinimized"
        class="close-btn"
        :class="{ 'visible': showControls }"
        @click="handleClose"
        title="关闭窗口"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>

      <!-- 调整大小手柄（右下角） -->
      <div
        v-show="!isMinimized"
        class="resize-handle"
        :class="{ 'visible': showControls }"
        @mousedown="startResize"
        title="拖拽调整窗口大小"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15l-6 6m0-6l6 6m-6-6v6m6-6h-6"/>
        </svg>
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
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="M21 21l-4.35-4.35"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
          <line x1="11" y1="8" x2="11" y2="14"/>
        </svg>
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
  }
})

const emit = defineEmits(['close', 'drag-start', 'drag-end', 'resize-start', 'resize-end', 'pin-change', 'zoom-change'])

// 组件状态
const windowContainer = ref(null)
const isDragging = ref(false)
const isResizing = ref(false)
const isZooming = ref(false)
const showControls = ref(false)
const isMinimized = ref(false) // 最小化状态

// 位置和尺寸状态
const position = ref({ x: 100, y: 100 })
const size = ref({ width: props.width, height: props.height })
const originalSize = ref({ width: props.width, height: props.height }) // 保存原始尺寸
const dragStart = ref({ x: 0, y: 0 })
const resizeStart = ref({ x: 0, y: 0, width: 0, height: 0 })
const zoomStart = ref({ x: 0, y: 0 })
const zoomLevel = ref(1) // 缩放级别，1为100%
const initialZoomLevel = ref(1) // 拖拽开始时的缩放级别

// 计算样式
const containerStyle = computed(() => {
  return {
    position: 'fixed',
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    width: isMinimized.value ? '120px' : `${size.value.width}px`,
    height: isMinimized.value ? '40px' : `${size.value.height}px`,
    zIndex: 999,
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

const handleDrag = (e) => {
  if (!isDragging.value) return
  
  const newX = e.clientX - dragStart.value.x
  const newY = e.clientY - dragStart.value.y
  
  // 限制窗口不超出屏幕边界
  position.value = {
    x: Math.max(0, Math.min(window.innerWidth - size.value.width, newX)),
    y: Math.max(0, Math.min(window.innerHeight - size.value.height, newY))
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
    emit('minimize', true)
  }
}

// 展开功能
const expandWindow = () => {
  if (isMinimized.value) {
    // 恢复原始尺寸
    size.value = { ...originalSize.value }
    isMinimized.value = false
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
    handleClose()
  }
}

// 居中窗口
const centerWindow = () => {
  const { x, y } = props.initialPosition
  
  if (x !== null && y !== null) {
    position.value = { x, y }
  } else {
    position.value = {
      x: Math.max(0, (window.innerWidth - size.value.width) / 2),
      y: Math.max(0, (window.innerHeight - size.value.height) / 2)
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
  }
})

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  updateSize()
  centerWindow()
})

onUnmounted(() => {
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
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none; // 允许点击穿透到主界面
}

.floating-window-container {
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.1);
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
  
  // 暗色主题适配
  @media (prefers-color-scheme: dark) {
    background: rgba(30, 30, 30, 0.95);
    box-shadow: 
      0 25px 50px rgba(0, 0, 0, 0.5),
      0 0 0 1px rgba(255, 255, 255, 0.1);
  }
}

// 拖拽手柄（顶部边缘）
.drag-handle {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 6px;
  cursor: move;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.3s ease;
  
  &.visible {
    opacity: 1;
  }
  
  &:hover {
    height: 8px;
    
    .drag-indicator span {
      background: rgba(0, 0, 0, 0.6);
      
      @media (prefers-color-scheme: dark) {
        background: rgba(255, 255, 255, 0.8);
      }
    }
  }
  
  .drag-indicator {
    display: flex;
    gap: 4px;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-radius: 0 0 8px 8px;
    background: rgba(0, 0, 0, 0.05);
    
    @media (prefers-color-scheme: dark) {
      background: rgba(255, 255, 255, 0.1);
    }
    
    span {
      width: 12px;
      height: 2px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 1px;
      transition: all 0.2s ease;
      
      @media (prefers-color-scheme: dark) {
        background: rgba(255, 255, 255, 0.5);
      }
    }
  }
}

// 置顶切换按钮（左上角）
.minimize-btn {
  position: absolute;
  top: -16px;
  left: -16px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(52, 152, 219, 0.9);
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
  box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
  
  &.visible {
    opacity: 1;
    transform: scale(1);
  }
  
  &:hover {
    background: rgba(52, 152, 219, 1);
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(52, 152, 219, 0.4);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    width: 14px;
    height: 14px;
    stroke-width: 2;
  }
  
  @media (prefers-color-scheme: dark) {
    background: rgba(74, 144, 226, 0.9);
    box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
    
    &:hover {
      background: rgba(74, 144, 226, 1);
      box-shadow: 0 6px 20px rgba(74, 144, 226, 0.4);
    }
  }
}

// 关闭按钮（右上角）
.close-btn {
  position: absolute;
  top: -16px;
  right: -16px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 59, 48, 0.9);
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
  box-shadow: 0 4px 12px rgba(255, 59, 48, 0.3);
  
  &.visible {
    opacity: 1;
    transform: scale(1);
  }
  
  &:hover {
    background: rgba(255, 59, 48, 1);
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(255, 59, 48, 0.4);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    width: 14px;
    height: 14px;
    stroke-width: 2.5;
  }
  
  @media (prefers-color-scheme: dark) {
    background: rgba(255, 69, 58, 0.9);
    box-shadow: 0 4px 12px rgba(255, 69, 58, 0.3);
    
    &:hover {
      background: rgba(255, 69, 58, 1);
      box-shadow: 0 6px 20px rgba(255, 69, 58, 0.4);
    }
  }
}

// 调整大小手柄（右下角）
.resize-handle {
  position: absolute;
  bottom: -16px;
  right: -16px;
  width: 32px;
  height: 32px;
  cursor: nw-resize;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 122, 255, 0.9);
  border-radius: 50%;
  color: white;
  opacity: 0;
  transform: scale(0.8);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  
  &.visible {
    opacity: 1;
    transform: scale(1);
  }
  
  &:hover {
    background: rgba(0, 122, 255, 1);
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(0, 122, 255, 0.4);
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    width: 14px;
    height: 14px;
    stroke-width: 2;
  }
  
  @media (prefers-color-scheme: dark) {
    background: rgba(10, 132, 255, 0.9);
    box-shadow: 0 4px 12px rgba(10, 132, 255, 0.3);
    
    &:hover {
      background: rgba(10, 132, 255, 1);
      box-shadow: 0 6px 20px rgba(10, 132, 255, 0.4);
    }
  }
}

// 缩放控制按钮（左下角）
.zoom-btn {
  position: absolute;
  bottom: -16px;
  left: -16px;
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(88, 86, 214, 0.9);
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
  box-shadow: 0 4px 12px rgba(88, 86, 214, 0.3);
  
  &.visible {
    opacity: 1;
    transform: scale(1);
  }
  
  &:hover {
    background: rgba(88, 86, 214, 1);
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(88, 86, 214, 0.4);
    
    .zoom-indicator {
      opacity: 1;
      transform: translateY(-40px) scale(1);
    }
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  svg {
    width: 14px;
    height: 14px;
    stroke-width: 2;
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
  
  @media (prefers-color-scheme: dark) {
    background: rgba(94, 92, 230, 0.9);
    box-shadow: 0 4px 12px rgba(94, 92, 230, 0.3);
    
    &:hover {
      background: rgba(94, 92, 230, 1);
      box-shadow: 0 6px 20px rgba(94, 92, 230, 0.4);
    }
  }
}

// 胶囊状态的拖拽区域
.capsule-drag-area {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 20px;
  cursor: move;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: rgba(255, 255, 255, 1);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.15);
    transform: scale(1.02);
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  @media (prefers-color-scheme: dark) {
    background: rgba(40, 40, 40, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: rgba(50, 50, 50, 1);
    }
  }
}

.capsule-content {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #333;
  font-size: 12px;
  font-weight: 500;
  
  @media (prefers-color-scheme: dark) {
    color: #fff;
  }
}

.capsule-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 12px;
    height: 12px;
    stroke-width: 2;
  }
}

.capsule-text {
  font-size: 11px;
  opacity: 0.8;
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
  
  .drag-handle {
    width: 80px;
    height: 8px;
  }
  
  .close-btn,
  .resize-handle,
  .pin-btn,
  .zoom-btn {
    width: 36px;
    height: 36px;
    
    svg {
      width: 16px;
      height: 16px;
    }
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
  
  .drag-handle {
    width: 100px;
    height: 10px;
  }
  
  .close-btn {
    top: -18px;
    right: -18px;
    width: 40px;
    height: 40px;
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
  
  .pin-btn {
    top: -18px;
    left: -18px;
    width: 40px;
    height: 40px;
    
    svg {
      width: 18px;
      height: 18px;
    }
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
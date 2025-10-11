<template>
  <FloatingWindow
    :visible="visible"
    :width="800"
    :height="700"
    :min-width="600"
    :min-height="500"
    :close-on-overlay="true"
    :close-on-escape="true"
    content-class="setting-content"
    @close="handleClose"
  >
    <div class="setting-container">
      <AllSet />
    </div>
  </FloatingWindow>
</template>

<script setup>
import FloatingWindow from './FloatingWindow.vue'
import AllSet from './AllFunc/AllSet.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
:deep(.setting-content) {
  background: var(--main-background-light-color);
  border-radius: 12px;
  overflow: hidden;
}

.setting-container {
  height: 100%;
  overflow: hidden;
  
  // 复制原始AllFunc.vue中的.all-set样式
  :deep(.all-set) {
    overflow: hidden;
    height: 100%;
  }
  
  // 确保n-tabs占满容器并优化动画
  :deep(.n-tabs) {
    height: 100%;
    
    // 优化标签页切换动画
    .n-tabs-content {
      height: calc(100% - 44px) !important;
      overflow: hidden !important;
      position: relative;
    }
    
    // 确保标签页内容区域稳定
    .n-tabs-pane-wrapper {
      height: 100% !important;
      overflow: hidden !important;
    }
  }
  
  // 统一所有标签页高度，防止切换时高度跳动
  :deep(.n-tab-pane) {
    height: 100% !important;
    min-height: 100% !important;
    max-height: 100% !important;
    overflow: hidden !important;
    position: relative;
    
    // 确保每个标签页都有相同的容器约束
    display: flex;
    flex-direction: column;
  }
  
  // 确保滚动区域占满标签页并统一高度
  :deep(.scrollbar) {
    flex: 1;
    height: 100% !important;
    min-height: 100% !important;
    max-height: 100% !important;
    
    // 强制统一滚动容器高度
    .n-scrollbar {
      height: 100% !important;
    }
    
    .n-scrollbar-container {
      height: 100% !important;
      padding-bottom: 0 !important;
    }
    
    .n-scrollbar-content {
      min-height: 100%;
      padding-bottom: 0 !important;
    }
  }
  
  // 复制原始AllFunc.vue中的.set-item样式，确保颜色正确显示
  :deep(.set-item) {
    width: 100%;
    border-radius: 8px;
    margin-bottom: 12px;
    border: none;
    box-shadow: var(--main-box-shadow);
    --n-color: var(--main-background-light-color);
    
    .n-card__content {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      
      .desc {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        
        @media (max-width: 720px) {
          flex-direction: column;
          align-items: flex-start;
          
          .name {
            margin-bottom: 8px;
          }
        }
      }
      
      .name {
        display: flex;
        flex-direction: column;
        
        .title {
          font-size: 16px;
        }
        
        .tip {
          font-size: 13px;
          opacity: 0.8;
        }
      }
      
      .set {
        width: 200px;
        
        @media (max-width: 768px) {
          width: 140px;
          min-width: 140px;
        }
      }
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

// 壁纸选择样式 - 复制自AllSet.vue，确保颜色正确显示
:deep(.cover-selete) {
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
      
    .name {
      font-size: 14px;
      font-weight: bold;
      text-align: center;
    }
    
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
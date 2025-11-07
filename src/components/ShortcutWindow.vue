<template>
  <FloatingWindow
    :visible="visible"
    :width="500"
    :height="650"
    :min-width="250"
    :min-height="500"
    :close-on-overlay="true"
    :close-on-escape="true"
    :window-type="'shortcut'"
    content-class="shortcut-content"
    @close="handleClose"
  >
    <div class="shortcut-container">
      <div class="shortcut-header">
        <h2>捷径管理</h2>
        <p>管理您的网站快捷方式</p>
      </div>
      
      <div class="shortcut-content-area">
        <ShortCut :responsive="'self'" :cols="'2 300:3 450:4'" />
      </div>
    </div>
  </FloatingWindow>
</template>

<script setup>
import FloatingWindow from './FloatingWindow.vue'
import ShortCut from './AllFunc/Box/ShortCut.vue'

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
:deep(.shortcut-content) {
  background: var(--main-background-light-color);
  border-radius: 12px;
  overflow: hidden;
}

.shortcut-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--main-background-light-color);
}

.shortcut-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--main-background-color);
  
  h2 {
    margin: 0 0 8px;
    color: var(--main-text-color);
    font-size: 20px;
    font-weight: 600;
  }
  
  p {
    margin: 0;
    color: var(--main-text-color);
    font-size: 14px;
    opacity: 0.7;
  }
}

.shortcut-content-area {
  flex: 1;
  padding: 16px 24px 20px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--main-background-color);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--main-text-color);
    opacity: 0.3;
    border-radius: 3px;
    
    &:hover {
      opacity: 0.5;
    }
  }
  
  :deep(.shortcut-box) {
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  :deep(.n-scrollbar) {
    flex: 1;
  }
  
  :deep(.shortcut-grid) {
    gap: 12px;
  }
  
  :deep(.shortcut-item) {
    border-radius: 8px;
    transition: all 0.2s ease;
    color: var(--main-text-color);
    
    .name {
      color: var(--main-text-color);
    }
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }
  
  :deep(.shortcut-add-btn) {
    border: 2px dashed var(--main-background-color);
    border-radius: 8px;
    transition: all 0.2s ease;
    
    &:hover {
      border-color: var(--main-text-color);
      background: var(--main-background-hover-color);
    }
  }
  
  :deep(.not-shortcut) {
    .tip {
      color: var(--main-text-color);
    }
  }
  
  :deep(.footer__btn-group) {
    .footer__btn {
      color: var(--main-text-color);
      
      .btnName {
        color: var(--main-text-color);
      }
    }
  }
}
</style>
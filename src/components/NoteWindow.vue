<template>
  <FloatingWindow
    :visible="visible"
    :width="500"
    :height="650"
    :min-width="300"
    :min-height="450"
    :close-on-overlay="true"
    :close-on-escape="true"
    :window-type="'note'"
    content-class="note-content"
    @close="handleClose"
  >
    <div class="note-container">
      <div class="note-header">
        <h2>便签管理</h2>
        <p>管理您的便签笔记</p>
      </div>
      
      <div class="note-content-area">
        <NoteList />
      </div>
    </div>
  </FloatingWindow>
</template>

<script setup>
import FloatingWindow from './FloatingWindow.vue'
import NoteList from './NoteList.vue'

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
:deep(.note-content) {
  background: var(--main-background-light-color);
  border-radius: 12px;
  overflow: hidden;
}

.note-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--main-background-light-color);
}

.note-header {
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

.note-content-area {
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
  
  // 为便签列表提供更好的显示效果
  :deep(.note-list) {
    height: 100%;
    
    .empty-state {
      margin-top: 50px;
    }
    
    .add-note-floating-btn {
      position: absolute;
      bottom: 20px;
      right: 20px;
    }
  }
}

// 响应式设计
@media (max-width: 600px) {
  .note-header {
    padding: 16px 20px 12px;
    
    h2 {
      font-size: 18px;
    }
    
    p {
      font-size: 13px;
    }
  }
  
  .note-content-area {
    padding: 12px 20px 16px;
  }
}
</style>
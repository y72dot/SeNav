<template>
  <FloatingWindow
    :visible="visible"
    :width="400"
    :height="600"
    :min-width="400"
    :min-height="400"
    :close-on-overlay="true"
    :close-on-escape="true"
    content-class="help-content"
    @close="handleClose"
  >
    <div class="help-container">
      <div class="help-header">
        <h2>命令帮助</h2>
        <p>在搜索框中输入以下命令即可使用</p>
      </div>
      
      <div class="help-content-area">
        <div 
          v-for="(commands, category) in commandsByCategory" 
          :key="category"
          class="category-section"
        >
          <h3 class="category-title">{{ category }}</h3>
          
          <div class="commands-list">
            <div 
              v-for="command in commands" 
              :key="command.name"
              class="command-item"
              @click="handleCommandClick(command.name)"
            >
              <div class="command-info">
                <span class="command-name">{{ command.name }}</span>
                <span class="command-description">{{ command.description }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </FloatingWindow>
</template>

<script setup>
import FloatingWindow from './FloatingWindow.vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  commandsByCategory: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'commandClick'])

const handleClose = () => {
  emit('close')
}

const handleCommandClick = (commandName) => {
  // 发送命令点击事件给父组件
  emit('commandClick', commandName)
  // 不再自动关闭帮助窗口，让用户可以继续查看其他命令
}
</script>

<style lang="scss" scoped>
:deep(.help-content) {
  background: var(--main-background-light-color);
  border-radius: 12px;
  overflow: hidden;
}

.help-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--main-background-light-color);
}

.help-header {
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
    opacity: 0.7;
    font-size: 14px;
  }
}

.help-content-area {
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
}

.category-section {
  margin-bottom: 24px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.category-title {
  margin: 0 0 12px;
  color: var(--main-text-color);
  font-size: 16px;
  font-weight: 600;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--main-background-color);
}

.commands-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.command-item {
  background: var(--main-background-color);
  border: 1px solid var(--main-border-color, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  padding: 10px 12px;
  transition: all 0.2s ease;
  cursor: pointer;
  
  &:hover {
    background: var(--main-background-light-color);
    border-color: var(--main-accent-color, #007bff);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.command-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.command-name {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  font-weight: 600;
  color: var(--main-text-color);
  line-height: 1.2;
}

.command-description {
  font-size: 12px;
  color: var(--main-text-color);
  opacity: 0.7;
  line-height: 1.3;
}

// 响应式设计
@media (max-width: 768px) {
  .help-header {
    padding: 16px 20px 12px;
    
    h2 {
      font-size: 18px;
    }
  }
  
  .help-content-area {
    padding: 12px 20px 16px;
  }
  
  .command-item {
    padding: 8px 10px;
  }
  
  .command-name {
    font-size: 12px;
  }
  
  .command-description {
    font-size: 11px;
  }
}
</style>
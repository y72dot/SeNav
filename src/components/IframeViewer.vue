<template>
  <FloatingWindow
    :visible="visible"
    :width="900"
    :height="600"
    :min-width="400"
    :min-height="300"
    :close-on-overlay="false"
    :close-on-escape="false"
    content-class="iframe-content"
    @close="handleClose"
  >
    <iframe
      :src="url"
      frameborder="0"
      allowfullscreen
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
    ></iframe>
  </FloatingWindow>
</template>

<script setup>
import FloatingWindow from './FloatingWindow.vue'

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

// 关闭处理
const handleClose = () => {
  emit('close')
}
</script>

<style lang="scss" scoped>
:deep(.iframe-content) {
  iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }
}
</style>
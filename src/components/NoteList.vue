<template>
  <div class="note-list">
    <div v-if="notes.length === 0" class="empty-notes">
      <div class="empty-text">暂无便签</div>
    </div>
    <div v-else class="notes-container">
      <div v-for="(note, index) in notes" :key="note.id" class="note-item" @click="startEdit(note, index)">
        <div class="note-content">
          <textarea
            v-show="editingNoteId === note.id"
            :ref="el => { if (el) editTextareas[index] = el }"
            v-model="editingContent"
            class="note-edit-textarea"
            @blur="saveNote(note.id)"
            @keydown.enter.prevent="saveNote(note.id)"
            @input="handleInput"
          ></textarea>
          <div v-show="editingNoteId !== note.id">
            {{ note.content }}
          </div>
        </div>
        <div class="note-date">{{ formatDate(note.createdAt) }}</div>
      </div>
    </div>
    <button class="add-note-floating-btn" @click="addNewNote">+</button>
  </div>
</template>

<script setup>
import { useNoteStore } from '../stores/note'
import { storeToRefs } from 'pinia'
import { ref, nextTick } from 'vue'

const noteStore = useNoteStore()
const { notes } = storeToRefs(noteStore)

const editingNoteId = ref(null)
const editingContent = ref('')
const editTextareas = ref([])

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const addCurrentTimeNote = () => {
  const now = new Date()
  const timeStr = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
  noteStore.addNote({
    content: timeStr
  })
}

const addNewNote = () => {
  const newNote = {
    id: Date.now(),
    content: '',
    createdAt: new Date().toISOString()
  }
  noteStore.addNote(newNote)
  nextTick(() => {
    const newIndex = notes.value.length - 1
    startEdit(newNote, newIndex)
  })
}

// 删除 addTestNote 函数

const startEdit = (note, index) => {
  editingNoteId.value = note.id
  editingContent.value = note.content
  nextTick(() => {
    const textarea = editTextareas.value[index]
    if (textarea) {
      textarea.focus()
      
      adjustTextareaHeight(textarea)
    }
  })
}

const saveNote = (noteId) => {
  const trimmedContent = editingContent.value.trim()
  
  if (trimmedContent === '') {
    noteStore.deleteNote(noteId)
  } else {
    noteStore.updateNote(noteId, trimmedContent)
  }
  
  editingNoteId.value = null
  editingContent.value = trimmedContent
}

// 自动调整文本框高度
const adjustTextareaHeight = (textarea) => {
  textarea.style.height = 'auto'
  textarea.style.height = textarea.scrollHeight + 'px'
}

// 监听输入内容变化
const handleInput = (event) => {
  adjustTextareaHeight(event.target)
}
</script>

<style scoped>
.note-list {
  position: relative;
  padding: 16px 16px 24px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
  height: 100%;
}

.empty-notes {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.empty-text {
  color: var(--main-text-color);
  font-size: 16px;
  margin-bottom: 16px;
}

.add-note-btn {
  padding: 8px 16px;
  background: var(--main-background-light-color);
  border: none;
  border-radius: 6px;
  color: var(--main-text-color);
  cursor: pointer;
  transition: all 0.3s;
}

.add-note-btn:hover {
  transform: scale(1.05);
}

.notes-container {
  max-height: calc(100% - 72px);
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  padding: 0 12px;
  box-sizing: border-box;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.note-item {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 12px;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
  margin: 0 auto;
  width: 100%;
  max-width: 280px;
  box-sizing: border-box;
}

.note-content {
  margin-bottom: 32px;
  word-break: break-word;
  color: var(--main-text-color);
  cursor: text;
  position: relative;
  min-height: 120px;
}

.note-date {
  position: absolute;
  bottom: 12px;
  padding: 0 8px;
  font-size: 12px;
  color: var(--main-text-color);
  opacity: 0.7;
  text-align: center;
}

.note-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.note-content {
  margin-bottom: 28px;
  min-height: 100px;
}



.note-content > div {
  width: 100%;
  text-align: center;
}

.note-edit-textarea {
  width: 100%;
  min-height: 100px;
  height: auto;
  padding: 8px;
  border: 1px solid var(--main-background-light-color);
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--main-text-color);
  resize: none;
  font-family: inherit;
  font-size: inherit;
  line-height: 1.5;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
  text-align: center;
  margin: 0 auto;
  display: block;
  box-sizing: border-box;
}

.note-edit-textarea::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.note-edit-textarea:focus {
  outline: none;
  border-color: var(--main-background-light-color);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.note-date {
  font-size: 12px;
  color: var(--main-text-color);
  opacity: 0.7;
}

.add-note-floating-btn {
  position: fixed;
  right: 24px;
  bottom: 24px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--main-background-light-color);
  color: var(--main-text-color);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.add-note-floating-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}
</style>
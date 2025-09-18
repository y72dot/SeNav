import { defineStore } from 'pinia'

export const useNoteStore = defineStore('note', {
  state: () => ({
    notes: []
  }),
  actions: {
    addNote(note) {
      this.notes.push({
        id: Date.now(),
        content: note.content,
        createdAt: new Date().toISOString()
      })
    },
    updateNote(noteId, content) {
      const note = this.notes.find(n => n.id === noteId)
      if (note) {
        note.content = content
      }
    },
    deleteNote(noteId) {
      const index = this.notes.findIndex(n => n.id === noteId)
      if (index !== -1) {
        this.notes.splice(index, 1)
      }
    }
  },
  persist: {
    key: 'notes',
    storage: localStorage
  }
})
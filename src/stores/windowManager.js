import { defineStore } from 'pinia'

/**
 * 窗口层级管理 Store
 * 负责管理所有浮动窗口的z-index层级关系
 */
export const useWindowManagerStore = defineStore('windowManager', {
  state: () => ({
    // 窗口注册表 - 存储所有活跃窗口的信息
    windows: new Map(),
    // 基础z-index值
    baseZIndex: 1000,
    // 当前最高z-index值
    maxZIndex: 1000,
    // 窗口ID计数器
    windowIdCounter: 0,
    // 搜索框z-index
    searchBoxZIndex: 1,
    // 搜索框附属组件z-index（搜索引擎切换、搜索建议）
    searchComponentsZIndex: 2,
    // 时间组件z-index
    timeComponentZIndex: 1,
    // 搜索框聚焦状态
    isSearchBoxFocused: false
  }),

  getters: {
    /**
     * 获取所有窗口按z-index排序
     */
    sortedWindows: (state) => {
      return Array.from(state.windows.values()).sort((a, b) => a.zIndex - b.zIndex)
    },

    /**
     * 获取顶层窗口
     */
    topWindow: (state) => {
      let topWindow = null
      let maxZ = 0
      for (const window of state.windows.values()) {
        if (window.zIndex > maxZ) {
          maxZ = window.zIndex
          topWindow = window
        }
      }
      return topWindow
    },

    /**
     * 获取窗口数量
     */
    windowCount: (state) => state.windows.size
  },

  actions: {
    /**
     * 注册新窗口
     * @param {Object} windowInfo - 窗口信息
     * @param {string} windowInfo.type - 窗口类型 (iframe, note, help, shortcut)
     * @param {string} windowInfo.title - 窗口标题
     * @param {Object} windowInfo.data - 窗口数据
     * @returns {string} 窗口ID
     */
    registerWindow(windowInfo) {
      const windowId = `window_${++this.windowIdCounter}_${Date.now()}`
      const zIndex = ++this.maxZIndex
      
      const window = {
        id: windowId,
        type: windowInfo.type,
        title: windowInfo.title || '未命名窗口',
        data: windowInfo.data || {},
        zIndex,
        createdAt: Date.now(),
        isMinimized: false,
        isVisible: true
      }
      
      this.windows.set(windowId, window)
      
      // 更新UI组件的z-index
      this.updateUIComponentsZIndex()
      
      console.log(`🪟 窗口已注册: ${windowId}, z-index: ${zIndex}, 类型: ${windowInfo.type}`)
      return windowId
    },

    /**
     * 注销窗口
     * @param {string} windowId - 窗口ID
     */
    unregisterWindow(windowId) {
      if (this.windows.has(windowId)) {
        const window = this.windows.get(windowId)
        this.windows.delete(windowId)
        
        // 更新UI组件的z-index
        this.updateUIComponentsZIndex()
        
        console.log(`🗑️ 窗口已注销: ${windowId}, 类型: ${window.type}`)
      }
    },

    /**
     * 将窗口置顶
     * @param {string} windowId - 窗口ID
     */
    bringToFront(windowId) {
      if (!this.windows.has(windowId)) {
        console.warn(`⚠️ 窗口不存在: ${windowId}`)
        return
      }

      const window = this.windows.get(windowId)
      
      // 检查窗口是否已经在最前面
      if (window.zIndex === this.maxZIndex) {
        console.log(`📌 窗口已在最前面: ${windowId}, z-index: ${window.zIndex}`)
        return window.zIndex
      }
      
      const newZIndex = ++this.maxZIndex
      
      window.zIndex = newZIndex
      this.windows.set(windowId, window)
      
      // 更新UI组件的z-index
      this.updateUIComponentsZIndex()
      
      console.log(`⬆️ 窗口已置顶: ${windowId}, 新z-index: ${newZIndex}`)
      return newZIndex
    },

    /**
     * 获取窗口的z-index
     * @param {string} windowId - 窗口ID
     * @returns {number} z-index值
     */
    getWindowZIndex(windowId) {
      const window = this.windows.get(windowId)
      return window ? window.zIndex : this.baseZIndex
    },

    /**
     * 更新窗口信息
     * @param {string} windowId - 窗口ID
     * @param {Object} updates - 更新的信息
     */
    updateWindow(windowId, updates) {
      if (this.windows.has(windowId)) {
        const window = this.windows.get(windowId)
        Object.assign(window, updates)
        this.windows.set(windowId, window)
      }
    },

    /**
     * 设置窗口最小化状态
     * @param {string} windowId - 窗口ID
     * @param {boolean} isMinimized - 是否最小化
     */
    setWindowMinimized(windowId, isMinimized) {
      this.updateWindow(windowId, { isMinimized })
    },

    /**
     * 设置窗口可见性
     * @param {string} windowId - 窗口ID
     * @param {boolean} isVisible - 是否可见
     */
    setWindowVisible(windowId, isVisible) {
      this.updateWindow(windowId, { isVisible })
    },

    /**
     * 获取窗口信息
     * @param {string} windowId - 窗口ID
     * @returns {Object|null} 窗口信息
     */
    getWindow(windowId) {
      return this.windows.get(windowId) || null
    },

    /**
     * 清理所有窗口
     */
    clearAllWindows() {
      this.windows.clear()
      this.maxZIndex = this.baseZIndex
      this.windowIdCounter = 0
      console.log('🧹 所有窗口已清理')
    },

    /**
     * 获取指定类型的所有窗口
     * @param {string} type - 窗口类型
     * @returns {Array} 窗口列表
     */
    getWindowsByType(type) {
      return Array.from(this.windows.values()).filter(window => window.type === type)
    },

    /**
     * 更新搜索框z-index
     * 当有窗口处于顶层时，搜索框应该在所有窗口之下
     * 当搜索框聚焦时，应该置于所有窗口之上
     */
    updateSearchBoxZIndex() {
      if (this.isSearchBoxFocused) {
        // 搜索框聚焦时，置于所有窗口之上
        this.searchBoxZIndex = this.maxZIndex + 1
        // 附属组件应该在搜索框之上
        this.searchComponentsZIndex = this.maxZIndex + 2
        console.log('🔍 搜索框聚焦，z-index已更新为:', this.searchBoxZIndex)
        console.log('🔧 搜索框附属组件z-index已更新为:', this.searchComponentsZIndex)
      } else if (this.windows.size > 0) {
        // 如果有窗口存在，搜索框应该在最低窗口之下
        const minWindowZIndex = Math.min(...Array.from(this.windows.values()).map(w => w.zIndex))
        this.searchBoxZIndex = Math.max(1, minWindowZIndex - 1)
        // 附属组件应该在搜索框之上但仍在窗口之下
        this.searchComponentsZIndex = Math.max(2, minWindowZIndex - 1)
        console.log('🔍 搜索框失焦，z-index已更新为:', this.searchBoxZIndex)
        console.log('🔧 搜索框附属组件z-index已更新为:', this.searchComponentsZIndex)
      } else {
        // 如果没有窗口，搜索框使用默认z-index
        this.searchBoxZIndex = 1
        this.searchComponentsZIndex = 2
        console.log('🔍 搜索框z-index已更新为:', this.searchBoxZIndex)
        console.log('🔧 搜索框附属组件z-index已更新为:', this.searchComponentsZIndex)
      }
    },

    /**
     * 更新时间组件z-index
     * 当有窗口处于顶层时，时间组件应该在所有窗口之下
     */
    updateTimeComponentZIndex() {
      if (this.windows.size > 0) {
        // 如果有窗口存在，时间组件应该在最低窗口之下
        const minWindowZIndex = Math.min(...Array.from(this.windows.values()).map(w => w.zIndex))
        this.timeComponentZIndex = Math.max(1, minWindowZIndex - 1)
      } else {
        // 如果没有窗口，时间组件使用默认z-index
        this.timeComponentZIndex = 1
      }
      console.log('⏰ 时间组件z-index已更新为:', this.timeComponentZIndex)
    },

    /**
     * 更新所有UI组件的z-index
     * 在窗口注册、注销、置顶时调用
     */
    updateUIComponentsZIndex() {
      this.updateSearchBoxZIndex()
      this.updateTimeComponentZIndex()
    },

    /**
     * 设置搜索框聚焦状态
     * @param {boolean} isFocused - 是否聚焦
     */
    setSearchBoxFocused(isFocused) {
      this.isSearchBoxFocused = isFocused
      this.updateSearchBoxZIndex()
    }
  }
})
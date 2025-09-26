import { ref, computed } from 'vue'

/**
 * 标题检测工具函数
 * 提供自动检测DOM元素标题和副标题的功能
 */

/**
 * 网站友好名称映射
 */
const WEBSITE_FRIENDLY_NAMES = {
  'github.com': 'GitHub',
  'stackoverflow.com': 'Stack Overflow',
  'youtube.com': 'YouTube',
  'google.com': 'Google',
  'baidu.com': '百度',
  'zhihu.com': '知乎',
  'bilibili.com': '哔哩哔哩',
  'taobao.com': '淘宝',
  'jd.com': '京东',
  'weibo.com': '微博',
  'douban.com': '豆瓣',
  'csdn.net': 'CSDN',
  'jianshu.com': '简书',
  'segmentfault.com': 'SegmentFault',
  'juejin.cn': '掘金',
  'v2ex.com': 'V2EX',
  'reddit.com': 'Reddit',
  'twitter.com': 'Twitter',
  'facebook.com': 'Facebook',
  'instagram.com': 'Instagram',
  'linkedin.com': 'LinkedIn'
}

/**
 * 从iframe中检测标题
 * @param {HTMLElement} container - 包含iframe的容器元素
 * @returns {string|null} 检测到的标题或null
 */
export function detectIframeTitle(container) {
  const iframe = container.querySelector('iframe')
  if (!iframe) return null
  
  try {
    // 尝试从iframe的src URL中提取域名作为标题
    const src = iframe.src
    if (src) {
      const url = new URL(src)
      const hostname = url.hostname
      
      // 移除www前缀，提取主域名
      const domain = hostname.replace(/^www\./, '')
      
      // 返回友好名称或域名
      return WEBSITE_FRIENDLY_NAMES[domain] || domain
    }
    
    // 尝试访问iframe内容的title（仅限同源）
    if (iframe.contentDocument) {
      const iframeTitle = iframe.contentDocument.title
      if (iframeTitle && iframeTitle.trim()) {
        return iframeTitle.trim()
      }
    }
  } catch (error) {
    // 跨域访问被阻止，这是正常的安全机制
    // 对于跨域iframe，我们只能依赖URL解析
    console.log('无法访问iframe内容（跨域限制）:', error.message)
    
    // 即使跨域，我们仍然可以从src URL获取信息
    try {
      const src = iframe.src
      if (src) {
        const url = new URL(src)
        const hostname = url.hostname.replace(/^www\./, '')
        
        // 返回友好名称或域名
        return WEBSITE_FRIENDLY_NAMES[hostname] || hostname
      }
    } catch (urlError) {
      console.log('URL解析失败:', urlError.message)
    }
  }
  
  return null
}

/**
 * 从DOM元素中检测标题
 * @param {HTMLElement} container - 要搜索的容器元素
 * @returns {string} 检测到的标题
 */
export function detectDOMTitle(container) {
  // 查找标题元素
  const titleElement = container.querySelector('h1, h2, h3, .title, [data-title]')
  if (titleElement) {
    return titleElement.textContent?.trim() || ''
  }
  return ''
}

/**
 * 从DOM元素中检测副标题
 * @param {HTMLElement} container - 要搜索的容器元素
 * @returns {string} 检测到的副标题
 */
export function detectDOMSubtitle(container) {
  // 查找副标题元素
  const subtitleElement = container.querySelector('.subtitle, .sub-title, [data-subtitle]')
  if (subtitleElement) {
    return subtitleElement.textContent?.trim() || ''
  }
  
  // 如果没有找到专门的副标题，尝试从描述性元素中获取
  const descElement = container.querySelector('p, .description, .desc, [data-description]')
  if (descElement) {
    const text = descElement.textContent?.trim() || ''
    // 限制副标题长度
    return text.length > 30 ? text.substring(0, 30) + '...' : text
  }
  
  return ''
}

/**
 * 根据标题长度计算胶囊宽度
 * @param {string} title - 标题文本
 * @param {number} baseWidth - 基础宽度，默认120
 * @param {number} charWidth - 每个字符的宽度，默认8
 * @param {number} maxWidth - 最大宽度，默认300
 * @returns {number} 计算出的宽度
 */
export function calculateCapsuleWidth(title, baseWidth = 120, charWidth = 8, maxWidth = 300) {
  if (!title) return baseWidth
  
  // 基础宽度
  let width = baseWidth
  
  // 根据标题长度调整
  width += Math.max(0, (title.length - 2) * charWidth)
  
  // 限制最大宽度
  return Math.min(width, maxWidth)
}

/**
 * 设置iframe加载监听器
 * @param {HTMLElement} container - 包含iframe的容器元素
 * @param {Function} callback - iframe加载完成后的回调函数
 * @param {number} delay - 延迟时间，默认500ms
 */
export function setupIframeLoadListener(container, callback, delay = 500) {
  if (!container || typeof callback !== 'function') return
  
  const iframe = container.querySelector('iframe')
  if (!iframe) return
  
  // 监听iframe加载完成
  const handleIframeLoad = () => {
    // 延迟一下再检测，确保iframe内容完全加载
    setTimeout(callback, delay)
  }
  
  // 如果iframe已经加载完成
  if (iframe.readyState === 'complete' || iframe.contentDocument?.readyState === 'complete') {
    handleIframeLoad()
  } else {
    // 监听加载事件
    iframe.addEventListener('load', handleIframeLoad)
  }
}

/**
 * 标题检测Composable函数
 * 提供响应式的标题检测功能
 * @param {Object} options - 配置选项
 * @returns {Object} 包含标题检测相关的响应式数据和方法
 */
export function useTitleDetection(options = {}) {
  const {
    autoDetect = true,
    defaultTitle = '窗口',
    defaultSubtitle = '',
    enableIframeDetection = true,
    capsuleConfig = {}
  } = options
  
  // 响应式状态
  const detectedTitle = ref('')
  const detectedSubtitle = ref('')
  const capsuleWidth = ref(120)
  
  // 胶囊配置
  const {
    baseWidth = 120,
    charWidth = 8,
    maxWidth = 300
  } = capsuleConfig
  
  /**
   * 自动检测标题和副标题
   * @param {HTMLElement} container - 要搜索的容器元素
   * @param {string} manualTitle - 手动设置的标题
   * @param {string} manualSubtitle - 手动设置的副标题
   */
  const detectTitleAndSubtitle = (container, manualTitle = '', manualSubtitle = '') => {
    if (!autoDetect) return
    
    // 如果已经有手动设置的标题和副标题，优先使用
    if (manualTitle || manualSubtitle) {
      detectedTitle.value = manualTitle
      detectedSubtitle.value = manualSubtitle
    } else if (container) {
      // 尝试从容器内容中自动识别
      let title = ''
      let subtitle = ''
      
      // 首先尝试从iframe中获取标题
      if (enableIframeDetection) {
        const iframeTitle = detectIframeTitle(container)
        if (iframeTitle) {
          title = iframeTitle
        }
      }
      
      // 如果没有从iframe获取到标题，尝试从DOM元素获取
      if (!title) {
        title = detectDOMTitle(container)
      }
      
      // 检测副标题
      subtitle = detectDOMSubtitle(container)
      
      detectedTitle.value = title
      detectedSubtitle.value = subtitle
    }
    
    // 根据内容长度动态调整胶囊宽度
    updateCapsuleWidth()
  }
  
  /**
   * 更新胶囊宽度
   */
  const updateCapsuleWidth = () => {
    const title = detectedTitle.value || defaultTitle
    capsuleWidth.value = calculateCapsuleWidth(title, baseWidth, charWidth, maxWidth)
  }
  
  /**
   * 设置iframe监听器
   * @param {HTMLElement} container - 包含iframe的容器元素
   */
  const setupIframeListeners = (container) => {
    if (!enableIframeDetection || !container) return
    
    setupIframeLoadListener(container, () => {
      detectTitleAndSubtitle(container)
    })
  }
  
  // 计算属性
  const displayTitle = computed(() => {
    return detectedTitle.value || defaultTitle
  })
  
  const displaySubtitle = computed(() => {
    return detectedSubtitle.value || defaultSubtitle
  })
  
  return {
    // 响应式状态
    detectedTitle,
    detectedSubtitle,
    capsuleWidth,
    
    // 计算属性
    displayTitle,
    displaySubtitle,
    
    // 方法
    detectTitleAndSubtitle,
    updateCapsuleWidth,
    setupIframeListeners
  }
}
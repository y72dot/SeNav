// 设置数据校验与清洗（PR2）
// 目标：在恢复数据时进行最小化的类型与取值校验，过滤未知字段，避免异常值导致站点异常

import defaultEngine from '@/assets/defaultEngine.json'

// 默认值（与 setData.js 中 state 保持一致）
export const defaultSetData = {
  themeType: 'light',
  backgroundType: 1,
  backgroundCustom: '',
  showBackgroundGray: true,
  backgroundBlur: 0,
  searchEngine: 'bing',
  lastSearchEngine: 'bing',
  customEngineUrl: '',
  smallInput: false,
  showCleanInput: true,
  autoFocus: false,
  autoInputBlur: true,
  timeStyle: 'one',
  showLunar: false,
  showSeconds: false,
  showZeroTime: true,
  use12HourFormat: false,
  showWeather: false,
  showSuggestions: true,
  showSearchSuggestions: true,
  showCommandSuggestions: true,
  showIframeSuggestions: true,
  showQuickTranslate: true,
  showDirectAccess: true,
  showShortcutSuggestions: true,
  urlJumpType: 'open',
}

const engineKeys = Object.keys(defaultEngine || {})

const isString = (v) => typeof v === 'string'
const isBoolean = (v) => typeof v === 'boolean'
const isNumber = (v) => typeof v === 'number' && !Number.isNaN(v)
const isEnum = (v, list) => list.includes(v)
const clamp = (n, min, max) => Math.min(max, Math.max(min, n))

// 允许 http/https 的基本 URL 校验（避免过度严格导致恢复失败）
const isHttpUrl = (v) => isString(v) && /^https?:\/\/\S+/i.test(v)

// 清洗与校验：仅保留已知字段，修正类型与取值范围
export function sanitizeSetData(input = {}) {
  const out = { ...defaultSetData }

  // 主题
  if (isEnum(input.themeType, ['light', 'dark'])) out.themeType = input.themeType

  // 壁纸
  if (isNumber(input.backgroundType)) out.backgroundType = clamp(input.backgroundType, 0, 7)
  if (isString(input.backgroundCustom)) out.backgroundCustom = input.backgroundCustom
  if (isBoolean(input.showBackgroundGray)) out.showBackgroundGray = input.showBackgroundGray
  if (isNumber(input.backgroundBlur)) out.backgroundBlur = clamp(input.backgroundBlur, 0, 10)

  // 搜索引擎
  if (isString(input.searchEngine)) {
    const se = input.searchEngine
    if (se === 'custom' || engineKeys.includes(se)) out.searchEngine = se
  }
  if (isString(input.lastSearchEngine) && engineKeys.includes(input.lastSearchEngine)) {
    out.lastSearchEngine = input.lastSearchEngine
  }
  if (isString(input.customEngineUrl)) {
    // 不强制 https，保持兼容性；如需更严格可改为 isHttpUrl(input.customEngineUrl)
    out.customEngineUrl = input.customEngineUrl
  }

  // 搜索框与行为
  if (isBoolean(input.smallInput)) out.smallInput = input.smallInput
  if (isBoolean(input.showCleanInput)) out.showCleanInput = input.showCleanInput
  if (isBoolean(input.autoFocus)) out.autoFocus = input.autoFocus
  if (isBoolean(input.autoInputBlur)) out.autoInputBlur = input.autoInputBlur

  // 时间设置
  if (isEnum(input.timeStyle, ['one', 'two'])) out.timeStyle = input.timeStyle
  if (isBoolean(input.showLunar)) out.showLunar = input.showLunar
  if (isBoolean(input.showSeconds)) out.showSeconds = input.showSeconds
  if (isBoolean(input.showZeroTime)) out.showZeroTime = input.showZeroTime
  if (isBoolean(input.use12HourFormat)) out.use12HourFormat = input.use12HourFormat

  // 天气
  if (isBoolean(input.showWeather)) out.showWeather = input.showWeather

  // 建议相关
  if (isBoolean(input.showSuggestions)) out.showSuggestions = input.showSuggestions
  if (isBoolean(input.showSearchSuggestions)) out.showSearchSuggestions = input.showSearchSuggestions
  if (isBoolean(input.showCommandSuggestions)) out.showCommandSuggestions = input.showCommandSuggestions
  if (isBoolean(input.showIframeSuggestions)) out.showIframeSuggestions = input.showIframeSuggestions
  if (isBoolean(input.showQuickTranslate)) out.showQuickTranslate = input.showQuickTranslate
  if (isBoolean(input.showDirectAccess)) out.showDirectAccess = input.showDirectAccess
  if (isBoolean(input.showShortcutSuggestions)) out.showShortcutSuggestions = input.showShortcutSuggestions

  // 跳转方式
  if (isEnum(input.urlJumpType, ['open', 'href'])) out.urlJumpType = input.urlJumpType

  return out
}
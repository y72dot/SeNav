// 备份/恢复服务（PR2）
// 提供统一的备份文件结构与兼容旧文件的恢复逻辑

import { sanitizeSetData } from './schema'

// 生成备份内容（字符串），包含元信息
export function backupSetData(state) {
  const payload = {
    meta: {
      module: 'setData',
      version: 1,
      createdAt: new Date().toISOString(),
    },
    data: state,
  }
  return JSON.stringify(payload, null, 2)
}

// 从文件对象恢复设置
// - 支持新格式：{ meta, data }
// - 兼容旧格式：直接就是设置对象
export function recoverSetData(setStore, fileJson) {
  try {
    let data = fileJson
    if (fileJson && typeof fileJson === 'object' && 'data' in fileJson && fileJson.data) {
      data = fileJson.data
    }
    const sanitized = sanitizeSetData(data)
    // 委托给store，保持兼容（store内也做了清洗）
    setStore.recoverSiteData(sanitized)
    return { success: true, applied: sanitized }
  } catch (e) {
    console.error('[recoverSetData] failed:', e)
    return { success: false, error: e?.message || String(e) }
  }
}
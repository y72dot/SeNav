/**
 * 系统命令定义和注册
 */

import { registerCommand, COMMAND_TYPES, RESULT_TYPES, getAllCommands } from '../commandRegistry.js';

/**
 * iframe 命令处理器
 * @param {string} input 完整输入
 * @returns {Object} 执行结果
 */
const handleIframeCommand = (input) => {
  const match = input.match(/^\/iframe\s+(.+)/i);
  if (match) {
    let url = match[1].trim();
    // 如果没有协议，默认添加 https://
    if (!url.match(/^https?:\/\//i)) {
      url = 'https://' + url;
    }
    
    return {
      success: true,
      type: RESULT_TYPES.SUCCESS,
      message: `正在打开网页: ${url}`,
      data: { url, action: 'open_iframe' }
    };
  }
  
  return {
    success: false,
    type: RESULT_TYPES.ERROR,
    message: 'iframe 命令格式错误，请使用: /iframe <网址>'
  };
};

/**
 * iframe 命令验证器
 * @param {string} input 输入
 * @returns {Object} 验证结果
 */
const validateIframeCommand = (input) => {
  const match = input.match(/^\/iframe\s+(.+)/i);
  if (!match) {
    return {
      valid: false,
      message: 'iframe 命令需要提供网址参数'
    };
  }
  
  const url = match[1].trim();
  if (!url) {
    return {
      valid: false,
      message: '网址不能为空'
    };
  }
  
  return { valid: true };
};

/**
 * help 命令处理器
 * @param {string} input 完整输入
 * @returns {Object} 执行结果
 */
const handleHelpCommand = (input) => {
  const allCommands = getAllCommands();
  
  // 按分类组织命令
  const commandsByCategory = {};
  allCommands.forEach(cmd => {
    const category = cmd.category || '其他';
    if (!commandsByCategory[category]) {
      commandsByCategory[category] = [];
    }
    commandsByCategory[category].push(cmd);
  });
  
  return {
    success: true,
    type: RESULT_TYPES.SUCCESS,
    message: '正在打开帮助窗口...',
    data: { 
      action: 'show_help_window',
      commandsByCategory
    }
  };
};

/**
 * shortcut 命令处理器
 * @param {string} input 完整输入
 * @returns {Object} 执行结果
 */
const handleShortcutCommand = (input) => {
  return {
    success: true,
    type: RESULT_TYPES.SUCCESS,
    message: '正在打开捷径管理窗口...',
    data: { 
      action: 'show_shortcut_window'
    }
  };
};

/**
 * note 命令处理器
 * @param {string} input 完整输入
 * @returns {Object} 执行结果
 */
const handleNoteCommand = (input) => {
  return {
    success: true,
    type: RESULT_TYPES.SUCCESS,
    message: '正在打开便签管理窗口...',
    data: { 
      action: 'show_note_window'
    }
  };
};

/**
 * setting 命令处理器
 * @param {string} input 完整输入
 * @returns {Object} 执行结果
 */
const handleSettingCommand = (input) => {
  return {
    success: true,
    type: RESULT_TYPES.SUCCESS,
    message: '正在打开设置窗口...',
    data: { 
      action: 'show_setting_window'
    }
  };
};

/**
 * test 命令处理器
 * @param {string} input 完整输入
 * @returns {Object} 执行结果
 */
const handleTestCommand = (input) => {
  const args = input.replace('/test', '').trim();
  return {
    success: true,
    type: RESULT_TYPES.SUCCESS,
    message: `执行测试命令，参数: ${args || '无'}`,
    data: { command: '/test', args }
  };
};

/**
 * test2 命令处理器
 * @param {string} input 完整输入
 * @returns {Object} 执行结果
 */
const handleTest2Command = (input) => {
  const options = input.replace('/test2', '').trim();
  return {
    success: true,
    type: RESULT_TYPES.SUCCESS,
    message: `执行测试命令2，选项: ${options || '无'}`,
    data: { command: '/test2', options }
  };
};

/**
 * 注册所有系统命令
 */
export const registerSystemCommands = () => {
  // 注册 help 命令
  registerCommand({
    name: '/help',
    pattern: '^/help(\\s+.*)?$',
    partialPattern: '^/h(e(l(p)?)?)?$',
    type: COMMAND_TYPES.SIMPLE,
    description: '显示所有可用命令的帮助信息',
    usage: '/help',
    args: [],
    category: '系统',
    examples: ['/help'],
    handler: handleHelpCommand
  });

  // 注册 shortcut 命令
  registerCommand({
    name: '/shortcut',
    pattern: '^/shortcut(\\s+.*)?$',
    partialPattern: '^/s(h(o(r(t(c(u(t)?)?)?)?)?)?)?$',
    type: COMMAND_TYPES.SIMPLE,
    description: '打开捷径管理窗口',
    usage: '/shortcut',
    args: [],
    category: '工具',
    examples: ['/shortcut'],
    handler: handleShortcutCommand
  });

  // 注册 note 命令
  registerCommand({
    name: '/note',
    pattern: '^/note(\\s+.*)?$',
    partialPattern: '^/n(o(t(e)?)?)?$',
    type: COMMAND_TYPES.SIMPLE,
    description: '打开便签管理窗口',
    usage: '/note',
    args: [],
    category: '工具',
    examples: ['/note'],
    handler: handleNoteCommand
  });

  // 注册 setting 命令
  registerCommand({
    name: '/setting',
    pattern: '^/setting(\\s+.*)?$',
    partialPattern: '^/s(e(t(t(i(n(g)?)?)?)?)?)?$',
    type: COMMAND_TYPES.SIMPLE,
    description: '打开设置窗口',
    usage: '/setting',
    args: [],
    category: '工具',
    examples: ['/setting'],
    handler: handleSettingCommand
  });

  // 注册 iframe 命令
  registerCommand({
    name: '/iframe',
    pattern: '^/iframe\\s+.+',
    partialPattern: '^/ifr(a(m(e)?)?)?$',
    type: COMMAND_TYPES.WITH_ARGS,
    description: '在内嵌框架中打开网页',
    usage: '/iframe <网址>',
    args: [
      { key: 'url', name: '网址', type: 'url', required: true, hint: '网址' }
    ],
    category: '网页工具',
    examples: [
      '/iframe https://www.baidu.com',
      '/iframe www.google.com',
      '/iframe github.com'
    ],
    handler: handleIframeCommand,
    validator: validateIframeCommand
  });

  // 注册 test 命令
  registerCommand({
    name: '/test',
    pattern: '^/test(\\s+.*)?$',
    partialPattern: '^/te(s(t)?)?$',
    type: COMMAND_TYPES.WITH_ARGS,
    description: '测试命令1',
    usage: '/test [参数]',
    args: [
      { key: 'param', name: '参数', type: 'string', required: false, hint: '参数' }
    ],
    category: '测试',
    examples: [
      '/test hello',
      '/test world'
    ],
    handler: handleTestCommand
  });

  // 注册 test2 命令
  registerCommand({
    name: '/test2',
    pattern: '^/test2(\\s+.*)?$',
    partialPattern: '^/test2?$',
    type: COMMAND_TYPES.WITH_ARGS,
    description: '测试命令2',
    usage: '/test2 [选项]',
    args: [
      { key: 'option', name: '选项', type: 'string', required: false, hint: '选项' }
    ],
    category: '测试',
    examples: [
      '/test2 -v',
      '/test2 --help'
    ],
    handler: handleTest2Command
  });
};

// 自动注册所有命令
registerSystemCommands();
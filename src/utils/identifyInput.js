import { identifyCommand } from './commandRegistry.js';
// 确保命令已注册
import './commands/index.js';

/**
 * 判断输入的字符串是网址、邮件地址、命令还是普通文本。
 *
 * @param {string} input - 输入的字符串
 * @returns {string} - 返回类型字符串
 */
const identifyInput = (input) => {
  if (!input || typeof input !== 'string') {
    return "text";
  }

  /**
   * 网址正则
   * @type {RegExp}
   */
  const urlRegex = new RegExp("https?://[\\w.-]+", "i");

  /**
   * IP 正则
   * @type {RegExp}
   */
  const ipv4Regex = new RegExp(
    "^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?).(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
  );

  /**
   * 邮箱正则
   * @type {RegExp}
   */
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // 使用统一的命令识别系统
  const commandResult = identifyCommand(input);
  
  // 如果是命令类型，返回相应的类型
  if (commandResult.type === 'command') {
    if (commandResult.command) {
      // 特殊处理 iframe 命令，保持向后兼容
      if (commandResult.commandName === '/iframe') {
        return commandResult.isPartial ? 'iframe-partial' : 'iframe';
      }
      // 其他命令返回通用命令类型
      return 'command';
    }
    // 未识别的命令仍返回 command
    return 'command';
  }
  
  if (commandResult.type === 'command-partial') {
    // 特殊处理 iframe 命令的部分匹配
    if (commandResult.commandName === '/iframe') {
      return 'iframe-partial';
    }
    // 其他命令的部分匹配返回 command-partial
    return 'command-partial';
  }

  // 判断是否为网址
  if (urlRegex.test(input) || ipv4Regex.test(input)) return "url";

  // 判断是否为邮件地址
  if (emailRegex.test(input)) return "email";

  // 默认返回普通文本
  return "text";
};

export default identifyInput;

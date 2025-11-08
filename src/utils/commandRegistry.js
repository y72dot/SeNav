/**
 * 统一命令注册系统
 * 管理所有命令的配置、识别、建议和执行逻辑
 */

// 命令类型枚举
export const COMMAND_TYPES = {
  SIMPLE: 'simple',           // 简单命令，如 /test
  WITH_ARGS: 'with_args',     // 带参数命令，如 /iframe url
  PARTIAL: 'partial'          // 部分匹配命令
};

// 命令执行结果类型
export const RESULT_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

/**
 * 命令注册表
 * 每个命令包含：
 * - name: 命令名称
 * - pattern: 匹配正则表达式
 * - partialPattern: 部分匹配正则（可选）
 * - type: 命令类型
 * - description: 描述
 * - usage: 使用方法
 * - category: 分类
 * - examples: 示例
 * - handler: 处理函数
 * - validator: 验证函数（可选）
 */
const commandRegistry = new Map();

/**
 * 注册命令
 * @param {Object} commandConfig 命令配置
 */
export const registerCommand = (commandConfig) => {
  const {
    name,
    pattern,
    partialPattern,
    type = COMMAND_TYPES.SIMPLE,
    description,
    usage,
    category = '默认',
    examples = [],
    args = [],
    handler,
    validator
  } = commandConfig;

  if (!name || !pattern || !handler) {
    throw new Error('命令注册失败：name、pattern 和 handler 是必需的');
  }

  commandRegistry.set(name, {
    name,
    pattern: new RegExp(pattern, 'i'),
    partialPattern: partialPattern ? new RegExp(partialPattern, 'i') : null,
    type,
    description,
    usage,
    category,
    examples,
    args,
    handler,
    validator
  });
};

/**
 * 获取所有已注册的命令
 * @returns {Array} 命令列表
 */
export const getAllCommands = () => {
  return Array.from(commandRegistry.values());
};

/**
 * 根据输入识别命令类型
 * @param {string} input 用户输入
 * @returns {Object} { type, command, isPartial }
 */
export const identifyCommand = (input) => {
  if (!input || !input.startsWith('/')) {
    return { type: 'text', command: null, isPartial: false };
  }

  const tokens = input.trim().split(/\s+/);
  const cmdToken = tokens[0] || '';

  // 遍历所有注册的命令
  for (const [name, config] of commandRegistry) {
    // 检查完整匹配
    if (config.pattern.test(input)) {
      return {
        type: 'command',
        command: config,
        isPartial: false,
        commandName: name
      };
    }
    
    // 检查部分匹配
    if (config.partialPattern && (config.partialPattern.test(cmdToken) || config.partialPattern.test(cmdToken.toLowerCase()))) {
      return {
        type: 'command-partial',
        command: config,
        isPartial: true,
        commandName: name
      };
    }
  }

  // 如果没有匹配到具体命令，但以 / 开头，则为通用命令
  if (input.startsWith('/')) {
    return { type: 'command', command: null, isPartial: false };
  }

  return { type: 'text', command: null, isPartial: false };
};

/**
 * 获取命令建议
 * @param {string} input 用户输入
 * @returns {Array} 匹配的命令列表
 */
export const getCommandSuggestions = (input) => {
  if (!input || !input.startsWith('/')) {
    return [];
  }

  const suggestions = [];
  const inputLower = input.toLowerCase();
  const tokens = input.trim().split(/\s+/);
  const cmdToken = tokens[0] || '';
  const cmdTokenLower = cmdToken.toLowerCase();
  const typedArgs = tokens.length > 1 ? tokens.slice(1) : [];

  for (const [name, config] of commandRegistry) {
    const nameLower = name.toLowerCase();
    // 仅根据命令名进行前缀/部分匹配，忽略已输入的参数内容
    const matchByNamePrefix = nameLower.startsWith(cmdTokenLower);
    const matchByPartialPattern = config.partialPattern
      ? (config.partialPattern.test(cmdToken) || config.partialPattern.test(cmdTokenLower))
      : false;
    // 如果已经开始输入参数（有空格），则只匹配“命令名完全相等”的情况，避免 /test aaa 出现 /test2
    const nameMatched = typedArgs.length > 0 ? (nameLower === cmdTokenLower) : (matchByNamePrefix || matchByPartialPattern);
    if (nameMatched) {
      // 生成更直观的提示：根据参数定义与已输入内容生成提示语
      let hint = '';
      const argsDef = Array.isArray(config.args) ? config.args : [];
      if (!argsDef.length) {
        hint = '无参数命令';
      } else {
        // 当前需要提示的参数索引（已输入数量）
        const idx = Math.min(typedArgs.length, argsDef.length - 1);
        const currArg = argsDef[idx];
        const label = currArg?.hint || currArg?.name || currArg?.key || '参数';
        const typed = typedArgs[idx] || '';
        if ((currArg?.type || '').toLowerCase() === 'url') {
          let normalized = typed;
          if (typed && !/^https?:\/\//i.test(typed)) {
            normalized = 'https://' + typed;
          }
          hint = `${label}: ${normalized || '<网址>'}`;
        } else {
          hint = `${label}: ${typed || `<${label}>`}`;
        }
      }

      suggestions.push({
        name,
        description: config.description,
        usage: config.usage,
        category: config.category,
        examples: config.examples,
        type: config.type,
        args: argsDef,
        hint
      });
    }
  }

  return suggestions.slice(0, 10); // 限制返回数量
};

/**
 * 执行命令
 * @param {string} input 完整的命令输入
 * @returns {Object} 执行结果
 */
export const executeCommand = (input) => {
  const identification = identifyCommand(input);
  
  if (identification.type !== 'command' || !identification.command) {
    return {
      success: false,
      type: RESULT_TYPES.ERROR,
      message: `未知命令: ${input}`
    };
  }

  const { command } = identification;
  
  try {
    // 如果有验证器，先验证
    if (command.validator) {
      const validation = command.validator(input);
      if (!validation.valid) {
        return {
          success: false,
          type: RESULT_TYPES.ERROR,
          message: validation.message || '命令验证失败'
        };
      }
    }

    // 执行命令处理函数
    return command.handler(input);
  } catch (error) {
    return {
      success: false,
      type: RESULT_TYPES.ERROR,
      message: `命令执行出错: ${error.message}`
    };
  }
};

/**
 * 获取TAB补全建议
 * @param {string} input 用户输入
 * @returns {string|null} 补全的命令字符串
 */
export const getTabCompletion = (input) => {
  if (!input || !input.startsWith('/')) {
    return null;
  }

  const suggestions = getCommandSuggestions(input);
  
  // 如果只有一个匹配项，返回完整命令
  if (suggestions.length === 1) {
    return suggestions[0].name;
  }
  
  // 如果有多个匹配项，找到最长公共前缀
  if (suggestions.length > 1) {
    const commands = suggestions.map(cmd => cmd.name);
    let commonPrefix = commands[0];
    
    for (let i = 1; i < commands.length; i++) {
      let j = 0;
      while (j < commonPrefix.length && j < commands[i].length && 
             commonPrefix[j] === commands[i][j]) {
        j++;
      }
      commonPrefix = commonPrefix.substring(0, j);
    }
    
    // 只有当公共前缀比输入更长时才返回
    return commonPrefix.length > input.length ? commonPrefix : null;
  }
  
  return null;
};

// 导出命令注册表（用于调试）
export const getCommandRegistry = () => commandRegistry;
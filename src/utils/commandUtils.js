import defaultCommands from '@/assets/defaultCommands.json';

/**
 * 获取命令建议
 * @param {string} input - 输入的命令字符串
 * @returns {Array} - 匹配的命令列表
 */
export const getCommandSuggestions = (input) => {
  if (!input || !input.startsWith('/')) {
    return [];
  }

  const { commands, settings } = defaultCommands;
  const searchTerm = input.toLowerCase();
  
  // 过滤匹配的命令
  const matchedCommands = commands.filter(cmd => {
    const commandName = settings.caseSensitive ? cmd.command : cmd.command.toLowerCase();
    return commandName.startsWith(searchTerm);
  });

  // 限制返回数量
  return matchedCommands.slice(0, settings.maxSuggestions);
};

/**
 * 获取精确匹配的命令
 * @param {string} input - 输入的命令字符串
 * @returns {Object|null} - 匹配的命令对象或null
 */
export const getExactCommand = (input) => {
  if (!input || !input.startsWith('/')) {
    return null;
  }

  const { commands, settings } = defaultCommands;
  const searchTerm = settings.caseSensitive ? input : input.toLowerCase();
  
  return commands.find(cmd => {
    const commandName = settings.caseSensitive ? cmd.command : cmd.command.toLowerCase();
    return commandName === searchTerm;
  }) || null;
};

/**
 * 获取TAB补全建议
 * @param {string} input - 输入的命令字符串
 * @returns {string|null} - 补全的命令字符串或null
 */
export const getTabCompletion = (input) => {
  if (!input || !input.startsWith('/')) {
    return null;
  }

  const suggestions = getCommandSuggestions(input);
  
  // 如果只有一个匹配项，返回完整命令
  if (suggestions.length === 1) {
    return suggestions[0].command;
  }
  
  // 如果有多个匹配项，找到最长公共前缀
  if (suggestions.length > 1) {
    const commands = suggestions.map(cmd => cmd.command);
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

/**
 * 执行命令
 * @param {string} command - 命令字符串
 * @param {Array} args - 命令参数
 * @returns {Object} - 执行结果
 */
export const executeCommand = (command, args = []) => {
  const cmd = getExactCommand(command);
  
  if (!cmd) {
    return {
      success: false,
      message: `未知命令: ${command}`,
      type: 'error'
    };
  }

  // 这里可以根据不同命令执行不同逻辑
  switch (command) {
    case '/test':
      return {
        success: true,
        message: `执行测试命令，参数: ${args.join(', ') || '无'}`,
        type: 'success',
        data: { command, args }
      };
    
    case '/test2':
      return {
        success: true,
        message: `执行测试命令2，选项: ${args.join(', ') || '无'}`,
        type: 'success',
        data: { command, args }
      };
    
    default:
      return {
        success: false,
        message: `命令 ${command} 暂未实现`,
        type: 'warning'
      };
  }
};
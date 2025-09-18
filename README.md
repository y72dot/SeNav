# SeNav

![Version](https://img.shields.io/badge/version-2.0.0%20beta%206-blue) ![License](https://img.shields.io/badge/license-MIT-green) ![Vue](https://img.shields.io/badge/Vue-3.x-brightgreen) ![Vite](https://img.shields.io/badge/Vite-5.x-646CFF)

![SeNav.png](https://s2.loli.net/2022/07/15/FE6U2BJCynHDep8.jpg)

> ⚠️ **项目重构中**  
> 本项目正在进行重构，部分功能可能不稳定。如需使用稳定版本，请访问 [原版本](https://github.com/imsyy/home)

## 📖 项目介绍

SeNav 是一个功能丰富、界面精美的浏览器起始页，采用 Vue 3 + Vite 构建。它不仅提供了简洁优雅的界面设计，还集成了多种实用功能，让您的浏览体验更加高效便捷。

### 🎯 核心特性

#### 🕒 智能时间天气
- **实时时钟显示**：支持12/24小时制切换，可选择显示秒数
- **天气信息**：集成高德地图API，实时获取当地天气状况
- **农历显示**：支持中国传统农历日期显示
- **多种时钟样式**：横向/竖向布局可选

#### 🔍 智能搜索系统
- **多搜索引擎**：支持百度、谷歌、必应等主流搜索引擎切换
- **搜索建议**：智能搜索建议功能
- **自动聚焦**：可配置页面加载时自动聚焦搜索框
- **键盘快捷键**：支持回车键和空格键快速聚焦搜索

#### 📝 便签功能
- **实时保存**：编辑内容自动保存至本地存储
- **多便签管理**：支持创建、编辑、删除多个便签
- **数据持久化**：基于 Pinia + localStorage 实现数据持久化
- **响应式设计**：完美适配移动端和桌面端

#### 🎨 个性化定制
- **多种壁纸**：本地默认、每日必应、随机风景、随机动漫、随机风景2、随机二次元2
- **自定义壁纸**：支持自定义背景图片URL，完全个性化定制
- **壁纸效果**：可调节模糊度、遮罩效果
- **主题切换**：支持浅色/深色主题模式
- **壁纸管理**：8种壁纸选项，包含预留扩展位置

#### 🔗 快捷方式管理
- **自定义网站**：添加常用网站快捷方式
- **图标支持**：自动获取网站图标
- **分类管理**：支持网站分类整理
- **拖拽排序**：直观的拖拽排序功能

#### 💾 数据管理
- **数据备份**：一键导出所有设置和数据
- **数据恢复**：支持从备份文件恢复设置
- **云端同步**：基于浏览器本地存储的跨设备同步

### 📋 功能清单

- [x] 🎬 载入动画效果
- [x] 🕐 时间及天气显示
- [x] 🔗 快捷方式自定义
- [x] 🖼️ 网站背景自定义（8种壁纸选项）
- [x] 🎨 自定义壁纸URL支持
- [x] 💾 数据备份及恢复
- [x] 📱 移动端完美适配
- [x] 🔍 多搜索引擎切换
- [x] ⚙️ 丰富的个性化设置
- [x] 📝 便签功能
- [x] 🌙 深色/浅色主题
- [x] ⌨️ 键盘快捷键支持
- [x] 🔧 壁纸功能优化与修复
- [ ] 📖 一言功能
- [ ] 🔖 书签管理


## 🚀 快速开始

### 📋 环境要求

- **Node.js** >= 16.16.0
- **npm** >= 8.15.0 或 **pnpm** >= 7.0.0（推荐）

### 🛠️ 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/imsyy/SNav.git
cd SNav
```

2. **安装 pnpm**（如果尚未安装）
```bash
npm install -g pnpm
```

3. **安装依赖**
```bash
pnpm install
```

4. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置必要的参数
```

5. **启动开发服务器**
```bash
pnpm dev
```

6. **构建生产版本**
```bash
pnpm build
```

### 🌐 部署方式

#### 静态部署
构建完成后，将 `dist` 目录下的文件上传至您的服务器即可。

#### 平台部署
- **Vercel**：[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/imsyy/SNav)
- **Netlify**：[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/imsyy/SNav)
- **Cloudflare Pages**：支持自动部署

## ⚙️ 配置说明

### 基础配置

在项目根目录的 `.env` 文件中可以修改以下配置：

```bash
# 站点基本信息
VITE_SITE_TITLE = "SeNav"          # 网站标题
VITE_SITE_ANTHOR = "無名"               # 作者
VITE_SITE_KEYWORDS = "..."              # 网站关键词
VITE_SITE_DES = "..."                   # 网站描述
VITE_SITE_LOGO = "/favicon.png"         # 网站图标
VITE_SITE_APPLE_LOGO = "/logo/logo.png" # Apple设备图标
VITE_SITE_COPYRIGHTLINK = "..."         # 版权链接

# 界面文本
VITE_WELCOME_TEXT = "欢迎访问本站"      # 欢迎语
VITE_INPUT_TIP = "想要搜点什么"         # 搜索框提示文字

# 其他配置
VITE_ICP = "豫ICP备2022018134号-1"     # ICP备案号（可选）
VITE_COPYRIGHT_VISIBLE = "true"         # 版权信息可见性（true/false）
VITE_WEATHER_KEY = "..."                # 天气API密钥
```

### 🔧 天气API配置

项目使用高德地图API获取天气信息，需要：

1. 前往 [高德开放平台](https://lbs.amap.com/) 注册账号
2. 申请 **Web服务API Key**（注意：是Web服务，不是Web端JS API）
3. 将获得的Key填入 `.env` 文件的 `VITE_WEATHER_KEY` 中

> ⚠️ **注意**：免费版API每日调用上限为5000次，建议自行申请Key

### 📱 PWA支持

项目已集成PWA功能，支持：
- 📱 添加到主屏幕
- 🔄 离线缓存
- 🚀 快速加载
- 📦 自动更新

## 🛠️ 技术栈

| 技术 | 版本 | 描述 |
|------|------|------|
| [Vue.js](https://cn.vuejs.org/) | 3.3.4 | 渐进式JavaScript框架 |
| [Vite](https://vitejs.cn/) | 4.4.5 | 下一代前端构建工具 |
| [Pinia](https://pinia.vuejs.org/zh/) | 2.1.4 | Vue状态管理库 |
| [Naive UI](https://www.naiveui.com/) | 2.34.4 | Vue 3组件库 |
| [Sass](https://sass-lang.com/) | 1.64.1 | CSS预处理器 |
| [Axios](https://axios-http.com/) | 1.4.0 | HTTP客户端 |

### 🔌 插件与工具

- **vite-plugin-pwa** - PWA支持
- **vite-plugin-compression** - 资源压缩
- **pinia-plugin-persistedstate** - 状态持久化
- **ESLint** + **Prettier** - 代码规范
- **lunar-calendar** - 农历支持

## 📖 使用指南

### 🔍 搜索功能
1. 点击搜索框或按 `回车键`/`空格键` 激活搜索
2. 输入关键词，支持智能搜索建议
3. 选择搜索引擎（百度、谷歌、必应等）
4. 按回车搜索或点击建议项

### 📝 便签管理
1. 右键点击页面或点击设置按钮进入功能区
2. 切换到"便签"标签页
3. 点击"+"按钮创建新便签
4. 点击便签内容进行编辑，自动保存

### 🔗 快捷方式
1. 在功能区的"捷径"标签页中管理
2. 添加常用网站链接
3. 支持拖拽排序和分类管理
4. 自动获取网站图标

### ⚙️ 个性化设置
1. 点击设置按钮进入设置页面
2. **基础设置**：搜索引擎、跳转方式等
3. **个性调整**：壁纸、主题、时钟样式等
   - **壁纸选项**：8种壁纸类型可选（本地、必应、随机风景、随机动漫、随机风景2、随机二次元2、预留、自定义）
   - **自定义壁纸**：支持输入图片URL，实现完全个性化背景
4. **其他设置**：数据备份、重置等

> 💡 **壁纸功能说明**：
> - 选择"自定义壁纸"选项后，可输入任意图片URL作为背景
> - 支持常见图片格式（jpg、png、webp等）
> - 建议使用高质量图片以获得最佳显示效果

## 🔄 数据备份与恢复

### 📤 数据备份
1. 进入设置页面
2. 点击"数据备份"按钮
3. 系统将自动下载包含所有设置的JSON文件

### 📥 数据恢复
1. 进入设置页面
2. 点击"数据恢复"按钮
3. 选择之前备份的JSON文件
4. 确认恢复，页面将自动刷新

## 🔗 API服务

项目集成了以下第三方API服务：

| 服务 | 用途 | 官网 |
|------|------|------|
| [高德地图API](https://lbs.amap.com/) | 天气信息获取 | https://lbs.amap.com/ |
| [小歪API](https://api.ixiaowai.cn/) | 背景图片服务 | https://api.ixiaowai.cn/ |
| [缙哥哥API](https://www.dujin.org/3618.html) | 备用API服务 | https://www.dujin.org/3618.html |
| [Hitokoto 一言](https://hitokoto.cn/) | 一言服务（开发中） | https://hitokoto.cn/ |

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 📝 提交规范

请遵循以下提交信息格式：
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type类型：**
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

### 🔧 开发流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'feat: add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

## 📄 开源协议

本项目基于 [MIT License](LICENSE) 开源协议，详情请参阅 LICENSE 文件。

## 🙏 致谢

- 感谢 [青柠起始页](https://limestart.cn/) 提供的设计灵感
- 感谢所有贡献者的支持与帮助
- 感谢开源社区提供的优秀工具和库

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！**

[![Star History Chart](https://api.star-history.com/svg?repos=imsyy/SNav&type=Date)](https://star-history.com/#imsyy/SNav&Date)

</div>

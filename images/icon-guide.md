# 图标获取指南

## 推荐图标资源

### 1. Iconfont（阿里巴巴矢量图标库）
- 网址：https://www.iconfont.cn/
- 搜索关键词：
  - 首页：home、house、主页
  - 收藏：star、favorite、收藏
  - 设置：settings、gear、设置

### 2. Feather Icons
- 网址：https://feathericons.com/
- 推荐图标：
  - 首页：home
  - 收藏：star
  - 设置：settings

### 3. Heroicons
- 网址：https://heroicons.com/
- 风格：现代简洁

## 下载步骤

1. **访问图标网站**
2. **搜索对应图标**
3. **下载PNG格式**（32x32px或48x48px）
4. **重命名文件**：
   ```
   home.png (灰色版本)
   home-active.png (蓝色版本 #1565C0)
   star.png (灰色版本)
   star-active.png (蓝色版本)
   settings.png (灰色版本)
   settings-active.png (蓝色版本)
   ```
5. **放入 images/ 目录**

## 颜色规范

- **未选中状态**：#666666（中灰色）
- **选中状态**：#1565C0（主题蓝色）
- **背景**：透明

## 快速解决方案

如果暂时无法获取图标，可以：
1. 删除 app.json 中的 iconPath 和 selectedIconPath 配置
2. 仅使用文字标签显示底部导航
3. 后续再补充图标文件

这样小程序就可以正常运行了！
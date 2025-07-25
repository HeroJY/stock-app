# 股票HA溢价率查询微信小程序

一个专注于H股和A股价格对比分析的微信小程序，帮助投资者快速了解港股和A股之间的价格差异。

## 功能特色

### 🔍 实时股票查询
- 支持H股和A股价格实时获取
- 多种股票代码格式支持
- 智能搜索功能

### 📊 HA溢价率计算
- 自动计算HA溢价率：`(H股价格×汇率 - A股价格) ÷ A股价格 × 100%`
- 实时汇率更新
- 直观的价格对比展示

### ⭐ 收藏管理
- 收藏常关注的股票对
- 批量管理收藏列表
- 多种排序方式

### 🔔 价格提醒
- 设置价格阈值提醒
- 溢价率变化通知
- 个性化提醒设置

### ⚙️ 个性化设置
- 数据刷新频率设置
- 主题模式切换
- 提醒偏好配置

## 技术架构

### 前端技术
- **框架**: 微信小程序原生开发
- **语言**: WXML + WXSS + JavaScript
- **设计**: Material Design风格
- **存储**: wx.setStorageSync本地存储

### 数据接口
- **股票数据**: 腾讯财经API (`https://qt.gtimg.com/q=`)
- **汇率数据**: ExchangeRate API
- **数据格式**: JSON格式数据交换

### 核心算法
```javascript
// HA溢价率计算公式
function calculatePremiumRate(hPrice, aPrice, exchangeRate) {
  const hPriceInCNY = hPrice * exchangeRate
  return ((hPriceInCNY - aPrice) / aPrice * 100).toFixed(2)
}
```

## 项目结构

```
├── app.js                 # 小程序入口文件
├── app.json              # 小程序配置文件
├── app.wxss              # 全局样式文件
├── sitemap.json          # 站点地图配置
├── project.config.json   # 项目配置文件
├── utils/                # 工具类目录
│   ├── api.js           # API接口封装
│   └── storage.js       # 本地存储工具
├── pages/                # 页面目录
│   ├── index/           # 首页
│   ├── detail/          # 股票详情页
│   ├── favorites/       # 收藏页面
│   └── settings/        # 设置页面
└── images/              # 图标资源目录
```

## 页面说明

### 首页 (pages/index)
- 股票搜索功能
- 汇率信息显示
- 收藏股票列表
- 快捷操作工具栏

### 详情页 (pages/detail)
- 详细价格对比
- HA溢价率分析
- 投资建议展示
- 历史趋势图表

### 收藏页 (pages/favorites)
- 收藏股票管理
- 批量操作功能
- 多维度排序
- 实时数据刷新

### 设置页 (pages/settings)
- 数据刷新设置
- 提醒偏好配置
- 显示选项调整
- 缓存管理功能

## 开发指南

### 环境要求
- 微信开发者工具
- Node.js (可选，用于构建工具)

### 快速开始
1. 下载微信开发者工具
2. 导入项目目录
3. 配置小程序AppID
4. 预览或真机调试

### 配置说明
1. 修改 `project.config.json` 中的 `appid`
2. 根据需要调整 `app.json` 中的页面配置
3. 在 `utils/api.js` 中配置API接口地址

### API接口
```javascript
// 股票数据接口
const stockApi = 'https://qt.gtimg.com/q='

// 汇率接口  
const exchangeRateApi = 'https://api.exchangerate-api.com/v4/latest/HKD'
```

## 使用说明

### 添加股票
1. 点击首页搜索框
2. 输入股票代码或名称
3. 选择对应的H股和A股对
4. 点击添加到收藏

### 查看详情
1. 点击股票卡片
2. 查看详细价格对比
3. 了解HA溢价率计算
4. 设置价格提醒

### 管理收藏
1. 进入收藏页面
2. 使用编辑模式批量管理
3. 设置排序方式
4. 刷新实时数据

## 注意事项

### 数据准确性
- 股票价格存在延迟，仅供参考
- 汇率数据实时更新，但可能有缓存
- 投资有风险，决策需谨慎

### 使用限制
- 需要网络连接获取实时数据
- API调用频率可能有限制
- 部分功能需要用户授权

### 隐私保护
- 本地存储用户偏好设置
- 不收集个人敏感信息
- 遵循微信小程序隐私规范

## 版本历史

### v1.0.0 (当前版本)
- ✅ 基础功能实现
- ✅ 股票查询和HA溢价率计算
- ✅ 收藏管理功能
- ✅ 个性化设置
- 🔄 价格提醒功能开发中

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目。

### 开发规范
- 遵循微信小程序开发规范
- 保持代码风格一致
- 添加必要的注释说明
- 测试功能完整性

## 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

## 联系方式

如有问题或建议，请通过以下方式联系：
- 邮箱：feedback@stockapp.com
- 微信：stockapp_support

---

**免责声明**: 本应用提供的股票信息仅供参考，不构成投资建议。投资有风险，入市需谨慎。
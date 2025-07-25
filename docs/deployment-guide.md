# 部署发布指南

## 发布前检查清单

### 1. 功能测试
- [ ] 股票搜索功能正常
- [ ] HA溢价率计算准确
- [ ] 收藏功能完整
- [ ] 价格提醒设置正常
- [ ] 页面跳转无误
- [ ] 数据刷新正常

### 2. 兼容性测试
- [ ] iOS设备测试
- [ ] Android设备测试
- [ ] 不同屏幕尺寸适配
- [ ] 网络异常处理
- [ ] 数据为空处理

### 3. 性能测试
- [ ] 页面加载速度 < 3秒
- [ ] 内存使用合理
- [ ] 网络请求优化
- [ ] 缓存策略有效

## 配置更新

### 1. 更新AppID
```json
// project.config.json
{
  "appid": "你的小程序AppID",
  "projectname": "stock-ha-premium"
}
```

### 2. 配置服务器域名
在微信公众平台配置以下域名：
- `https://qt.gtimg.com` (股票数据API)
- `https://api.exchangerate-api.com` (汇率API)

### 3. 更新版本信息
```javascript
// app.js
App({
  globalData: {
    version: '1.0.0',
    buildTime: '2024-01-01'
  }
})
```

## 代码优化

### 1. 移除调试代码
```javascript
// 移除所有console.log
// 移除测试用的mock数据
// 移除开发环境的配置
```

### 2. 压缩资源
- 压缩图片资源
- 优化代码结构
- 移除未使用的文件

### 3. 安全检查
```javascript
// 检查敏感信息
// 验证用户输入
// 防止XSS攻击
function sanitizeInput(input) {
  return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
}
```

## 发布流程

### 1. 本地测试
```bash
# 在微信开发者工具中
1. 编译项目
2. 真机预览测试
3. 检查控制台错误
4. 验证所有功能
```

### 2. 上传代码
```bash
# 在微信开发者工具中
1. 点击"上传"按钮
2. 填写版本号和项目备注
3. 确认上传
```

### 3. 提交审核
```bash
# 在微信公众平台
1. 登录小程序管理后台
2. 进入"版本管理"
3. 选择开发版本
4. 提交审核
5. 填写审核信息
```

## 审核要点

### 1. 功能描述
```
股票HA溢价率查询小程序，主要功能：
- 实时查询H股和A股价格
- 自动计算HA溢价率
- 股票收藏和管理
- 价格提醒设置
- 个性化设置选项
```

### 2. 测试账号
如需要，提供测试账号信息

### 3. 特殊功能说明
- 网络请求用途说明
- 本地存储用途说明
- 用户隐私保护措施

## 发布后维护

### 1. 监控指标
- 用户访问量
- 功能使用率
- 错误率统计
- 性能指标

### 2. 用户反馈
- 建立反馈渠道
- 及时响应问题
- 收集改进建议

### 3. 版本更新
```javascript
// 版本更新检查
function checkUpdate() {
  const updateManager = wx.getUpdateManager()
  
  updateManager.onCheckForUpdate((res) => {
    if (res.hasUpdate) {
      wx.showModal({
        title: '更新提示',
        content: '新版本已经准备好，是否重启应用？',
        success: (res) => {
          if (res.confirm) {
            updateManager.applyUpdate()
          }
        }
      })
    }
  })
}
```

## 运营推广

### 1. 小程序码生成
- 生成不同场景的小程序码
- 用于线上线下推广

### 2. 搜索优化
- 完善小程序信息
- 设置合适的关键词
- 优化小程序描述

### 3. 分享功能
```javascript
// 自定义分享
onShareAppMessage() {
  return {
    title: '股票HA溢价率查询 - 投资决策好帮手',
    path: '/pages/index/index',
    imageUrl: '/images/share-cover.jpg'
  }
}

onShareTimeline() {
  return {
    title: '发现一个好用的股票分析工具',
    query: 'from=timeline'
  }
}
```

## 数据统计

### 1. 埋点统计
```javascript
// 关键行为统计
function trackEvent(eventName, params = {}) {
  wx.reportAnalytics(eventName, {
    ...params,
    timestamp: Date.now()
  })
}

// 使用示例
trackEvent('stock_search', { keyword: '腾讯' })
trackEvent('add_favorite', { stock_code: 'hk00700' })
```

### 2. 性能统计
```javascript
// 页面性能统计
function reportPerformance(pageName, loadTime) {
  wx.reportPerformance(1, loadTime, pageName)
}
```

## 应急处理

### 1. 紧急修复
- 准备热修复方案
- 建立应急发布流程
- 准备回滚方案

### 2. 服务降级
```javascript
// API服务降级
async function getStockDataWithFallback(codes) {
  try {
    return await primaryAPI.getStockInfo(codes)
  } catch (error) {
    console.warn('主API失败，使用备用API')
    return await backupAPI.getStockInfo(codes)
  }
}
```

### 3. 用户通知
```javascript
// 系统通知
function showSystemNotice(message) {
  wx.showModal({
    title: '系统通知',
    content: message,
    showCancel: false
  })
}
```

## 合规要求

### 1. 用户协议
- 制定用户服务协议
- 隐私政策说明
- 免责声明

### 2. 数据安全
- 用户数据加密存储
- 敏感信息脱敏处理
- 定期安全检查

### 3. 内容审核
- 确保内容合规
- 避免敏感信息
- 遵守平台规范

通过以上步骤，可以确保小程序顺利发布并稳定运行。
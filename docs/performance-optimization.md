# 性能优化指南

## 数据加载优化

### 1. API请求优化
```javascript
// 批量请求股票数据
async function batchLoadStocks(stockCodes) {
  const batchSize = 10 // 每批最多10只股票
  const batches = []
  
  for (let i = 0; i < stockCodes.length; i += batchSize) {
    batches.push(stockCodes.slice(i, i + batchSize))
  }
  
  const results = await Promise.all(
    batches.map(batch => this.stockAPI.getStockInfo(batch.join(',')))
  )
  
  return results.flat()
}
```

### 2. 数据缓存策略
```javascript
// 智能缓存管理
class DataCache {
  constructor() {
    this.cache = new Map()
    this.expireTime = 30 * 1000 // 30秒过期
  }
  
  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }
  
  get(key) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() - item.timestamp > this.expireTime) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
}
```

### 3. 分页加载
```javascript
// 收藏列表分页加载
loadFavoriteStocks(page = 1, pageSize = 20) {
  const favorites = Storage.getFavoriteStocks()
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return favorites.slice(start, end)
}
```

## 渲染性能优化

### 1. 虚拟列表
```javascript
// 大量数据时使用虚拟滚动
<scroll-view 
  scroll-y="true" 
  style="height: 600rpx;"
  bindscrolltolower="loadMore"
  enable-back-to-top="true">
  <view wx:for="{{visibleItems}}" wx:key="id">
    <!-- 股票卡片内容 -->
  </view>
</scroll-view>
```

### 2. 图片懒加载
```javascript
// 图标懒加载
<image 
  src="{{item.loaded ? item.iconUrl : '/images/placeholder.png'}}" 
  bindload="onImageLoad"
  data-index="{{index}}"
  lazy-load="true" />
```

### 3. 防抖处理
```javascript
// 搜索防抖
let searchTimer = null

onSearchInput(e) {
  const keyword = e.detail.value
  
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  
  searchTimer = setTimeout(() => {
    this.searchStocks(keyword)
  }, 300)
}
```

## 内存管理

### 1. 及时清理定时器
```javascript
onUnload() {
  // 清理定时器
  if (this.refreshTimer) {
    clearInterval(this.refreshTimer)
    this.refreshTimer = null
  }
  
  // 清理事件监听
  if (this.networkListener) {
    wx.offNetworkStatusChange(this.networkListener)
  }
}
```

### 2. 控制缓存大小
```javascript
// 限制缓存条目数量
class LimitedCache {
  constructor(maxSize = 100) {
    this.cache = new Map()
    this.maxSize = maxSize
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, value)
  }
}
```

## 网络优化

### 1. 请求合并
```javascript
// 合并同时发起的相同请求
class RequestManager {
  constructor() {
    this.pendingRequests = new Map()
  }
  
  async request(url) {
    if (this.pendingRequests.has(url)) {
      return this.pendingRequests.get(url)
    }
    
    const promise = wx.request({ url })
    this.pendingRequests.set(url, promise)
    
    try {
      const result = await promise
      return result
    } finally {
      this.pendingRequests.delete(url)
    }
  }
}
```

### 2. 错误重试机制
```javascript
// 自动重试失败的请求
async function requestWithRetry(url, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await wx.request({ url })
    } catch (error) {
      if (i === maxRetries - 1) throw error
      
      // 指数退避
      await new Promise(resolve => 
        setTimeout(resolve, Math.pow(2, i) * 1000)
      )
    }
  }
}
```

## 用户体验优化

### 1. 骨架屏
```javascript
// 加载时显示骨架屏
<view wx:if="{{loading}}" class="skeleton">
  <view class="skeleton-card">
    <view class="skeleton-title"></view>
    <view class="skeleton-content"></view>
  </view>
</view>
```

### 2. 预加载
```javascript
// 预加载下一页数据
onReachBottom() {
  if (!this.loading && this.hasMore) {
    this.loadNextPage()
  }
}

// 预加载热门股票
onShow() {
  // 延迟预加载，避免影响当前页面
  setTimeout(() => {
    this.preloadHotStocks()
  }, 1000)
}
```

### 3. 离线支持
```javascript
// 离线数据支持
async function getStockDataWithFallback(codes) {
  try {
    // 尝试获取在线数据
    const onlineData = await this.stockAPI.getStockInfo(codes)
    
    // 缓存到本地
    wx.setStorageSync(`stock_${codes}`, {
      data: onlineData,
      timestamp: Date.now()
    })
    
    return onlineData
  } catch (error) {
    // 网络失败时使用缓存数据
    const cached = wx.getStorageSync(`stock_${codes}`)
    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.data
    }
    
    throw error
  }
}
```

## 监控和调试

### 1. 性能监控
```javascript
// 页面性能监控
class PerformanceMonitor {
  static trackPageLoad(pageName) {
    const startTime = Date.now()
    
    return {
      end() {
        const duration = Date.now() - startTime
        console.log(`页面 ${pageName} 加载耗时: ${duration}ms`)
        
        // 上报性能数据
        if (duration > 3000) {
          console.warn(`页面 ${pageName} 加载过慢: ${duration}ms`)
        }
      }
    }
  }
}

// 使用示例
onLoad() {
  const monitor = PerformanceMonitor.trackPageLoad('首页')
  
  this.initPage().finally(() => {
    monitor.end()
  })
}
```

### 2. 错误监控
```javascript
// 全局错误处理
App({
  onError(error) {
    console.error('小程序错误:', error)
    
    // 上报错误信息
    this.reportError({
      error: error.toString(),
      stack: error.stack,
      timestamp: Date.now(),
      page: getCurrentPages().pop().route
    })
  },
  
  reportError(errorInfo) {
    // 发送错误报告到服务器
    wx.request({
      url: 'https://api.example.com/error-report',
      method: 'POST',
      data: errorInfo
    })
  }
})
```

## 最佳实践总结

1. **数据请求**: 使用批量请求、智能缓存、请求合并
2. **渲染优化**: 虚拟列表、懒加载、防抖处理
3. **内存管理**: 及时清理资源、控制缓存大小
4. **用户体验**: 骨架屏、预加载、离线支持
5. **监控调试**: 性能监控、错误上报

通过这些优化措施，可以显著提升小程序的性能和用户体验。
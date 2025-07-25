// utils/cache.js
/**
 * 数据缓存工具类
 * 用于优化股票数据请求性能
 */

class DataCache {
  constructor() {
    this.cache = new Map()
    this.defaultTTL = 30 * 1000 // 默认缓存30秒
    this.maxCacheSize = 100 // 最大缓存条目数
  }

  /**
   * 生成缓存键
   * @param {string} type 缓存类型
   * @param {string} key 缓存键
   * @returns {string}
   */
  generateKey(type, key) {
    return `${type}:${key}`
  }

  /**
   * 设置缓存
   * @param {string} type 缓存类型
   * @param {string} key 缓存键
   * @param {any} data 缓存数据
   * @param {number} ttl 过期时间（毫秒）
   */
  set(type, key, data, ttl = this.defaultTTL) {
    const cacheKey = this.generateKey(type, key)
    const expireTime = Date.now() + ttl
    
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(cacheKey, {
      data,
      expireTime,
      createTime: Date.now()
    })
    
    console.log(`缓存已设置: ${cacheKey}, 过期时间: ${new Date(expireTime).toLocaleTimeString()}`)
  }

  /**
   * 获取缓存
   * @param {string} type 缓存类型
   * @param {string} key 缓存键
   * @returns {any|null}
   */
  get(type, key) {
    const cacheKey = this.generateKey(type, key)
    const cacheItem = this.cache.get(cacheKey)
    
    if (!cacheItem) {
      return null
    }
    
    // 检查是否过期
    if (Date.now() > cacheItem.expireTime) {
      this.cache.delete(cacheKey)
      console.log(`缓存已过期并删除: ${cacheKey}`)
      return null
    }
    
    console.log(`缓存命中: ${cacheKey}`)
    return cacheItem.data
  }

  /**
   * 删除缓存
   * @param {string} type 缓存类型
   * @param {string} key 缓存键
   */
  delete(type, key) {
    const cacheKey = this.generateKey(type, key)
    const deleted = this.cache.delete(cacheKey)
    if (deleted) {
      console.log(`缓存已删除: ${cacheKey}`)
    }
    return deleted
  }

  /**
   * 清空指定类型的缓存
   * @param {string} type 缓存类型
   */
  clearType(type) {
    const keysToDelete = []
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${type}:`)) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key))
    console.log(`已清空 ${type} 类型的缓存，共删除 ${keysToDelete.length} 条`)
  }

  /**
   * 清空所有缓存
   */
  clear() {
    const size = this.cache.size
    this.cache.clear()
    console.log(`已清空所有缓存，共删除 ${size} 条`)
  }

  /**
   * 获取缓存统计信息
   * @returns {Object}
   */
  getStats() {
    const stats = {
      total: this.cache.size,
      types: {}
    }
    
    for (const key of this.cache.keys()) {
      const type = key.split(':')[0]
      stats.types[type] = (stats.types[type] || 0) + 1
    }
    
    return stats
  }

  /**
   * 清理过期缓存
   */
  cleanup() {
    const now = Date.now()
    const keysToDelete = []
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expireTime) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key))
    
    if (keysToDelete.length > 0) {
      console.log(`清理过期缓存，共删除 ${keysToDelete.length} 条`)
    }
    
    return keysToDelete.length
  }
}

// 创建全局缓存实例
const globalCache = new DataCache()

// 定期清理过期缓存
setInterval(() => {
  globalCache.cleanup()
}, 60 * 1000) // 每分钟清理一次

/**
 * 缓存装饰器函数
 * @param {string} type 缓存类型
 * @param {number} ttl 过期时间
 * @returns {Function}
 */
function cached(type, ttl) {
  return function(target, propertyName, descriptor) {
    const method = descriptor.value
    
    descriptor.value = async function(...args) {
      const cacheKey = JSON.stringify(args)
      
      // 尝试从缓存获取
      const cachedResult = globalCache.get(type, cacheKey)
      if (cachedResult !== null) {
        return cachedResult
      }
      
      // 执行原方法
      const result = await method.apply(this, args)
      
      // 缓存结果
      if (result) {
        globalCache.set(type, cacheKey, result, ttl)
      }
      
      return result
    }
    
    return descriptor
  }
}

module.exports = {
  DataCache,
  globalCache,
  cached
}
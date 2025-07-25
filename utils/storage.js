// utils/storage.js

/**
 * 本地存储工具类
 */
class Storage {
  /**
   * 获取收藏的股票列表
   * @returns {Array}
   */
  static getFavoriteStocks() {
    try {
      return wx.getStorageSync('favoriteStocks') || []
    } catch (error) {
      console.error('获取收藏列表失败:', error)
      return []
    }
  }

  /**
   * 保存收藏的股票列表
   * @param {Array} stocks 股票列表
   */
  static setFavoriteStocks(stocks) {
    try {
      wx.setStorageSync('favoriteStocks', stocks)
    } catch (error) {
      console.error('保存收藏列表失败:', error)
    }
  }

  /**
   * 添加收藏股票
   * @param {Object} stock 股票信息
   */
  static addFavoriteStock(stock) {
    const favorites = this.getFavoriteStocks()
    const exists = favorites.find(item => 
      item.hCode === stock.hCode && item.aCode === stock.aCode
    )
    
    if (!exists) {
      favorites.push({
        ...stock,
        addTime: Date.now()
      })
      this.setFavoriteStocks(favorites)
    }
  }

  /**
   * 移除收藏股票
   * @param {string} hCode H股代码
   * @param {string} aCode A股代码
   */
  static removeFavoriteStock(hCode, aCode) {
    const favorites = this.getFavoriteStocks()
    const filtered = favorites.filter(item => 
      !(item.hCode === hCode && item.aCode === aCode)
    )
    this.setFavoriteStocks(filtered)
  }

  /**
   * 检查是否已收藏
   * @param {string} hCode H股代码
   * @param {string} aCode A股代码
   * @returns {boolean}
   */
  static isFavorite(hCode, aCode) {
    const favorites = this.getFavoriteStocks()
    return favorites.some(item => 
      item.hCode === hCode && item.aCode === aCode
    )
  }

  /**
   * 清空所有收藏股票
   */
  static clearFavoriteStocks() {
    try {
      wx.removeStorageSync('favoriteStocks')
      console.log('清空收藏股票成功')
    } catch (error) {
      console.error('清空收藏股票失败:', error)
    }
  }

  /**
   * 获取用户设置
   * @returns {Object}
   */
  static getUserSettings() {
    try {
      return wx.getStorageSync('userSettings') || {
        refreshInterval: 30, // 刷新间隔（秒）
        priceAlert: true, // 价格提醒
        premiumAlert: true, // 溢价率提醒
        alertThreshold: 5, // 提醒阈值（%）
        theme: 'light', // 主题
        exchangeRate: 0.914 // 汇率设置
      }
    } catch (error) {
      console.error('获取用户设置失败:', error)
      return {
        exchangeRate: 0.914 // 默认汇率
      }
    }
  }

  /**
   * 保存用户设置
   * @param {Object} settings 设置对象
   */
  static setUserSettings(settings) {
    try {
      const currentSettings = this.getUserSettings()
      const newSettings = { ...currentSettings, ...settings }
      wx.setStorageSync('userSettings', newSettings)
    } catch (error) {
      console.error('保存用户设置失败:', error)
    }
  }

  /**
   * 获取搜索历史
   * @returns {Array}
   */
  static getSearchHistory() {
    try {
      return wx.getStorageSync('searchHistory') || []
    } catch (error) {
      console.error('获取搜索历史失败:', error)
      return []
    }
  }

  /**
   * 添加搜索历史
   * @param {string} keyword 搜索关键词
   */
  static addSearchHistory(keyword) {
    if (!keyword || typeof keyword !== 'string' || !keyword.trim()) return
    
    const history = this.getSearchHistory()
    const filtered = history.filter(item => item !== keyword)
    filtered.unshift(keyword)
    
    // 只保留最近10条
    const newHistory = filtered.slice(0, 10)
    
    try {
      wx.setStorageSync('searchHistory', newHistory)
    } catch (error) {
      console.error('保存搜索历史失败:', error)
    }
  }

  /**
   * 清空搜索历史
   */
  static clearSearchHistory() {
    try {
      wx.removeStorageSync('searchHistory')
    } catch (error) {
      console.error('清空搜索历史失败:', error)
    }
  }

  /**
   * 获取价格提醒列表
   * @returns {Array}
   */
  static getPriceAlerts() {
    try {
      return wx.getStorageSync('priceAlerts') || []
    } catch (error) {
      console.error('获取价格提醒失败:', error)
      return []
    }
  }

  /**
   * 添加价格提醒
   * @param {Object} alert 提醒配置
   */
  static addPriceAlert(alert) {
    const alerts = this.getPriceAlerts()
    alerts.push({
      ...alert,
      id: Date.now(),
      createTime: Date.now(),
      enabled: true
    })
    
    try {
      wx.setStorageSync('priceAlerts', alerts)
    } catch (error) {
      console.error('添加价格提醒失败:', error)
    }
  }

  /**
   * 移除价格提醒
   * @param {number} alertId 提醒ID
   */
  static removePriceAlert(alertId) {
    const alerts = this.getPriceAlerts()
    const filtered = alerts.filter(item => item.id !== alertId)
    
    try {
      wx.setStorageSync('priceAlerts', filtered)
    } catch (error) {
      console.error('移除价格提醒失败:', error)
    }
  }

  /**
   * 清除所有数据
   */
  static clearAll() {
    try {
      wx.clearStorageSync()
      console.log('清除所有本地存储数据成功')
    } catch (error) {
      console.error('清除所有本地存储数据失败:', error)
    }
  }
}

module.exports = Storage
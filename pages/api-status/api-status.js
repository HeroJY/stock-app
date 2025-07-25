// pages/api-status/api-status.js
const { StockAPI } = require('../../utils/api')

Page({
  data: {
    apiStatus: {
      currentSource: '未知',
      availableSources: 0,
      cacheStats: { total: 0, types: {} }
    },
    testResults: [],
    testing: false,
    lastUpdate: ''
  },

  onLoad() {
    this.stockAPI = new StockAPI()
    this.loadAPIStatus()
  },

  onShow() {
    this.loadAPIStatus()
  },

  /**
   * 加载API状态
   */
  loadAPIStatus() {
    try {
      const status = this.stockAPI.getAPIStatus()
      this.setData({
        apiStatus: status,
        lastUpdate: this.formatTime(new Date())
      })
    } catch (error) {
      console.error('获取API状态失败:', error)
    }
  },

  /**
   * 测试API接口
   */
  async testAPIs() {
    this.setData({ testing: true, testResults: [] })
    
    const testCodes = ['hk01299', 'sh601318'] // 测试用的股票代码
    const results = []
    
    try {
      // 测试股票数据获取
      const startTime = Date.now()
      const stockData = await this.stockAPI.getStockInfo(testCodes.join(','))
      const endTime = Date.now()
      
      results.push({
        name: '股票数据获取',
        success: stockData && stockData.length > 0,
        responseTime: endTime - startTime,
        details: `获取到 ${stockData ? stockData.length : 0} 条数据`
      })
      
      // 测试汇率获取
      const rateStartTime = Date.now()
      const exchangeRate = await this.stockAPI.getExchangeRate()
      const rateEndTime = Date.now()
      
      results.push({
        name: '汇率数据获取',
        success: exchangeRate && exchangeRate > 0,
        responseTime: rateEndTime - rateStartTime,
        details: `汇率: ${exchangeRate}`
      })
      
      // 测试搜索功能
      const searchStartTime = Date.now()
      const searchResults = await this.stockAPI.searchStock('中国')
      const searchEndTime = Date.now()
      
      results.push({
        name: '股票搜索',
        success: searchResults && searchResults.length > 0,
        responseTime: searchEndTime - searchStartTime,
        details: `搜索到 ${searchResults ? searchResults.length : 0} 条结果`
      })
      
    } catch (error) {
      console.error('API测试失败:', error)
      results.push({
        name: 'API测试',
        success: false,
        responseTime: 0,
        details: `错误: ${error.message}`
      })
    }
    
    this.setData({ 
      testResults: results,
      testing: false
    })
    
    // 更新状态
    this.loadAPIStatus()
  },

  /**
   * 清除缓存
   */
  clearCache() {
    wx.showModal({
      title: '确认清除',
      content: '确定要清除所有缓存数据吗？',
      success: (res) => {
        if (res.confirm) {
          try {
            this.stockAPI.clearCache()
            wx.showToast({ title: '缓存已清除', icon: 'success' })
            this.loadAPIStatus()
          } catch (error) {
            console.error('清除缓存失败:', error)
            wx.showToast({ title: '清除失败', icon: 'error' })
          }
        }
      }
    })
  },

  /**
   * 刷新状态
   */
  refreshStatus() {
    this.loadAPIStatus()
    wx.showToast({ title: '状态已刷新', icon: 'success' })
  },

  /**
   * 格式化时间
   */
  formatTime(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  },

  /**
   * 格式化响应时间
   */
  formatResponseTime(ms) {
    if (ms < 1000) {
      return `${ms}ms`
    } else {
      return `${(ms / 1000).toFixed(2)}s`
    }
  }
})
// app.js
App({
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        console.log('登录成功', res.code)
      }
    })
  },
  
  globalData: {
    userInfo: null,
    // 汇率缓存
    exchangeRate: null,
    exchangeRateUpdateTime: null,
    // 收藏的股票列表
    favoriteStocks: [],
    // API配置
    apiConfig: {
      stockApi: 'https://qt.gtimg.com/q=',
      exchangeRateApi: 'https://api.exchangerate-api.com/v4/latest/HKD'
    }
  },

  // 获取汇率
  getExchangeRate() {
    return new Promise((resolve, reject) => {
      const now = Date.now()
      // 如果汇率缓存存在且未过期（5分钟内）
      if (this.globalData.exchangeRate && 
          this.globalData.exchangeRateUpdateTime && 
          (now - this.globalData.exchangeRateUpdateTime) < 5 * 60 * 1000) {
        resolve(this.globalData.exchangeRate)
        return
      }

      wx.request({
        url: this.globalData.apiConfig.exchangeRateApi,
        success: (res) => {
          if (res.statusCode === 200 && res.data.rates && res.data.rates.CNY) {
            this.globalData.exchangeRate = res.data.rates.CNY
            this.globalData.exchangeRateUpdateTime = now
            resolve(res.data.rates.CNY)
          } else {
            // 使用默认汇率
            this.globalData.exchangeRate = 0.92
            resolve(0.92)
          }
        },
        fail: () => {
          // 使用默认汇率
          this.globalData.exchangeRate = 0.92
          resolve(0.92)
        }
      })
    })
  },

  // 计算HA溢价率
  calculatePremiumRate(hPrice, aPrice, exchangeRate) {
    if (!hPrice || !aPrice || !exchangeRate) return 0
    const hPriceInCNY = hPrice * exchangeRate
    return ((hPriceInCNY - aPrice) / aPrice * 100).toFixed(2)
  },

  // 格式化价格
  formatPrice(price) {
    if (!price) return '0.00'
    return parseFloat(price).toFixed(2)
  }
})
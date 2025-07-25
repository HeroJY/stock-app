// pages/detail/detail.js
const { StockAPI, calculatePremiumRate, formatPrice, formatPercent, getPremiumRateClass } = require('../../utils/api')
const Storage = require('../../utils/storage')

Page({
  data: {
    // 股票信息
    hCode: '',
    aCode: '',
    stockName: '',
    
    // 股票数据
    hStock: null,
    aStock: null,
    exchangeRate: 0.92,
    premiumRate: 0,
    premiumRateClass: '',
    
    // 页面状态
    loading: false,
    refreshing: false,
    isFavorite: false,
    
    // 历史数据
    historyData: [],
    showHistory: false,
    
    // 提醒设置
    showAlertModal: false,
    alertPrice: '',
    alertType: 'price' // price, premium
  },

  onLoad(options) {
    this.stockAPI = new StockAPI()
    
    if (options.hCode && options.aCode) {
      this.setData({
        hCode: options.hCode,
        aCode: options.aCode,
        stockName: options.name || '股票详情'
      })
      
      // 设置导航栏标题
      wx.setNavigationBarTitle({
        title: options.name || '股票详情'
      })
      
      this.loadStockData()
      this.checkFavoriteStatus()
    }
  },

  onShow() {
    this.checkFavoriteStatus()
  },

  onPullDownRefresh() {
    this.refreshData()
  },

  /**
   * 加载股票数据
   */
  async loadStockData() {
    this.setData({ loading: true })
    
    try {
      // 并行加载汇率和股票数据，强制刷新
      const [exchangeRate, stockData] = await Promise.all([
        this.stockAPI.getExchangeRate(true),
        this.getStockData()
      ])
      
      this.setData({ exchangeRate })
      
      if (stockData) {
        this.updateStockDisplay(stockData)
      }
      
    } catch (error) {
      console.error('加载股票数据失败:', error)
      wx.showToast({ title: '加载失败', icon: 'error' })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 获取股票数据
   */
  async getStockData() {
    const { hCode, aCode } = this.data
    const codes = `${hCode},${aCode}`
    
    try {
      // 强制刷新股票数据
      const stocks = await this.stockAPI.getStockInfo(codes, true)
      
      if (stocks.length >= 2) {
        const hStock = stocks.find(s => s.code === hCode)
        const aStock = stocks.find(s => s.code === aCode)
        
        if (hStock && aStock) {
          return { hStock, aStock }
        }
      }
      
      return null
    } catch (error) {
      console.error('获取股票数据失败:', error)
      return null
    }
  },

  /**
   * 更新股票显示
   */
  updateStockDisplay(stockData) {
    const { hStock, aStock } = stockData
    const { exchangeRate } = this.data
    
    // 计算溢价率
    const premiumRate = calculatePremiumRate(
      hStock.currentPrice,
      aStock.currentPrice,
      exchangeRate
    )
    
    this.setData({
      hStock: {
        ...hStock,
        currentPrice: formatPrice(hStock.currentPrice),
        change: formatPrice(hStock.change, 2, true),
        changePercent: formatPercent(hStock.changePercent)
      },
      aStock: {
        ...aStock,
        currentPrice: formatPrice(aStock.currentPrice),
        change: formatPrice(aStock.change, 2, true),
        changePercent: formatPercent(aStock.changePercent)
      },
      premiumRate: formatPercent(premiumRate),
      premiumRateClass: getPremiumRateClass(premiumRate),
      exchangeRate: formatPrice(exchangeRate, 4)
    })
  },

  /**
   * 刷新数据
   */
  async refreshData() {
    this.setData({ refreshing: true })
    
    try {
      await this.loadStockData()
      wx.showToast({ title: '刷新成功', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: '刷新失败', icon: 'error' })
    } finally {
      this.setData({ refreshing: false })
      wx.stopPullDownRefresh()
    }
  },

  /**
   * 检查收藏状态
   */
  checkFavoriteStatus() {
    const { hCode, aCode } = this.data
    const isFavorite = Storage.isFavorite(hCode, aCode)
    this.setData({ isFavorite })
  },

  /**
   * 切换收藏状态
   */
  toggleFavorite() {
    const { hCode, aCode, stockName, isFavorite } = this.data
    
    if (isFavorite) {
      Storage.removeFavoriteStock(hCode, aCode)
      wx.showToast({ title: '已取消收藏', icon: 'success' })
    } else {
      Storage.addFavoriteStock({
        hCode,
        aCode,
        name: stockName
      })
      wx.showToast({ title: '已添加收藏', icon: 'success' })
    }
    
    this.setData({ isFavorite: !isFavorite })
  },

  /**
   * 显示历史数据
   */
  showHistoryData() {
    // 生成模拟历史数据
    const historyData = this.generateMockHistoryData()
    this.setData({ 
      historyData,
      showHistory: true 
    })
  },

  /**
   * 隐藏历史数据
   */
  hideHistoryData() {
    this.setData({ showHistory: false })
  },

  /**
   * 生成模拟历史数据
   */
  generateMockHistoryData() {
    const data = []
    const now = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const baseRate = -2 + Math.random() * 8 // -2% 到 6% 的溢价率
      
      data.push({
        date: this.formatDate(date),
        premiumRate: formatPercent(baseRate),
        premiumRateClass: getPremiumRateClass(baseRate)
      })
    }
    
    return data
  },

  /**
   * 显示提醒设置
   */
  showAlertSetting() {
    this.setData({ showAlertModal: true })
  },

  /**
   * 隐藏提醒设置
   */
  hideAlertSetting() {
    this.setData({ 
      showAlertModal: false,
      alertPrice: '',
      alertType: 'price'
    })
  },

  /**
   * 提醒类型切换
   */
  onAlertTypeChange(e) {
    this.setData({ alertType: e.detail.value })
  },

  /**
   * 提醒价格输入
   */
  onAlertPriceInput(e) {
    this.setData({ alertPrice: e.detail.value })
  },

  /**
   * 确认设置提醒
   */
  confirmAlert() {
    const { hCode, aCode, stockName, alertPrice, alertType } = this.data
    
    if (!alertPrice || isNaN(parseFloat(alertPrice))) {
      wx.showToast({ title: '请输入有效价格', icon: 'error' })
      return
    }
    
    const alert = {
      hCode,
      aCode,
      stockName,
      alertType,
      targetValue: parseFloat(alertPrice),
      createTime: Date.now()
    }
    
    Storage.addPriceAlert(alert)
    
    this.hideAlertSetting()
    wx.showToast({ title: '提醒设置成功', icon: 'success' })
  },

  /**
   * 分享股票
   */
  onShareAppMessage() {
    const { hCode, aCode, stockName } = this.data
    
    return {
      title: `${stockName} - HA溢价率查询`,
      path: `/pages/detail/detail?hCode=${hCode}&aCode=${aCode}&name=${stockName}`,
      imageUrl: '/images/share-logo.png'
    }
  },

  /**
   * 复制股票代码
   */
  copyStockCode(e) {
    const code = e.currentTarget.dataset.code
    
    wx.setClipboardData({
      data: code,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  /**
   * 查看更多信息
   */
  showMoreInfo() {
    const { hCode, aCode, stockName } = this.data
    
    wx.showModal({
      title: '股票信息',
      content: `股票名称：${stockName}\nH股代码：${hCode}\nA股代码：${aCode}\n\n溢价率说明：\n正值表示H股相对A股溢价\n负值表示H股相对A股折价`,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 格式化日期
   */
  formatDate(date) {
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  }
})
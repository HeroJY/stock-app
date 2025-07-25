// pages/favorites/favorites.js
const { StockAPI, calculatePremiumRate, formatPrice, formatPercent, getPremiumRateClass } = require('../../utils/api')
const Storage = require('../../utils/storage')

Page({
  data: {
    favoriteStocks: [],
    loading: false,
    exchangeRate: 0.914,
    autoRefreshTimer: null,
    refreshInterval: 30000 // 默认30秒
  },

  onLoad() {
    this.stockAPI = new StockAPI()
  },

  onShow() {
    this.loadFavoriteStocks()
    this.startAutoRefresh()
  },

  onHide() {
    this.stopAutoRefresh()
  },

  onUnload() {
    this.stopAutoRefresh()
  },

  onPullDownRefresh() {
    this.refreshAllStocks()
  },

  /**
   * 加载收藏的股票
   */
  async loadFavoriteStocks() {
    const favorites = Storage.getFavoriteStocks()
    console.log('获取收藏列表:', favorites)
    
    if (favorites.length === 0) {
      this.setData({ favoriteStocks: [] })
      return
    }

    this.setData({ loading: true })

    try {
      // 获取汇率
      const exchangeRate = await this.stockAPI.getExchangeRate()
      this.setData({ exchangeRate })

      // 获取股票数据
      const stocksWithData = []
      
      for (const favorite of favorites) {
        const stockData = await this.getStockData(favorite, exchangeRate)
        if (stockData) {
          stocksWithData.push(stockData)
        }
      }
      
      this.setData({ favoriteStocks: stocksWithData })

    } catch (error) {
      console.error('加载收藏股票失败:', error)
      wx.showToast({ title: '加载失败', icon: 'error' })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 获取单个股票数据
   */
  async getStockData(favorite, exchangeRate) {
    try {
      const codes = `${favorite.hCode},${favorite.aCode}`
      const stocks = await this.stockAPI.getStockInfo(codes)
      
      if (stocks.length >= 2) {
        const hStock = stocks.find(s => s.code === favorite.hCode)
        const aStock = stocks.find(s => s.code === favorite.aCode)
        
        if (hStock && aStock) {
          const premiumRate = calculatePremiumRate(
            hStock.currentPrice, 
            aStock.currentPrice, 
            exchangeRate
          )
          
          return {
            id: `${favorite.hCode}_${favorite.aCode}`,
            name: favorite.name,
            hCode: favorite.hCode,
            aCode: favorite.aCode,
            hPrice: formatPrice(hStock.currentPrice),
            aPrice: formatPrice(aStock.currentPrice),
            hChange: hStock.change,
            aChange: aStock.change,
            hChangePercent: formatPrice(hStock.changePercent),
            aChangePercent: formatPrice(aStock.changePercent),
            premiumRate: premiumRate,
            premiumRateClass: getPremiumRateClass(premiumRate),
            addTime: favorite.addTime,
            addTimeText: this.formatAddTime(favorite.addTime),
            updateTime: this.formatTime(new Date()),
            selected: false
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('获取股票数据失败:', error)
      return null
    }
  },

  /**
   * 从收藏中移除
   */
  removeFromFavorites(e) {
    const stock = e.currentTarget.dataset.stock
    console.log('移除收藏:', stock)
    
    wx.showModal({
      title: '确认移除',
      content: `确定要从收藏中移除 ${stock.name} 吗？`,
      success: (res) => {
        if (res.confirm) {
          Storage.removeFavoriteStock(stock.hCode, stock.aCode)
          this.loadFavoriteStocks()
          wx.showToast({ title: '已移除', icon: 'success' })
        }
      }
    })
  },

  /**
   * 刷新单个股票
   */
  async refreshStock(e) {
    const stock = e.currentTarget.dataset.stock
    console.log('刷新单个股票:', stock)
    
    wx.showLoading({ title: '刷新中...' })
    
    try {
      const exchangeRate = await this.stockAPI.getExchangeRate()
      const newStockData = await this.getStockData({
        hCode: stock.hCode,
        aCode: stock.aCode,
        name: stock.name,
        addTime: stock.addTime
      }, exchangeRate)
      
      if (newStockData) {
        const favoriteStocks = this.data.favoriteStocks.map(item => 
          item.id === stock.id ? newStockData : item
        )
        
        this.setData({ favoriteStocks })
        wx.showToast({ title: '刷新成功', icon: 'success' })
      }
    } catch (error) {
      wx.showToast({ title: '刷新失败', icon: 'error' })
    } finally {
      wx.hideLoading()
    }
  },

  /**
   * 刷新全部股票
   */
  async refreshAllStocks() {
    console.log('刷新全部股票')
    try {
      await this.loadFavoriteStocks()
      wx.showToast({ title: '刷新成功', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: '刷新失败', icon: 'error' })
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  /**
   * 开始自动刷新
   */
  startAutoRefresh() {
    // 先停止之前的定时器
    this.stopAutoRefresh()
    
    // 获取用户设置的刷新间隔
    const settings = wx.getStorageSync('userSettings') || {}
    const refreshInterval = (settings.refreshInterval || 30) * 1000 // 转换为毫秒
    
    // 检查是否启用了自动刷新
    if (!settings.wifiAutoRefresh && !settings.realTimePush) {
      console.log('自动刷新已禁用')
      return
    }
    
    console.log(`开始自动刷新，间隔: ${refreshInterval/1000}秒`)
    
    this.setData({ 
      autoRefreshTimer: setInterval(() => {
        console.log('执行自动刷新')
        this.autoRefreshStocks()
      }, refreshInterval)
    })
  },

  /**
   * 停止自动刷新
   */
  stopAutoRefresh() {
    if (this.data.autoRefreshTimer) {
      clearInterval(this.data.autoRefreshTimer)
      this.setData({ autoRefreshTimer: null })
      console.log('停止自动刷新')
    }
  },

  /**
   * 自动刷新股票数据
   */
  async autoRefreshStocks() {
    // 如果正在加载中，跳过本次刷新
    if (this.data.loading) {
      console.log('正在加载中，跳过自动刷新')
      return
    }

    try {
      console.log('开始自动刷新股票数据')
      await this.loadFavoriteStocks()
      console.log('自动刷新完成')
    } catch (error) {
      console.error('自动刷新失败:', error)
    }
  },

  /**
   * 工具方法
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
   * 格式化添加时间
   */
  formatAddTime(timestamp) {
    if (!timestamp) return '未知';
    
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    
    if (days === 0) {
      return '今天';
    } else if (days === 1) {
      return '昨天';
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      const date = new Date(timestamp);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${month}-${day}`;
    }
  }
})
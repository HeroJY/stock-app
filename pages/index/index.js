// pages/index/index.js
const { StockAPI, calculatePremiumRate, formatPrice, formatPercent, getPremiumRateClass } = require('../../utils/api')
const Storage = require('../../utils/storage')

Page({
  data: {
    stockPairs: [],
    exchangeRate: 0.914,
    exchangeRateTime: '',
    loading: false,
    searchKeyword: '',
    showSearchModal: false,
    searchResults: [],
    searchHistory: [],
    searchLoading: false,
    showSearchResults: false
  },

  onLoad() {
    this.stockAPI = new StockAPI()
    this.initData()
  },

  onShow() {
    this.loadFavoriteStocks()
  },

  onPullDownRefresh() {
    this.refreshData()
  },

  /**
   * 初始化数据
   */
  async initData() {
    this.setData({ loading: true })
    
    try {
      // 获取汇率
      const exchangeRate = await this.stockAPI.getExchangeRate()
      this.setData({ 
        exchangeRate: formatPrice(exchangeRate, 4),
        exchangeRateTime: this.formatTime(new Date())
      })
      
      // 加载收藏的股票
      await this.loadFavoriteStocks()
      
      // 加载搜索历史
      const searchHistory = Storage.getSearchHistory()
      this.setData({ searchHistory })
      
    } catch (error) {
      console.error('初始化数据失败:', error)
      wx.showToast({ title: '加载失败', icon: 'error' })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 加载收藏的股票
   */
  async loadFavoriteStocks() {
    try {
      const favorites = Storage.getFavoriteStocks()
      
      if (favorites.length === 0) {
        this.setData({ stockPairs: [] })
        return
      }

      const stockPairs = []
      
      for (const favorite of favorites) {
        const stockData = await this.getStockPairData(favorite.hCode, favorite.aCode, favorite.name)
        if (stockData) {
          stockPairs.push(stockData)
        }
      }
      
      this.setData({ stockPairs })
      
    } catch (error) {
      console.error('加载收藏股票失败:', error)
    }
  },

  /**
   * 获取股票对数据
   */
  async getStockPairData(hCode, aCode, name) {
    try {
      const codes = `${hCode},${aCode}`
      const stocks = await this.stockAPI.getStockInfo(codes)
      
      if (stocks.length >= 2) {
        const hStock = stocks.find(s => s.code === hCode)
        const aStock = stocks.find(s => s.code === aCode)
        
        if (hStock && aStock) {
          const premiumRate = calculatePremiumRate(
            hStock.currentPrice, 
            aStock.currentPrice, 
            parseFloat(this.data.exchangeRate)
          )
          
          return {
            id: `${hCode}_${aCode}`,
            name: name || hStock.name,
            hCode: hCode,
            aCode: aCode,
            hPrice: formatPrice(hStock.currentPrice),
            aPrice: formatPrice(aStock.currentPrice),
            hChange: hStock.change,
            aChange: aStock.change,
            hChangePercent: formatPrice(hStock.changePercent),
            aChangePercent: formatPrice(aStock.changePercent),
            premiumRate: premiumRate,
            premiumRateClass: getPremiumRateClass(premiumRate),
            isFavorite: Storage.isFavorite(hCode, aCode),
            updateTime: this.formatTime(new Date())
          }
        }
      }
      
      return null
    } catch (error) {
      console.error('获取股票数据失败:', error)
      // 显示API异常提示
      wx.showToast({ 
        title: 'API异常，无法获取股票数据', 
        icon: 'none',
        duration: 3000
      })
      return null
    }
  },

  /**
   * 搜索相关方法
   */
  onSearchTap() {
    console.log('点击搜索框，显示搜索弹窗')
    // 加载搜索历史
    const searchHistory = Storage.getSearchHistory()
    this.setData({ 
      showSearchModal: true,
      searchHistory: searchHistory,
      searchKeyword: '',
      searchResults: [],
      searchLoading: false
    })
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  onSearchConfirm(e) {
    const keyword = e.detail.value.trim()
    if (keyword) {
      this.onSearchBtnTap()
    }
  },

  onSearchBtnTap() {
    const keyword = this.data.searchKeyword.trim()
    if (!keyword) {
      wx.showToast({ title: '请输入股票代码或名称', icon: 'none' })
      return
    }
    this.searchStocks(keyword)
  },

  onModalSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
  },

  async searchStocks(keyword) {
    // 如果没有传入keyword，从输入框获取
    if (!keyword) {
      keyword = this.data.searchKeyword
    }
    
    // 确保keyword是字符串并去除空格
    if (typeof keyword === 'string') {
      keyword = keyword.trim()
    }
    
    console.log('搜索关键词:', keyword)
    
    if (!keyword) {
      wx.showToast({ title: '请输入搜索关键词', icon: 'none' })
      return
    }

    this.setData({ 
      searchLoading: true, 
      searchResults: [],
      showSearchResults: true 
    })

    try {
      // 重置数据源状态，确保API可用
      this.stockAPI.resetDataSourcesAvailability()
      
      // 搜索股票
      console.log('开始搜索股票:', keyword)
      const results = await this.stockAPI.searchStock(keyword)
      console.log('搜索结果:', results)
      
      this.setData({ searchResults: results })

      // 添加到搜索历史
      if (keyword && typeof keyword === 'string') {
        Storage.addSearchHistory(keyword)
        const searchHistory = Storage.getSearchHistory()
        this.setData({ searchHistory })
      }

      // 如果没有结果，显示提示
      if (!results || results.length === 0) {
        wx.showToast({ title: '未找到相关股票', icon: 'none' })
      }

    } catch (error) {
      console.error('搜索失败:', error)
      if (error.message && error.message.includes('API异常')) {
        wx.showToast({ 
          title: 'API异常，无法获取股票数据', 
          icon: 'none',
          duration: 3000
        })
      } else {
        wx.showToast({ title: '搜索失败', icon: 'error' })
      }
    } finally {
      this.setData({ searchLoading: false })
    }
  },

  selectSearchHistory(e) {
    const keyword = e.currentTarget.dataset.keyword
    this.setData({ searchKeyword: keyword })
    this.searchStocks(keyword)
  },

  clearSearchHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          Storage.clearSearchHistory()
          this.setData({ searchHistory: [] })
        }
      }
    })
  },

  hideSearchModal() {
    this.setData({ 
      showSearchModal: false,
      searchKeyword: '',
      searchResults: [],
      searchLoading: false
    })
  },

  /**
   * 添加股票对
   */
  addStockPair(e) {
    const stock = e.currentTarget.dataset.stock
    
    // 添加到收藏
    Storage.addFavoriteStock({
      hCode: stock.code,
      aCode: stock.aCode,
      name: stock.name
    })
    
    // 重新加载数据
    this.loadFavoriteStocks()
    this.hideSearchModal()
    
    wx.showToast({ title: '添加成功', icon: 'success' })
  },

  /**
   * 切换收藏状态
   */
  toggleFavorite(e) {
    const stock = e.currentTarget.dataset.stock
    
    if (stock.isFavorite) {
      Storage.removeFavoriteStock(stock.hCode, stock.aCode)
      wx.showToast({ title: '已取消收藏', icon: 'success' })
    } else {
      Storage.addFavoriteStock({
        hCode: stock.hCode,
        aCode: stock.aCode,
        name: stock.name
      })
      wx.showToast({ title: '已添加收藏', icon: 'success' })
    }
    
    // 更新收藏状态
    const stockPairs = this.data.stockPairs.map(item => {
      if (item.id === stock.id) {
        return { ...item, isFavorite: !item.isFavorite }
      }
      return item
    })
    
    this.setData({ stockPairs })
  },

  /**
   * 刷新汇率
   */
  async refreshExchangeRate() {
    try {
      const exchangeRate = await this.stockAPI.getExchangeRate(true)
      this.setData({ 
        exchangeRate: formatPrice(exchangeRate, 4),
        exchangeRateTime: this.formatTime(new Date())
      })
      wx.showToast({ title: '汇率已更新', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: '更新失败', icon: 'error' })
    }
  },

  /**
   * 刷新数据
   */
  async refreshData() {
    try {
      await this.initData()
      wx.showToast({ title: '刷新成功', icon: 'success' })
    } catch (error) {
      wx.showToast({ title: '刷新失败', icon: 'error' })
    } finally {
      wx.stopPullDownRefresh()
    }
  },

  /**
   * 导航方法
   */
  goToDetail(e) {
    const stock = e.currentTarget.dataset.stock
    wx.navigateTo({
      url: `/pages/detail/detail?hCode=${stock.hCode}&aCode=${stock.aCode}&name=${stock.name}`
    })
  },

  goToFavorites() {
    wx.navigateTo({
      url: '/pages/favorites/favorites'
    })
  },

  goToSettings() {
    wx.navigateTo({
      url: '/pages/settings/settings'
    })
  },



  clearSearch() {
    this.setData({
      searchKeyword: '',
      searchResults: [],
      showSearchResults: false
    })
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
  }
})
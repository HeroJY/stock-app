// pages/alert-manage/alert-manage.js
const Storage = require('../../utils/storage')

Page({
  data: {
    alerts: [],
    filteredAlerts: [],
    filterType: 'all', // all, active, inactive
    loading: false,
    
    // 统计数据
    totalAlerts: 0,
    activeAlerts: 0,
    triggeredToday: 0
  },

  onLoad() {
    wx.setNavigationBarTitle({ title: '提醒管理' })
    this.loadAlerts()
  },

  onShow() {
    this.loadAlerts()
  },

  /**
   * 加载提醒列表
   */
  loadAlerts() {
    this.setData({ loading: true })
    
    try {
      const alerts = Storage.getPriceAlerts()
      
      // 处理提醒数据
      const processedAlerts = alerts.map(alert => ({
        ...alert,
        lastTriggered: this.formatLastTriggered(alert.lastTriggered),
        triggerCount: alert.triggerCount || 0
      }))
      
      this.setData({ alerts: processedAlerts })
      this.updateStats()
      this.filterAlerts()
    } catch (error) {
      console.error('加载提醒失败:', error)
      wx.showToast({ title: '加载失败', icon: 'error' })
    } finally {
      this.setData({ loading: false })
    }
  },

  /**
   * 更新统计数据
   */
  updateStats() {
    const { alerts } = this.data
    const totalAlerts = alerts.length
    const activeAlerts = alerts.filter(alert => alert.enabled).length
    
    // 计算今日触发次数（模拟数据）
    const today = new Date().toDateString()
    const triggeredToday = alerts.reduce((count, alert) => {
      if (alert.lastTriggered && new Date(alert.lastTriggered).toDateString() === today) {
        return count + 1
      }
      return count
    }, 0)
    
    this.setData({
      totalAlerts,
      activeAlerts,
      triggeredToday
    })
  },

  /**
   * 切换筛选类型
   */
  changeFilter(e) {
    const filterType = e.currentTarget.dataset.type
    this.setData({ filterType })
    this.filterAlerts()
  },

  /**
   * 筛选提醒
   */
  filterAlerts() {
    const { alerts, filterType } = this.data
    let filteredAlerts = []
    
    switch (filterType) {
      case 'active':
        filteredAlerts = alerts.filter(alert => alert.enabled)
        break
      case 'inactive':
        filteredAlerts = alerts.filter(alert => !alert.enabled)
        break
      default:
        filteredAlerts = alerts
    }
    
    this.setData({ filteredAlerts })
  },

  /**
   * 切换提醒状态
   */
  toggleAlert(e) {
    const alertId = e.currentTarget.dataset.id
    const enabled = e.detail.value
    
    try {
      // 更新本地数据
      const alerts = this.data.alerts.map(alert => {
        if (alert.id === alertId) {
          return { ...alert, enabled }
        }
        return alert
      })
      
      // 更新存储
      const allAlerts = Storage.getPriceAlerts().map(alert => {
        if (alert.id === alertId) {
          return { ...alert, enabled }
        }
        return alert
      })
      
      wx.setStorageSync('priceAlerts', allAlerts)
      
      this.setData({ alerts })
      this.updateStats()
      this.filterAlerts()
      
      wx.showToast({ 
        title: enabled ? '提醒已启用' : '提醒已禁用', 
        icon: 'success' 
      })
    } catch (error) {
      wx.showToast({ title: '操作失败', icon: 'error' })
    }
  },

  /**
   * 编辑提醒
   */
  editAlert(e) {
    const alert = e.currentTarget.dataset.alert
    wx.navigateTo({
      url: `/pages/alert/alert?hCode=${alert.hCode}&aCode=${alert.aCode}&name=${alert.stockName}&editId=${alert.id}`
    })
  },

  /**
   * 删除提醒
   */
  deleteAlert(e) {
    const alertId = e.currentTarget.dataset.id
    const alert = this.data.alerts.find(item => item.id === alertId)
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除 ${alert.stockName} 的提醒吗？`,
      success: (res) => {
        if (res.confirm) {
          try {
            Storage.removePriceAlert(alertId)
            this.loadAlerts()
            wx.showToast({ title: '删除成功', icon: 'success' })
          } catch (error) {
            wx.showToast({ title: '删除失败', icon: 'error' })
          }
        }
      }
    })
  },

  /**
   * 添加提醒
   */
  goToAddAlert() {
    wx.showActionSheet({
      itemList: ['从收藏中选择', '手动输入股票'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.selectFromFavorites()
        } else {
          wx.navigateTo({ url: '/pages/stock-search/stock-search?action=alert' })
        }
      }
    })
  },

  /**
   * 从收藏中选择
   */
  selectFromFavorites() {
    const favorites = Storage.getFavoriteStocks()
    
    if (favorites.length === 0) {
      wx.showModal({
        title: '提示',
        content: '您还没有收藏任何股票，请先添加收藏或手动输入股票信息。',
        showCancel: false
      })
      return
    }
    
    const itemList = favorites.map(stock => stock.name)
    
    wx.showActionSheet({
      itemList,
      success: (res) => {
        const selected = favorites[res.tapIndex]
        wx.navigateTo({
          url: `/pages/alert/alert?hCode=${selected.hCode}&aCode=${selected.aCode}&name=${selected.name}`
        })
      }
    })
  },

  /**
   * 格式化最后触发时间
   */
  formatLastTriggered(timestamp) {
    if (!timestamp) return null
    
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60 * 1000) {
      return '刚刚'
    } else if (diff < 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 1000))}分钟前`
    } else if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.floor(diff / (60 * 60 * 1000))}小时前`
    } else {
      const month = (date.getMonth() + 1).toString().padStart(2, '0')
      const day = date.getDate().toString().padStart(2, '0')
      return `${month}-${day}`
    }
  }
})

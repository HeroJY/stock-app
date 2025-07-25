// pages/settings/settings.js
const Storage = require('../../utils/storage')

Page({
  data: {
    settings: {
      refreshInterval: 30,
      realTimePush: true,
      wifiAutoRefresh: true,
      priceAlert: true,
      premiumAlert: true,
      alertThreshold: 3,
      theme: 'light',
      decimalPlaces: 2,
      exchangeRate: 0.914
    },
    
    // 显示文本
    refreshIntervalText: '30秒',
    themeText: '浅色模式',
    alertCount: 0,
    cacheSize: '0KB',
    
    // 选择器相关
    showRefreshPicker: false,
    showThresholdPicker: false,
    showThemePicker: false,
    
    refreshIntervals: [
      { value: 10, text: '10秒' },
      { value: 30, text: '30秒' },
      { value: 60, text: '1分钟' },
      { value: 120, text: '2分钟' }
    ],
    
    alertThresholds: [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
    alertThresholdTexts: ['1%', '1.5%', '2%', '2.5%', '3%', '3.5%', '4%', '4.5%', '5%'],
    
    themes: [
      { value: 'light', text: '浅色模式' },
      { value: 'dark', text: '深色模式' },
      { value: 'auto', text: '跟随系统' }
    ],
    
    refreshIntervalIndex: 1,
    alertThresholdIndex: 4,
    themeIndex: 0,
    tempAlertThresholdIndex: 4
  },

  onLoad() {
    console.log('页面加载，检查阈值数组:', this.data.alertThresholdTexts)
    this.loadSettings()
    this.loadAlertCount()
    this.calculateCacheSize()
  },

  onShow() {
    this.loadAlertCount()
  },

  /**
   * 加载设置
   */
  loadSettings() {
    try {
      // 从本地存储加载设置
      const savedSettings = wx.getStorageSync('userSettings')
      if (savedSettings) {
        const settings = { ...this.data.settings, ...savedSettings }
        this.setData({ settings })
      }
      
      // 更新显示文本
      this.updateDisplayTexts()
      
      // 更新选择器索引
      this.updatePickerIndexes()
    } catch (error) {
      console.error('加载设置失败:', error)
    }
  },

  /**
   * 更新显示文本
   */
  updateDisplayTexts() {
    const { settings } = this.data
    
    // 刷新间隔文本
    const refreshInterval = this.data.refreshIntervals.find(item => item.value === settings.refreshInterval)
    const refreshIntervalText = refreshInterval ? refreshInterval.text : '30秒'
    
    // 主题文本
    const theme = this.data.themes.find(item => item.value === settings.theme)
    const themeText = theme ? theme.text : '浅色模式'
    
    this.setData({
      refreshIntervalText,
      themeText
    })
  },

  /**
   * 更新选择器索引
   */
  updatePickerIndexes() {
    const { settings } = this.data
    
    // 刷新间隔索引
    const refreshIntervalIndex = this.data.refreshIntervals.findIndex(item => item.value === settings.refreshInterval)
    
    // 提醒阈值索引
    const alertThresholdIndex = this.data.alertThresholds.findIndex(item => item === settings.alertThreshold)
    
    // 主题索引
    const themeIndex = this.data.themes.findIndex(item => item.value === settings.theme)
    
    this.setData({
      refreshIntervalIndex: refreshIntervalIndex >= 0 ? refreshIntervalIndex : 1,
      alertThresholdIndex: alertThresholdIndex >= 0 ? alertThresholdIndex : 4,
      themeIndex: themeIndex >= 0 ? themeIndex : 0
    })
  },

  /**
   * 加载提醒数量
   */
  loadAlertCount() {
    try {
      const alerts = Storage.getPriceAlerts()
      this.setData({ alertCount: alerts.length })
    } catch (error) {
      console.error('加载提醒数量失败:', error)
      this.setData({ alertCount: 0 })
    }
  },

  /**
   * 计算缓存大小
   */
  calculateCacheSize() {
    try {
      const info = wx.getStorageInfoSync()
      const sizeKB = Math.round(info.currentSize)
      let cacheSize = ''
      
      if (sizeKB < 1024) {
        cacheSize = `${sizeKB}KB`
      } else {
        const sizeMB = (sizeKB / 1024).toFixed(1)
        cacheSize = `${sizeMB}MB`
      }
      
      this.setData({ cacheSize })
    } catch (error) {
      this.setData({ cacheSize: '0KB' })
    }
  },

  /**
   * 保存设置
   */
  saveSettings(newSettings) {
    try {
      const settings = { ...this.data.settings, ...newSettings }
      this.setData({ settings })
      
      // 保存到本地存储
      wx.setStorageSync('userSettings', settings)
      
      this.updateDisplayTexts()
    } catch (error) {
      console.error('保存设置失败:', error)
      wx.showToast({ title: '保存失败', icon: 'error' })
    }
  },

  /**
   * 开关设置变更
   */
  onRealTimePushChange(e) {
    this.saveSettings({ realTimePush: e.detail.value })
  },

  onWifiAutoRefreshChange(e) {
    this.saveSettings({ wifiAutoRefresh: e.detail.value })
  },

  onPremiumAlertChange(e) {
    this.saveSettings({ premiumAlert: e.detail.value })
  },

  /**
   * 刷新间隔设置
   */
  showRefreshIntervalPicker() {
    console.log('显示刷新间隔选择器')
    wx.showActionSheet({
      itemList: this.data.refreshIntervals.map(item => item.text),
      success: (res) => {
        const index = res.tapIndex
        const interval = this.data.refreshIntervals[index]
        
        this.saveSettings({ refreshInterval: interval.value })
        this.setData({ 
          refreshIntervalIndex: index
        })
        
        wx.showToast({
          title: `已设置为${interval.text}`,
          icon: 'success'
        })
      }
    })
  },

  hideRefreshIntervalPicker() {
    this.setData({ showRefreshPicker: false })
  },

  onRefreshIntervalChange(e) {
    const index = e.detail.value
    const interval = this.data.refreshIntervals[index]
    
    this.saveSettings({ refreshInterval: interval.value })
    this.setData({ 
      refreshIntervalIndex: index,
      showRefreshPicker: false
    })
  },

  /**
   * 提醒阈值设置
   */
  showAlertThresholdPicker() {
    console.log('显示提醒阈值选择器')
    this.setData({ showThresholdPicker: true })
  },

  hideAlertThresholdPicker() {
    this.setData({ showThresholdPicker: false })
  },

  onAlertThresholdPickerChange(e) {
    const index = e.detail.value[0]
    this.setData({ 
      tempAlertThresholdIndex: index
    })
  },

  confirmAlertThreshold() {
    const index = this.data.tempAlertThresholdIndex !== undefined ? this.data.tempAlertThresholdIndex : this.data.alertThresholdIndex
    const threshold = this.data.alertThresholds[index]
    
    this.saveSettings({ alertThreshold: threshold })
    this.setData({ 
      alertThresholdIndex: index,
      showThresholdPicker: false,
      tempAlertThresholdIndex: this.data.alertThresholdIndex
    })
    
    wx.showToast({
      title: `已设置为${threshold}%`,
      icon: 'success'
    })
  },

  onAlertThresholdChange(e) {
    const index = e.detail.value
    const threshold = this.data.alertThresholds[index]
    
    this.saveSettings({ alertThreshold: threshold })
    this.setData({ 
      alertThresholdIndex: index,
      showThresholdPicker: false
    })
    
    wx.showToast({
      title: `已设置为${threshold}%`,
      icon: 'success'
    })
  },

  /**
   * 主题设置
   */
  showThemePicker() {
    this.setData({ showThemePicker: true })
  },

  hideThemePicker() {
    this.setData({ showThemePicker: false })
  },

  onThemeChange(e) {
    const index = e.detail.value
    const theme = this.data.themes[index]
    
    this.saveSettings({ theme: theme.value })
    this.setData({ 
      themeIndex: index,
      showThemePicker: false
    })
    
    wx.showToast({ title: '主题设置成功', icon: 'success' })
  },

  /**
   * 清除缓存
   */
  clearCache() {
    wx.showModal({
      title: '清除缓存',
      content: '确定要清除所有缓存数据吗？这不会影响您的收藏和设置。',
      success: (res) => {
        if (res.confirm) {
          try {
            // 清除特定的缓存数据，保留用户设置和收藏
            wx.removeStorageSync('exchangeRate')
            wx.removeStorageSync('exchangeRateTime')
            wx.removeStorageSync('searchHistory')
            
            this.calculateCacheSize()
            wx.showToast({ title: '缓存已清除', icon: 'success' })
          } catch (error) {
            wx.showToast({ title: '清除失败', icon: 'error' })
          }
        }
      }
    })
  },

  /**
   * 页面跳转
   */
  goToAlertManage() {
    wx.navigateTo({
      url: '/pages/alert-manage/alert-manage'
    })
  },

  goToAPIStatus() {
    wx.navigateTo({
      url: '/pages/api-status/api-status'
    })
  },

  /**
   * 显示汇率输入框
   */
  showExchangeRateInput() {
    const currentRate = this.data.settings.exchangeRate || 0.914
    wx.showModal({
      title: '设置汇率',
      content: '请输入港币兑人民币汇率',
      editable: true,
      placeholderText: currentRate.toString(),
      success: (res) => {
        if (res.confirm && res.content) {
          const rate = parseFloat(res.content)
          if (rate > 0 && rate < 2) {
            this.saveSettings({ exchangeRate: rate })
            wx.showToast({
              title: '汇率已更新',
              icon: 'success'
            })
          } else {
            wx.showToast({
              title: '请输入有效汇率(0-2)',
              icon: 'error'
            })
          }
        }
      }
    })
  },

  /**
   * 显示关于信息
   */
  showAbout() {
    wx.showModal({
      title: '关于应用',
      content: '股票HA溢价率查询小程序\n版本: 1.0.0\n\n专注于港股A股溢价率分析，为投资者提供实时数据和智能提醒服务。',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 意见反馈
   */
  showFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '如有问题或建议，请通过以下方式联系我们：\n\n邮箱：feedback@stockapp.com\n微信：stockapp_support\n\n我们会认真对待每一条反馈！',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
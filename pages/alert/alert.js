// pages/alert/alert.js
const Storage = require('../../utils/storage')

Page({
  data: {
    stockInfo: {},
    currentPremiumRate: 0,
    
    // 提醒类型
    alertType: 'premium', // premium, price
    
    // 溢价率提醒
    premiumCondition: 'above', // above, below
    premiumThreshold: '',
    
    // 价格提醒
    hPriceHigh: '',
    hPriceLow: '',
    aPriceHigh: '',
    aPriceLow: '',
    
    // 通知设置
    alertEnabled: true,
    repeatAlert: false,
    startTime: '09:00',
    endTime: '15:30'
  },

  onLoad(options) {
    const { hCode, aCode, name } = options
    if (hCode && aCode) {
      this.setData({
        'stockInfo.hCode': hCode,
        'stockInfo.aCode': aCode,
        'stockInfo.name': name || '股票提醒'
      })
      
      // 设置导航标题
      wx.setNavigationBarTitle({
        title: `${name || '股票'} - 价格提醒`
      })
      
      // 加载当前股票数据
      this.loadCurrentData()
    }
  },

  /**
   * 加载当前股票数据
   */
  async loadCurrentData() {
    // 这里应该调用API获取当前数据，暂时使用模拟数据
    this.setData({
      currentPremiumRate: '+5.23'
    })
  },

  /**
   * 选择提醒类型
   */
  selectAlertType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ alertType: type })
  },

  /**
   * 选择溢价率条件
   */
  selectPremiumCondition(e) {
    const condition = e.currentTarget.dataset.condition
    this.setData({ premiumCondition: condition })
  },

  /**
   * 输入事件处理
   */
  onPremiumThresholdInput(e) {
    this.setData({ premiumThreshold: e.detail.value })
  },

  onHPriceHighInput(e) {
    this.setData({ hPriceHigh: e.detail.value })
  },

  onHPriceLowInput(e) {
    this.setData({ hPriceLow: e.detail.value })
  },

  onAPriceHighInput(e) {
    this.setData({ aPriceHigh: e.detail.value })
  },

  onAPriceLowInput(e) {
    this.setData({ aPriceLow: e.detail.value })
  },

  /**
   * 开关设置
   */
  onAlertEnabledChange(e) {
    this.setData({ alertEnabled: e.detail.value })
  },

  onRepeatAlertChange(e) {
    this.setData({ repeatAlert: e.detail.value })
  },

  /**
   * 时间选择
   */
  onStartTimeChange(e) {
    this.setData({ startTime: e.detail.value })
  },

  onEndTimeChange(e) {
    this.setData({ endTime: e.detail.value })
  },

  /**
   * 预览提醒
   */
  previewAlert() {
    if (!this.validateAlert()) return
    
    const alertConfig = this.buildAlertConfig()
    const message = this.generateAlertMessage(alertConfig)
    
    wx.showModal({
      title: '提醒预览',
      content: message,
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 保存提醒
   */
  saveAlert() {
    if (!this.validateAlert()) return
    
    const alertConfig = this.buildAlertConfig()
    
    wx.showLoading({ title: '保存中...' })
    
    try {
      Storage.addPriceAlert(alertConfig)
      
      wx.hideLoading()
      wx.showToast({ 
        title: '提醒设置成功', 
        icon: 'success',
        success: () => {
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      })
    } catch (error) {
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'error' })
    }
  },

  /**
   * 验证提醒设置
   */
  validateAlert() {
    const { alertType, premiumThreshold, hPriceHigh, hPriceLow, aPriceHigh, aPriceLow } = this.data
    
    if (alertType === 'premium') {
      if (!premiumThreshold || isNaN(premiumThreshold)) {
        wx.showToast({ title: '请输入有效的溢价率', icon: 'none' })
        return false
      }
    } else if (alertType === 'price') {
      if (!hPriceHigh && !hPriceLow && !aPriceHigh && !aPriceLow) {
        wx.showToast({ title: '请至少设置一个价格提醒', icon: 'none' })
        return false
      }
      
      // 验证价格格式
      const prices = [hPriceHigh, hPriceLow, aPriceHigh, aPriceLow]
      for (const price of prices) {
        if (price && (isNaN(price) || parseFloat(price) <= 0)) {
          wx.showToast({ title: '请输入有效的价格', icon: 'none' })
          return false
        }
      }
    }
    
    return true
  },

  /**
   * 构建提醒配置
   */
  buildAlertConfig() {
    const { stockInfo, alertType, alertEnabled, repeatAlert, startTime, endTime } = this.data
    
    const baseConfig = {
      stockName: stockInfo.name,
      hCode: stockInfo.hCode,
      aCode: stockInfo.aCode,
      alertType: alertType,
      enabled: alertEnabled,
      repeat: repeatAlert,
      timeRange: {
        start: startTime,
        end: endTime
      },
      createTime: Date.now()
    }
    
    if (alertType === 'premium') {
      return {
        ...baseConfig,
        premiumCondition: this.data.premiumCondition,
        premiumThreshold: parseFloat(this.data.premiumThreshold)
      }
    } else {
      return {
        ...baseConfig,
        priceTargets: {
          hPriceHigh: this.data.hPriceHigh ? parseFloat(this.data.hPriceHigh) : null,
          hPriceLow: this.data.hPriceLow ? parseFloat(this.data.hPriceLow) : null,
          aPriceHigh: this.data.aPriceHigh ? parseFloat(this.data.aPriceHigh) : null,
          aPriceLow: this.data.aPriceLow ? parseFloat(this.data.aPriceLow) : null
        }
      }
    }
  },

  /**
   * 生成提醒消息
   */
  generateAlertMessage(config) {
    const { stockName, alertType } = config
    
    if (alertType === 'premium') {
      const { premiumCondition, premiumThreshold } = config
      const conditionText = premiumCondition === 'above' ? '高于' : '低于'
      return `当 ${stockName} 的HA溢价率${conditionText} ${premiumThreshold}% 时，将向您发送提醒通知。`
    } else {
      const { priceTargets } = config
      const conditions = []
      
      if (priceTargets.hPriceHigh) {
        conditions.push(`H股价格高于 ${priceTargets.hPriceHigh} HKD`)
      }
      if (priceTargets.hPriceLow) {
        conditions.push(`H股价格低于 ${priceTargets.hPriceLow} HKD`)
      }
      if (priceTargets.aPriceHigh) {
        conditions.push(`A股价格高于 ${priceTargets.aPriceHigh} CNY`)
      }
      if (priceTargets.aPriceLow) {
        conditions.push(`A股价格低于 ${priceTargets.aPriceLow} CNY`)
      }
      
      return `当 ${stockName} 满足以下条件时将提醒您：\n${conditions.join('\n')}`
    }
  }
})
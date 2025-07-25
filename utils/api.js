// utils/api.js
const { globalCache } = require('./cache')
const Storage = require('./storage')

/**
 * 股票API类 - 支持多数据源和缓存
 */
class StockAPI {
  constructor() {
    this.currentSourceIndex = 0
    this.dataSources = [
      {
        name: '腾讯财经',
        priority: 1,
        stockUrl: 'http://qt.gtimg.cn/q=',
        exchangeUrl: 'http://qt.gtimg.cn/q=USDCNY',
        available: true
      },
      {
        name: '新浪财经',
        priority: 2,
        stockUrl: 'https://hq.sinajs.cn/list=',
        exchangeUrl: 'https://hq.sinajs.cn/list=USDCNY',
        available: true
      },
      {
        name: '网易财经',
        priority: 3,
        stockUrl: 'https://api.money.126.net/data/feed/',
        exchangeUrl: 'https://api.money.126.net/data/feed/0000001,1399001',
        available: true
      },
      {
        name: '东方财富',
        priority: 4,
        stockUrl: 'https://push2.eastmoney.com/api/qt/ulist.np/get',
        exchangeUrl: 'https://push2.eastmoney.com/api/qt/ulist.np/get',
        available: true
      }
    ]
  }

  /**
   * 获取股票信息
   * @param {string} codes 股票代码，多个用逗号分隔
   * @param {boolean} forceRefresh 是否强制刷新，默认true
   * @returns {Promise<Array>} 股票信息数组
   */
  async getStockInfo(codes, forceRefresh = true) {
    const cacheKey = `stock_${codes}`
    
    // 如果强制刷新，先清除缓存
    if (forceRefresh) {
      globalCache.delete('stock', cacheKey)
      console.log('清除股票数据缓存:', codes)
    }
    
    // 检查缓存
    const cached = globalCache.get('stock', cacheKey)
    if (cached && !forceRefresh) {
      console.log('从缓存获取股票数据:', codes)
      return cached
    }

    // 尝试从各个数据源获取数据
    for (let i = 0; i < this.dataSources.length; i++) {
      const source = this.dataSources[i]
      if (!source.available) continue

      try {
        console.log(`尝试从${source.name}获取股票数据:`, codes)
        const data = await this.fetchStockFromSource(codes, source)
        
        if (data && data.length > 0) {
          // 缓存数据
          globalCache.set('stock', cacheKey, data, 30) // 30秒缓存
          console.log(`成功从${source.name}获取股票数据`)
          this.currentSourceIndex = i
          return data
        }
      } catch (error) {
        console.error(`从${source.name}获取数据失败:`, error)
        source.available = false
        continue
      }
    }

    // 所有数据源都失败，抛出错误
    console.log('所有数据源失败，API异常')
    throw new Error('API异常：所有数据源都无法获取股票数据')
  }

  /**
   * 从指定数据源获取股票数据（带重试机制）
   */
  async fetchStockFromSource(codes, source, retryCount = 3) {
    for (let attempt = 1; attempt <= retryCount; attempt++) {
      try {
        const data = await new Promise((resolve, reject) => {
          wx.request({
            url: source.stockUrl + codes,
            method: 'GET',
            timeout: 8000,
            header: {
              'Referer': 'https://finance.sina.com.cn/'
            },
            success: (res) => {
              try {
                // 验证响应数据
                if (!res.data || res.statusCode !== 200) {
                  throw new Error(`API响应异常: 状态码${res.statusCode}`)
                }
                
                const parsedData = this.parseStockData(res.data, source.name, codes)
                if (!parsedData || parsedData.length === 0) {
                  throw new Error('解析数据为空')
                }
                
                resolve(parsedData)
              } catch (error) {
                reject(error)
              }
            },
            fail: (error) => {
              reject(new Error(`网络请求失败: ${error.errMsg}`))
            }
          })
        })
        
        console.log(`第${attempt}次尝试成功获取数据:`, codes)
        return data
        
      } catch (error) {
        console.warn(`第${attempt}次尝试失败:`, error.message)
        
        if (attempt === retryCount) {
          throw error
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
      }
    }
  }

  /**
   * 解析股票数据
   */
  parseStockData(data, sourceName, codes) {
    console.log(`尝试解析${sourceName}的数据:`, data)
    
    // 腾讯财经数据解析
    if (sourceName === '腾讯财经' && typeof data === 'string') {
      return this.parseTencentData(data, codes)
    }
    
    // 新浪财经数据解析
    if (sourceName === '新浪财经' && typeof data === 'string') {
      return this.parseSinaData(data, codes)
    }
    
    // 其他数据源暂时不可用，抛出错误让系统使用模拟数据
    throw new Error(`${sourceName}数据源暂不可用`)
  }

  /**
   * 解析腾讯财经数据
   */
  parseTencentData(data, codes) {
    const codeList = codes.split(',')
    const results = []
    
    // 按行分割数据
    const lines = data.split('\n').filter(line => line.trim())
    
    lines.forEach((line, index) => {
      if (!line.includes('=')) return
      
      const code = codeList[index]
      if (!code) return
      
      try {
        const content = line.split('=')[1]?.replace(/[";]/g, '').trim()
        if (!content) return
        
        const fields = content.split('~')
        let stockData = null
        
        if (code.startsWith('hk')) {
          // H股数据格式: 腾讯财经H股数据
          if (fields.length >= 10) {
            const price = parseFloat(fields[3])
            const change = parseFloat(fields[4])
            const changePercent = parseFloat(fields[5])
            
            if (!isNaN(price) && price > 0) {
              stockData = {
                code: code,
                name: fields[1] || '未知股票',
                currentPrice: price,
                change: change || 0,
                changePercent: changePercent || 0,
                market: 'HK'
              }
            }
          }
        } else if (code.startsWith('sh') || code.startsWith('sz')) {
          // A股数据格式: 腾讯财经A股数据
          if (fields.length >= 10) {
            const price = parseFloat(fields[3])
            const change = parseFloat(fields[4])
            const changePercent = parseFloat(fields[5])
            
            if (!isNaN(price) && price > 0) {
              stockData = {
                code: code,
                name: fields[1] || '未知股票',
                currentPrice: price,
                change: change || 0,
                changePercent: changePercent || 0,
                market: code.startsWith('sh') ? 'SH' : 'SZ'
              }
            }
          }
        }
        
        if (stockData && this.validateStockData(stockData)) {
          results.push(stockData)
        }
        
      } catch (error) {
        console.warn(`解析腾讯股票数据失败 ${code}:`, error)
      }
    })
    
    return results
  }

  /**
   * 解析新浪财经数据
   */
  parseSinaData(data, codes) {
    const codeList = codes.split(',')
    const results = []
    
    // 按行分割数据
    const lines = data.split('\n').filter(line => line.trim())
    
    lines.forEach((line, index) => {
      if (!line.includes('=')) return
      
      const code = codeList[index]
      if (!code) return
      
      try {
        const content = line.split('=')[1]?.replace(/[";]/g, '').trim()
        if (!content) return
        
        const fields = content.split(',')
        let stockData = null
        
        if (code.startsWith('hk')) {
          // H股数据格式
          if (fields.length >= 7) {
            const price = parseFloat(fields[2])
            const change = parseFloat(fields[4])
            
            if (!isNaN(price) && price > 0) {
              stockData = {
                code: code,
                name: fields[1] || '未知股票',
                currentPrice: price,
                change: change || 0,
                changePercent: fields[5] ? parseFloat(fields[5]) : 0,
                market: 'HK'
              }
            }
          }
        } else if (code.startsWith('sh') || code.startsWith('sz')) {
          // A股数据格式
          if (fields.length >= 32) {
            const price = parseFloat(fields[3])
            const prevClose = parseFloat(fields[2])
            const change = price - prevClose
            
            if (!isNaN(price) && price > 0) {
              stockData = {
                code: code,
                name: fields[0] || '未知股票',
                currentPrice: price,
                change: change,
                changePercent: prevClose > 0 ? (change / prevClose) * 100 : 0,
                market: code.startsWith('sh') ? 'SH' : 'SZ'
              }
            }
          }
        }
        
        if (stockData && this.validateStockData(stockData)) {
          results.push(stockData)
        }
        
      } catch (error) {
        console.warn(`解析股票数据失败 ${code}:`, error)
      }
    })
    
    return results
  }

  /**
   * 验证股票数据
   */
  validateStockData(stockData) {
    return stockData &&
           stockData.code &&
           stockData.name &&
           typeof stockData.currentPrice === 'number' &&
           stockData.currentPrice > 0 &&
           !isNaN(stockData.currentPrice)
  }

  /**
   * 获取汇率信息
   * @returns {number} 汇率
   */
  getExchangeRate() {
    const settings = Storage.getUserSettings()
    return settings.exchangeRate || 0.914
  }

  /**
   * 搜索股票
   */
  async searchStock(keyword) {
    console.log('搜索股票:', keyword)
    
    // 先获取模拟的搜索结果（股票代码列表）
    const stockList = this.generateMockSearchResults(keyword)
    
    if (stockList.length === 0) {
      return []
    }
    
    // 为每个搜索结果获取实时价格
    const results = []
    for (const stock of stockList) {
      try {
        // 获取H股价格
        const hStockData = await this.getStockInfo(stock.code, true)
        // 获取A股价格
        const aStockData = await this.getStockInfo(stock.aCode, true)
        
        if (hStockData.length > 0 && aStockData.length > 0) {
          const hStock = hStockData[0]
          const aStock = aStockData[0]
          
          // 计算溢价率
          const exchangeRate = this.getExchangeRate()
          const premiumRate = this.calculatePremiumRate(
            hStock.currentPrice,
            aStock.currentPrice,
            exchangeRate
          )
          
          results.push({
            ...stock,
            hPrice: hStock.currentPrice,
            aPrice: aStock.currentPrice,
            hChange: hStock.change,
            aChange: aStock.change,
            hChangePercent: hStock.changePercent,
            aChangePercent: aStock.changePercent,
            premiumRate: premiumRate,
            updateTime: new Date().toLocaleTimeString()
          })
        } else {
          // 如果无法获取实时数据，跳过该股票
          console.warn(`无法获取股票 ${stock.code} 的实时数据`)
        }
      } catch (error) {
        console.error(`获取股票 ${stock.code} 价格失败:`, error)
        // 不添加任何数据，跳过该股票
      }
    }
    
    return results
  }

  /**
   * 生成模拟搜索结果
   */
  generateMockSearchResults(keyword) {
    const allStocks = [
      { code: 'hk00700', name: '腾讯控股', aCode: 'sz000858', fullName: '腾讯控股有限公司' },
      { code: 'hk00941', name: '中国移动', aCode: 'sh600941', fullName: '中国移动有限公司' },
      { code: 'hk01398', name: '工商银行', aCode: 'sh601398', fullName: '中国工商银行股份有限公司' },
      { code: 'hk00939', name: '建设银行', aCode: 'sh601939', fullName: '中国建设银行股份有限公司' },
      { code: 'hk03988', name: '中国银行', aCode: 'sh601988', fullName: '中国银行股份有限公司' },
      { code: 'hk02318', name: '中国平安', aCode: 'sh601318', fullName: '中国平安保险(集团)股份有限公司' },
      { code: 'hk01088', name: '中国神华', aCode: 'sh601088', fullName: '中国神华能源股份有限公司' },
      { code: 'hk00883', name: '中国海洋石油', aCode: 'sh600583', fullName: '中国海洋石油有限公司' },
      { code: 'hk00857', name: '中国石油股份', aCode: 'sh601857', fullName: '中国石油天然气股份有限公司' },
      { code: 'hk00386', name: '中国石油化工股份', aCode: 'sh600028', fullName: '中国石油化工股份有限公司' },
      { code: 'hk02628', name: '中国人寿', aCode: 'sh601628', fullName: '中国人寿保险股份有限公司' },
      { code: 'hk01288', name: '农业银行', aCode: 'sh601288', fullName: '中国农业银行股份有限公司' },
      { code: 'hk03968', name: '招商银行', aCode: 'sh600036', fullName: '招商银行股份有限公司' },
      { code: 'hk00388', name: '香港交易所', aCode: 'sh600000', fullName: '香港交易及结算所有限公司' },
      { code: 'hk02388', name: '中银香港', aCode: 'sh601988', fullName: '中银香港(控股)有限公司' }
    ]
    
    // 转换关键词为小写，便于不区分大小写搜索
    const lowerKeyword = keyword.toLowerCase()
    
    return allStocks.filter(stock => 
      stock.name.includes(keyword) || 
      stock.code.toLowerCase().includes(lowerKeyword) ||
      (stock.fullName && stock.fullName.includes(keyword))
    ).slice(0, 10)
  }

  /**
   * 计算溢价率
   */
  calculatePremiumRate(hPrice, aPrice, exchangeRate) {
    if (!hPrice || !aPrice || !exchangeRate) return 0
    
    const hPriceInCNY = hPrice * exchangeRate
    const premiumRate = ((hPriceInCNY - aPrice) / aPrice) * 100
    
    return parseFloat(premiumRate.toFixed(4))
  }

  /**
   * 获取API状态
   */
  getAPIStatus() {
    const availableSources = this.dataSources.filter(s => s.available).length
    const currentSource = this.dataSources[this.currentSourceIndex]?.name || '未知'
    const cacheStats = globalCache.getStats()
    
    return {
      currentSource,
      availableSources,
      cacheStats
    }
  }

  /**
   * 清除缓存
   */
  clearCache() {
    globalCache.clear()
  }
  
  /**
   * 重置数据源可用性状态
   */
  resetDataSourcesAvailability() {
    this.dataSources.forEach(source => {
      source.available = true
    })
    console.log('已重置所有数据源可用性状态')
  }
}

/**
 * 计算溢价率
 * @param {number} hPrice H股价格
 * @param {number} aPrice A股价格  
 * @param {number} exchangeRate 汇率
 * @returns {number} 溢价率百分比
 */
function calculatePremiumRate(hPrice, aPrice, exchangeRate) {
  if (!hPrice || !aPrice || !exchangeRate) return 0
  
  const hPriceInCNY = hPrice * exchangeRate
  const premiumRate = ((hPriceInCNY - aPrice) / aPrice) * 100
  
  return parseFloat(premiumRate.toFixed(4))
}

/**
 * 格式化价格
 * @param {number} price 价格
 * @param {number} decimals 小数位数
 * @param {boolean} showSign 是否显示正负号
 * @returns {string} 格式化后的价格
 */
function formatPrice(price, decimals = 2, showSign = false) {
  if (price === null || price === undefined) return '--'
  
  const formatted = parseFloat(price).toFixed(decimals)
  
  if (showSign && price > 0) {
    return `+${formatted}`
  }
  
  return formatted
}

/**
 * 格式化百分比
 * @param {number} percent 百分比
 * @param {number} decimals 小数位数
 * @returns {string} 格式化后的百分比
 */
function formatPercent(percent, decimals = 2) {
  if (percent === null || percent === undefined) return '--'
  
  const formatted = parseFloat(percent).toFixed(decimals)
  const sign = percent > 0 ? '+' : ''
  
  return `${sign}${formatted}%`
}

/**
 * 获取溢价率样式类名
 * @param {number} premiumRate 溢价率
 * @returns {string} 样式类名
 */
function getPremiumRateClass(premiumRate) {
  if (premiumRate > 5) return 'premium-high'
  if (premiumRate > 0) return 'premium-positive'
  if (premiumRate > -5) return 'premium-neutral'
  return 'premium-negative'
}

module.exports = {
  StockAPI,
  calculatePremiumRate,
  formatPrice,
  formatPercent,
  getPremiumRateClass
}
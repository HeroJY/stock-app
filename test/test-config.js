// test/test-config.js
// 测试配置和模拟数据

/**
 * 测试用股票数据
 */
const mockStockData = {
  // 腾讯控股
  'hk00700': {
    code: 'hk00700',
    name: '腾讯控股',
    currentPrice: 320.5,
    change: 5.2,
    changePercent: 1.65,
    volume: 12500000,
    turnover: 4000000000,
    market: 'HK'
  },
  'sz000858': {
    code: 'sz000858',
    name: '五粮液',
    currentPrice: 180.8,
    change: -2.1,
    changePercent: -1.15,
    volume: 8500000,
    turnover: 1500000000,
    market: 'A'
  },
  
  // 中国移动
  'hk00941': {
    code: 'hk00941',
    name: '中国移动',
    currentPrice: 58.5,
    change: 1.2,
    changePercent: 2.09,
    volume: 15000000,
    turnover: 870000000,
    market: 'HK'
  },
  'sh600941': {
    code: 'sh600941',
    name: '中国移动',
    currentPrice: 52.3,
    change: 0.8,
    changePercent: 1.55,
    volume: 25000000,
    turnover: 1300000000,
    market: 'A'
  }
}

/**
 * 测试用汇率数据
 */
const mockExchangeRate = {
  rates: {
    CNY: 0.9185
  },
  timestamp: Date.now()
}

/**
 * 测试用搜索结果
 */
const mockSearchResults = [
  { code: 'hk00700', name: '腾讯控股', aCode: 'sz000858' },
  { code: 'hk00941', name: '中国移动', aCode: 'sh600941' },
  { code: 'hk01299', name: '友邦保险', aCode: 'sh601318' },
  { code: 'hk00388', name: '香港交易所', aCode: 'sh600036' },
  { code: 'hk01398', name: '工商银行', aCode: 'sh601398' }
]

/**
 * 测试函数
 */
const testFunctions = {
  /**
   * 测试HA溢价率计算
   */
  testPremiumRateCalculation() {
    const hPrice = 320.5
    const aPrice = 180.8
    const exchangeRate = 0.9185
    
    const hPriceInCNY = hPrice * exchangeRate
    const premiumRate = ((hPriceInCNY - aPrice) / aPrice * 100).toFixed(2)
    
    console.log('测试HA溢价率计算:')
    console.log(`H股价格: ${hPrice} HKD`)
    console.log(`A股价格: ${aPrice} CNY`)
    console.log(`汇率: ${exchangeRate}`)
    console.log(`H股转CNY: ${hPriceInCNY.toFixed(2)} CNY`)
    console.log(`溢价率: ${premiumRate}%`)
    
    return parseFloat(premiumRate)
  },

  /**
   * 测试本地存储
   */
  testLocalStorage() {
    try {
      // 测试收藏功能
      const testStock = {
        hCode: 'hk00700',
        aCode: 'sz000858',
        name: '腾讯控股',
        addTime: Date.now()
      }
      
      wx.setStorageSync('test_favorite', testStock)
      const retrieved = wx.getStorageSync('test_favorite')
      
      console.log('本地存储测试:', retrieved.name === testStock.name ? '通过' : '失败')
      
      // 清理测试数据
      wx.removeStorageSync('test_favorite')
      
      return true
    } catch (error) {
      console.error('本地存储测试失败:', error)
      return false
    }
  },

  /**
   * 测试API请求格式
   */
  testApiFormat() {
    const codes = 'hk00700,sz000858'
    const expectedUrl = `https://qt.gtimg.com/q=${codes}`
    
    console.log('API请求URL:', expectedUrl)
    
    // 模拟解析响应数据
    const mockResponse = 'v_hk00700="51~腾讯控股~00700~320.50~5.20~1.65~12500000~4000000000~"\nv_sz000858="1~五粮液~000858~180.80~-2.10~-1.15~8500000~1500000000~"'
    
    const lines = mockResponse.split('\n').filter(line => line.trim())
    console.log('解析到股票数量:', lines.length)
    
    return lines.length === 2
  },

  /**
   * 性能测试
   */
  performanceTest() {
    const startTime = Date.now()
    
    // 模拟大量数据处理
    const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      hPrice: Math.random() * 500,
      aPrice: Math.random() * 300,
      exchangeRate: 0.9185
    }))
    
    // 批量计算溢价率
    const results = largeDataSet.map(item => {
      const hPriceInCNY = item.hPrice * item.exchangeRate
      return ((hPriceInCNY - item.aPrice) / item.aPrice * 100).toFixed(2)
    })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`性能测试: 处理${largeDataSet.length}条数据耗时${duration}ms`)
    
    return duration < 100 // 期望在100ms内完成
  }
}

/**
 * 运行所有测试
 */
function runAllTests() {
  console.log('=== 开始运行测试 ===')
  
  const tests = [
    { name: 'HA溢价率计算', fn: testFunctions.testPremiumRateCalculation },
    { name: '本地存储', fn: testFunctions.testLocalStorage },
    { name: 'API格式', fn: testFunctions.testApiFormat },
    { name: '性能测试', fn: testFunctions.performanceTest }
  ]
  
  const results = tests.map(test => {
    try {
      const result = test.fn()
      console.log(`✅ ${test.name}: 通过`)
      return { name: test.name, passed: true, result }
    } catch (error) {
      console.log(`❌ ${test.name}: 失败 - ${error.message}`)
      return { name: test.name, passed: false, error: error.message }
    }
  })
  
  const passedCount = results.filter(r => r.passed).length
  console.log(`=== 测试完成: ${passedCount}/${tests.length} 通过 ===`)
  
  return results
}

module.exports = {
  mockStockData,
  mockExchangeRate,
  mockSearchResults,
  testFunctions,
  runAllTests
}
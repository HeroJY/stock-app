// test/api-test.js
/**
 * API修复功能测试脚本
 * 用于验证多数据源API和缓存功能是否正常工作
 */

const { StockAPI } = require('../utils/api')
const { globalCache } = require('../utils/cache')

/**
 * 测试套件
 */
class APITestSuite {
  constructor() {
    this.stockAPI = new StockAPI()
    this.testResults = []
  }

  /**
   * 运行所有测试
   */
  async runAllTests() {
    console.log('🚀 开始API修复功能测试...\n')
    
    const tests = [
      { name: '股票数据获取测试', method: this.testStockDataFetch },
      { name: '多数据源容错测试', method: this.testMultiSourceFallback },
      { name: '缓存功能测试', method: this.testCacheFunction },
      { name: '汇率获取测试', method: this.testExchangeRate },
      { name: '股票搜索测试', method: this.testStockSearch },
      { name: '股票对数据测试', method: this.testStockPairData },
      { name: '性能测试', method: this.testPerformance }
    ]

    for (const test of tests) {
      try {
        console.log(`📋 执行测试: ${test.name}`)
        const startTime = Date.now()
        const result = await test.method.call(this)
        const endTime = Date.now()
        
        this.testResults.push({
          name: test.name,
          success: result.success,
          message: result.message,
          duration: endTime - startTime,
          details: result.details || {}
        })
        
        console.log(`${result.success ? '✅' : '❌'} ${test.name}: ${result.message}`)
        console.log(`⏱️  耗时: ${endTime - startTime}ms\n`)
        
      } catch (error) {
        console.error(`❌ ${test.name} 执行失败:`, error)
        this.testResults.push({
          name: test.name,
          success: false,
          message: `测试执行失败: ${error.message}`,
          duration: 0,
          details: { error: error.stack }
        })
      }
    }

    this.printSummary()
    return this.testResults
  }

  /**
   * 测试股票数据获取
   */
  async testStockDataFetch() {
    const testCodes = 'hk01299,sh601318'
    
    try {
      const stocks = await this.stockAPI.getStockInfo(testCodes)
      
      if (!stocks || stocks.length === 0) {
        return { success: false, message: '未获取到股票数据' }
      }
      
      if (stocks.length < 2) {
        return { success: false, message: `期望获取2条数据，实际获取${stocks.length}条` }
      }
      
      // 验证数据结构
      const requiredFields = ['code', 'name', 'currentPrice', 'change', 'changePercent', 'market']
      for (const stock of stocks) {
        for (const field of requiredFields) {
          if (!(field in stock)) {
            return { success: false, message: `股票数据缺少必要字段: ${field}` }
          }
        }
      }
      
      return { 
        success: true, 
        message: `成功获取${stocks.length}条股票数据`,
        details: { stocks: stocks.map(s => ({ code: s.code, name: s.name, price: s.currentPrice })) }
      }
      
    } catch (error) {
      return { success: false, message: `获取股票数据失败: ${error.message}` }
    }
  }

  /**
   * 测试多数据源容错
   */
  async testMultiSourceFallback() {
    try {
      // 获取API状态
      const apiStatus = this.stockAPI.getAPIStatus()
      
      if (!apiStatus.availableSources || apiStatus.availableSources === 0) {
        return { success: false, message: '没有可用的数据源' }
      }
      
      // 测试多次请求，验证数据源切换
      const testResults = []
      for (let i = 0; i < 3; i++) {
        const stocks = await this.stockAPI.getStockInfo('hk00700')
        testResults.push({
          attempt: i + 1,
          success: stocks && stocks.length > 0,
          dataSource: this.stockAPI.getAPIStatus().currentSource
        })
      }
      
      const successCount = testResults.filter(r => r.success).length
      
      return {
        success: successCount > 0,
        message: `${successCount}/3 次请求成功，数据源切换正常`,
        details: { testResults, apiStatus }
      }
      
    } catch (error) {
      return { success: false, message: `多数据源测试失败: ${error.message}` }
    }
  }

  /**
   * 测试缓存功能
   */
  async testCacheFunction() {
    try {
      const testKey = 'test-cache-key'
      
      // 清除可能存在的测试缓存
      globalCache.delete('test', testKey)
      
      // 第一次请求（应该从API获取）
      const startTime1 = Date.now()
      const stocks1 = await this.stockAPI.getStockInfo('hk00941')
      const duration1 = Date.now() - startTime1
      
      // 第二次请求（应该从缓存获取）
      const startTime2 = Date.now()
      const stocks2 = await this.stockAPI.getStockInfo('hk00941')
      const duration2 = Date.now() - startTime2
      
      // 验证缓存效果
      const cacheStats = globalCache.getStats()
      const isCacheWorking = duration2 < duration1 && cacheStats.total > 0
      
      return {
        success: isCacheWorking,
        message: isCacheWorking ? '缓存功能正常工作' : '缓存功能可能存在问题',
        details: {
          firstRequestTime: duration1,
          secondRequestTime: duration2,
          cacheStats: cacheStats,
          speedImprovement: duration1 > 0 ? ((duration1 - duration2) / duration1 * 100).toFixed(2) + '%' : '0%'
        }
      }
      
    } catch (error) {
      return { success: false, message: `缓存测试失败: ${error.message}` }
    }
  }

  /**
   * 测试汇率获取
   */
  async testExchangeRate() {
    try {
      const exchangeRate = await this.stockAPI.getExchangeRate()
      
      if (!exchangeRate || exchangeRate <= 0) {
        return { success: false, message: '汇率数据无效' }
      }
      
      if (exchangeRate < 0.5 || exchangeRate > 2) {
        return { success: false, message: `汇率数据异常: ${exchangeRate}` }
      }
      
      return {
        success: true,
        message: `汇率获取成功: ${exchangeRate}`,
        details: { exchangeRate }
      }
      
    } catch (error) {
      return { success: false, message: `汇率获取失败: ${error.message}` }
    }
  }

  /**
   * 测试股票搜索
   */
  async testStockSearch() {
    try {
      const searchResults = await this.stockAPI.searchStock('中国')
      
      if (!searchResults || searchResults.length === 0) {
        return { success: false, message: '搜索结果为空' }
      }
      
      // 验证搜索结果结构
      const requiredFields = ['code', 'name']
      for (const result of searchResults) {
        for (const field of requiredFields) {
          if (!(field in result)) {
            return { success: false, message: `搜索结果缺少必要字段: ${field}` }
          }
        }
      }
      
      return {
        success: true,
        message: `搜索功能正常，找到${searchResults.length}条结果`,
        details: { searchResults: searchResults.slice(0, 3) } // 只显示前3条
      }
      
    } catch (error) {
      return { success: false, message: `搜索测试失败: ${error.message}` }
    }
  }

  /**
   * 测试股票对数据
   */
  async testStockPairData() {
    try {
      const pairData = await this.stockAPI.getStockPair('hk01299', 'sh601318')
      
      if (!pairData) {
        return { success: false, message: '股票对数据获取失败' }
      }
      
      const requiredFields = ['hStock', 'aStock', 'exchangeRate', 'premiumRate']
      for (const field of requiredFields) {
        if (!(field in pairData)) {
          return { success: false, message: `股票对数据缺少必要字段: ${field}` }
        }
      }
      
      return {
        success: true,
        message: `股票对数据获取成功，溢价率: ${pairData.premiumRate}%`,
        details: {
          hStock: pairData.hStock.name,
          aStock: pairData.aStock.name,
          premiumRate: pairData.premiumRate,
          exchangeRate: pairData.exchangeRate
        }
      }
      
    } catch (error) {
      return { success: false, message: `股票对测试失败: ${error.message}` }
    }
  }

  /**
   * 性能测试
   */
  async testPerformance() {
    try {
      const testCodes = ['hk00700', 'hk00941', 'hk01299', 'sh601318', 'sh600941']
      const results = []
      
      for (const code of testCodes) {
        const startTime = Date.now()
        const stocks = await this.stockAPI.getStockInfo(code)
        const endTime = Date.now()
        
        results.push({
          code,
          duration: endTime - startTime,
          success: stocks && stocks.length > 0
        })
      }
      
      const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
      const successRate = results.filter(r => r.success).length / results.length * 100
      
      const isPerformanceGood = avgDuration < 2000 && successRate >= 80
      
      return {
        success: isPerformanceGood,
        message: `平均响应时间: ${avgDuration.toFixed(0)}ms, 成功率: ${successRate.toFixed(1)}%`,
        details: {
          averageDuration: avgDuration,
          successRate: successRate,
          individualResults: results
        }
      }
      
    } catch (error) {
      return { success: false, message: `性能测试失败: ${error.message}` }
    }
  }

  /**
   * 打印测试总结
   */
  printSummary() {
    console.log('\n📊 测试总结')
    console.log('=' * 50)
    
    const totalTests = this.testResults.length
    const passedTests = this.testResults.filter(r => r.success).length
    const failedTests = totalTests - passedTests
    
    console.log(`总测试数: ${totalTests}`)
    console.log(`通过: ${passedTests} ✅`)
    console.log(`失败: ${failedTests} ❌`)
    console.log(`成功率: ${(passedTests / totalTests * 100).toFixed(1)}%`)
    
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0)
    console.log(`总耗时: ${totalDuration}ms`)
    
    if (failedTests > 0) {
      console.log('\n❌ 失败的测试:')
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.name}: ${r.message}`))
    }
    
    console.log('\n🎉 API修复功能测试完成!')
  }
}

// 导出测试套件
module.exports = APITestSuite

// 如果直接运行此文件，执行测试
if (typeof wx === 'undefined') {
  // 模拟微信小程序环境（用于Node.js测试）
  global.wx = {
    request: () => {},
    getStorageSync: () => null,
    setStorageSync: () => {},
    removeStorageSync: () => {}
  }
  
  const testSuite = new APITestSuite()
  testSuite.runAllTests().then(results => {
    process.exit(results.every(r => r.success) ? 0 : 1)
  })
}
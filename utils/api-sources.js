// utils/api-sources.js
/**
 * 多数据源API配置
 * 提供多个备用股票数据接口
 */

/**
 * API数据源配置
 */
const API_SOURCES = {
  // 新浪财经API
  sina: {
    name: '新浪财经',
    baseUrl: 'https://hq.sinajs.cn/list=',
    parseData: parseSinaData,
    priority: 1,
    timeout: 5000
  },
  
  // 网易财经API
  netease: {
    name: '网易财经',
    baseUrl: 'https://api.money.126.net/data/feed/',
    parseData: parseNeteaseData,
    priority: 2,
    timeout: 5000
  },
  
  // 东方财富API
  eastmoney: {
    name: '东方财富',
    baseUrl: 'https://push2.eastmoney.com/api/qt/ulist.np/get',
    parseData: parseEastmoneyData,
    priority: 3,
    timeout: 5000
  },
  
  // 腾讯财经API（备用）
  tencent: {
    name: '腾讯财经',
    baseUrl: 'https://qt.gtimg.com/q=',
    parseData: parseTencentData,
    priority: 4,
    timeout: 5000
  }
}

/**
 * 解析新浪财经数据
 * @param {string} data 原始数据
 * @returns {Array} 解析后的股票数据
 */
function parseSinaData(data) {
  if (!data) return []
  
  const stocks = []
  const lines = data.split('\n').filter(line => line.trim())
  
  lines.forEach(line => {
    const match = line.match(/var hq_str_(.+?)="(.+?)"/)
    if (match) {
      const code = match[1]
      const info = match[2].split(',')
      
      if (info.length >= 6) {
        // 新浪财经数据格式
        stocks.push({
          code: code,
          name: info[0],
          currentPrice: parseFloat(info[3]) || 0,
          change: parseFloat(info[4]) || 0,
          changePercent: parseFloat(info[5]) || 0,
          volume: parseInt(info[8]) || 0,
          turnover: parseFloat(info[9]) || 0,
          market: getMarketFromCode(code)
        })
      }
    }
  })
  
  return stocks
}

/**
 * 解析网易财经数据
 * @param {Object} data 原始数据
 * @returns {Array} 解析后的股票数据
 */
function parseNeteaseData(data) {
  if (!data || typeof data !== 'object') return []
  
  const stocks = []
  
  Object.keys(data).forEach(code => {
    const stock = data[code]
    if (stock) {
      stocks.push({
        code: code,
        name: stock.name || '',
        currentPrice: parseFloat(stock.price) || 0,
        change: parseFloat(stock.updown) || 0,
        changePercent: parseFloat(stock.percent) || 0,
        volume: parseInt(stock.volume) || 0,
        turnover: parseFloat(stock.turnover) || 0,
        market: getMarketFromCode(code)
      })
    }
  })
  
  return stocks
}

/**
 * 解析东方财富数据
 * @param {Object} data 原始数据
 * @returns {Array} 解析后的股票数据
 */
function parseEastmoneyData(data) {
  if (!data || !data.data || !data.data.diff) return []
  
  const stocks = []
  
  data.data.diff.forEach(item => {
    if (item) {
      stocks.push({
        code: item.f12,
        name: item.f14 || '',
        currentPrice: parseFloat(item.f2) || 0,
        change: parseFloat(item.f4) || 0,
        changePercent: parseFloat(item.f3) || 0,
        volume: parseInt(item.f5) || 0,
        turnover: parseFloat(item.f6) || 0,
        market: getMarketFromCode(item.f12)
      })
    }
  })
  
  return stocks
}

/**
 * 解析腾讯财经数据（原有格式）
 * @param {string} data 原始数据
 * @returns {Array} 解析后的股票数据
 */
function parseTencentData(data) {
  if (!data) return []
  
  const lines = data.split('\n').filter(line => line.trim())
  const stocks = []
  
  lines.forEach(line => {
    const match = line.match(/v_(.+?)="(.+?)"/)
    if (match) {
      const code = match[1]
      const info = match[2].split('~')
      
      if (info.length >= 4) {
        stocks.push({
          code: code,
          name: info[1],
          currentPrice: parseFloat(info[3]) || 0,
          change: parseFloat(info[4]) || 0,
          changePercent: parseFloat(info[5]) || 0,
          volume: parseInt(info[6]) || 0,
          turnover: parseFloat(info[7]) || 0,
          market: getMarketFromCode(code)
        })
      }
    }
  })
  
  return stocks
}

/**
 * 根据股票代码判断市场
 * @param {string} code 股票代码
 * @returns {string} 市场类型
 */
function getMarketFromCode(code) {
  if (code.startsWith('hk') || code.startsWith('HK')) return 'HK'
  if (code.startsWith('sh') || code.startsWith('sz') || code.startsWith('SH') || code.startsWith('SZ')) return 'A'
  return 'Unknown'
}

/**
 * 转换股票代码格式
 * @param {string} code 原始代码
 * @param {string} source API源
 * @returns {string} 转换后的代码
 */
function convertStockCode(code, source) {
  switch (source) {
    case 'sina':
      // 新浪财经格式：hk00700 -> rt_hk00700
      if (code.startsWith('hk')) {
        return `rt_${code}`
      }
      // A股格式：sh601318 -> sh601318
      return code
      
    case 'netease':
      // 网易财经格式：保持原格式
      return code
      
    case 'eastmoney':
      // 东方财富格式：需要特殊处理
      if (code.startsWith('hk')) {
        return code.replace('hk', '').padStart(5, '0')
      }
      return code.replace(/^(sh|sz)/, '')
      
    case 'tencent':
    default:
      // 腾讯财经格式：保持原格式
      return code
  }
}

/**
 * 获取可用的API源列表（按优先级排序）
 * @returns {Array} API源列表
 */
function getAvailableAPISources() {
  return Object.keys(API_SOURCES)
    .map(key => ({ key, ...API_SOURCES[key] }))
    .sort((a, b) => a.priority - b.priority)
}

module.exports = {
  API_SOURCES,
  parseSinaData,
  parseNeteaseData,
  parseEastmoneyData,
  parseTencentData,
  getMarketFromCode,
  convertStockCode,
  getAvailableAPISources
}
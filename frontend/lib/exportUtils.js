/**
 * ThinkTree 思维导图导出工具库
 * v3.0.0 - 导出功能优化版
 */

/**
 * 从 Markmap 实例获取 SVG 内容（最优化版，完全避免重绘 + 调试版）
 * @param {Object} markmapInstance - Markmap 实例
 * @returns {string} SVG 字符串
 */
export function getSVGFromMarkmap(markmapInstance) {
  console.log('🔍 [getSVGFromMarkmap] 开始获取SVG内容')
  
  if (!markmapInstance || !markmapInstance.svg) {
    console.log('🔍 [getSVGFromMarkmap] ❌ Markmap实例无效')
    throw new Error('Markmap 实例无效')
  }

  try {
    console.log('🔍 [getSVGFromMarkmap] 获取SVG节点')
    const svgElement = markmapInstance.svg.node()
    if (!svgElement) {
      console.log('🔍 [getSVGFromMarkmap] ❌ 无法获取SVG元素')
      throw new Error('无法获取 SVG 元素')
    }

    console.log('🔍 [getSVGFromMarkmap] 开始克隆SVG节点')
    // 完全静态化获取：不触发任何重新计算或重新渲染
    const clonedSvg = svgElement.cloneNode(true)
    
    console.log('🔍 [getSVGFromMarkmap] 设置SVG命名空间')
    // 确保SVG有正确的命名空间
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    
    console.log('🔍 [getSVGFromMarkmap] 获取当前尺寸和样式')
    // 获取当前的显示状态，完全不触发重新计算
    const computedStyle = window.getComputedStyle(svgElement)
    const currentWidth = svgElement.getAttribute('width') || 
                        svgElement.style.width || 
                        computedStyle.width || 
                        '800'
    const currentHeight = svgElement.getAttribute('height') || 
                         svgElement.style.height || 
                         computedStyle.height || 
                         '600'
    
    console.log('🔍 [getSVGFromMarkmap] 当前尺寸:', { currentWidth, currentHeight })
    
    // 使用当前viewBox，避免任何重新计算
    let currentViewBox = svgElement.getAttribute('viewBox')
    if (!currentViewBox) {
      console.log('🔍 [getSVGFromMarkmap] 生成viewBox')
      // 从当前尺寸创建viewBox，不使用getBBox等方法
      const width = parseFloat(currentWidth.toString().replace(/[^0-9.]/g, '')) || 800
      const height = parseFloat(currentHeight.toString().replace(/[^0-9.]/g, '')) || 600
      currentViewBox = `0 0 ${width} ${height}`
    }
    
    console.log('🔍 [getSVGFromMarkmap] 设置克隆SVG的属性')
    clonedSvg.setAttribute('viewBox', currentViewBox)
    clonedSvg.setAttribute('width', currentWidth.toString())
    clonedSvg.setAttribute('height', currentHeight.toString())
    
    console.log('🔍 [getSVGFromMarkmap] 添加内嵌样式')
    // 内嵌样式，确保导出的SVG完全独立
    const styleElement = document.createElement('style')
    styleElement.textContent = `
      .markmap > g > path {
        fill: none;
        stroke: #999;
        stroke-width: 1.5px;
      }
      .markmap-node circle {
        fill: #fff;
        stroke-width: 1.5px;
      }
      .markmap-node text {
        font: 300 16px/20px sans-serif;
        fill: #000;
      }
      .markmap-node > g {
        cursor: pointer;
      }
      .markmap-link {
        fill: none;
        stroke: #999;
        stroke-width: 1.5px;
      }
    `
    clonedSvg.insertBefore(styleElement, clonedSvg.firstChild)
    
    console.log('🔍 [getSVGFromMarkmap] 序列化SVG')
    // 将SVG元素转换为字符串
    const serializer = new XMLSerializer()
    const result = serializer.serializeToString(clonedSvg)
    
    console.log('🔍 [getSVGFromMarkmap] ✅ 导出SVG获取成功，无重新渲染')
    return result
  } catch (error) {
    console.error('🔍 [getSVGFromMarkmap] ❌ 获取SVG内容失败:', error)
    throw new Error(`获取SVG内容失败: ${error.message}`)
  }
}

/**
 * 下载文件的通用函数
 * @param {string|Blob} content - 文件内容
 * @param {string} filename - 文件名
 * @param {string} mimeType - MIME类型
 */
export function downloadFile(content, filename, mimeType = 'text/plain') {
  try {
    let blob
    if (content instanceof Blob) {
      blob = content
    } else {
      blob = new Blob([content], { type: mimeType })
    }
    
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    
    // 添加到DOM并触发点击
    document.body.appendChild(link)
    link.click()
    
    // 清理
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('下载文件失败:', error)
    throw new Error(`下载文件失败: ${error.message}`)
  }
}

/**
 * 导出SVG文件
 * @param {Object} markmapInstance - Markmap 实例
 * @param {string} filename - 文件名（不含扩展名）
 */
export function exportSVG(markmapInstance, filename = 'mindmap') {
  try {
    const svgContent = getSVGFromMarkmap(markmapInstance)
    const fullFilename = `${filename}.svg`
    downloadFile(svgContent, fullFilename, 'image/svg+xml')
    return { success: true, filename: fullFilename }
  } catch (error) {
    console.error('SVG导出失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * SVG转PNG（优化版，避免跨域问题）
 * @param {string} svgContent - SVG内容字符串
 * @param {number} scale - 缩放比例（用于提高分辨率）
 * @returns {Promise<Blob>} PNG Blob
 */
export function svgToPNG(svgContent, scale = 2) {
  return new Promise((resolve, reject) => {
    try {
      // 创建临时的SVG元素来获取尺寸
      const tempSvg = document.createElement('div')
      tempSvg.innerHTML = svgContent
      const svgElement = tempSvg.querySelector('svg')
      
      if (!svgElement) {
        throw new Error('无效的SVG内容')
      }
      
      // 获取SVG尺寸
      let width = parseFloat(svgElement.getAttribute('width')) || 800
      let height = parseFloat(svgElement.getAttribute('height')) || 600
      
      // 如果尺寸包含单位，移除单位
      if (typeof width === 'string') {
        width = parseFloat(width.replace(/[^0-9.]/g, '')) || 800
      }
      if (typeof height === 'string') {
        height = parseFloat(height.replace(/[^0-9.]/g, '')) || 600
      }
      
      // 创建Canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // 设置Canvas尺寸（使用缩放比例提高分辨率）
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      
      // 设置白色背景
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // 创建Image对象
      const img = new Image()
      
      // 设置跨域属性
      img.crossOrigin = 'anonymous'
      
      img.onload = function() {
        try {
          // 在Canvas上绘制SVG（缩放到指定尺寸）
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          
          // 转换为PNG Blob
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Canvas转换为Blob失败'))
            }
          }, 'image/png', 1.0)
        } catch (error) {
          reject(new Error(`Canvas绘制失败: ${error.message}`))
        }
      }
      
      img.onerror = function(e) {
        console.error('图像加载失败:', e)
        reject(new Error('SVG图像加载失败，可能是浏览器安全限制导致'))
      }
      
      // 使用Data URI方式加载SVG，避免跨域问题
      const svgDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`
      img.src = svgDataUri
      
    } catch (error) {
      reject(new Error(`SVG转PNG失败: ${error.message}`))
    }
  })
}

/**
 * 导出PNG文件
 * @param {Object} markmapInstance - Markmap 实例
 * @param {string} filename - 文件名（不含扩展名）
 * @param {number} scale - 缩放比例
 */
export async function exportPNG(markmapInstance, filename = 'mindmap', scale = 2) {
  try {
    const svgContent = getSVGFromMarkmap(markmapInstance)
    const pngBlob = await svgToPNG(svgContent, scale)
    const fullFilename = `${filename}.png`
    downloadFile(pngBlob, fullFilename, 'image/png')
    return { success: true, filename: fullFilename }
  } catch (error) {
    console.error('PNG导出失败:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 获取安全的文件名（移除特殊字符）
 * @param {string} title - 原始标题
 * @returns {string} 安全的文件名
 */
export function getSafeFilename(title) {
  if (!title || typeof title !== 'string') {
    return 'mindmap'
  }
  
  // 移除特殊字符，保留中文、英文、数字、下划线、连字符
  const safeTitle = title
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9_\-\s]/g, '')
    .replace(/\s+/g, '_')
    .trim()
  
  return safeTitle || 'mindmap'
}

/**
 * 格式化时间戳用于文件名
 * @returns {string} 格式化的时间戳
 */
export function getTimestamp() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  
  return `${year}${month}${day}_${hour}${minute}`
} 
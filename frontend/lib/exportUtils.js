/**
 * ThinkTree 思维导图导出工具库
 * v3.0.0 - 导出功能
 */

/**
 * 从 Markmap 实例获取 SVG 内容
 * @param {Object} markmapInstance - Markmap 实例
 * @returns {string} SVG 字符串
 */
export function getSVGFromMarkmap(markmapInstance) {
  if (!markmapInstance || !markmapInstance.svg) {
    throw new Error('Markmap 实例无效')
  }

  try {
    const svgElement = markmapInstance.svg.node()
    if (!svgElement) {
      throw new Error('无法获取 SVG 元素')
    }

    // 克隆SVG元素以避免修改原始元素
    const clonedSvg = svgElement.cloneNode(true)
    
    // 确保SVG有正确的命名空间
    clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    clonedSvg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink')
    
    // 获取SVG的尺寸
    const bbox = svgElement.getBBox()
    const padding = 20
    
    // 设置viewBox以包含所有内容
    clonedSvg.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + 2 * padding} ${bbox.height + 2 * padding}`)
    clonedSvg.setAttribute('width', bbox.width + 2 * padding)
    clonedSvg.setAttribute('height', bbox.height + 2 * padding)
    
    // 添加必要的样式到SVG中
    const styleElement = document.createElement('style')
    styleElement.textContent = `
      .markmap > g > path {
        fill: none;
        stroke: #999;
        stroke-width: 1.5px;
      }
      .markmap-node > circle {
        fill: #fff;
        stroke: #999;
        stroke-width: 1.5px;
      }
      .markmap-node > text {
        fill: #333;
        font-size: 12px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      .markmap-link {
        fill: none;
        stroke: #999;
        stroke-width: 1.5px;
      }
    `
    clonedSvg.insertBefore(styleElement, clonedSvg.firstChild)
    
    // 将SVG元素转换为字符串
    const serializer = new XMLSerializer()
    return serializer.serializeToString(clonedSvg)
  } catch (error) {
    console.error('获取SVG内容失败:', error)
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
 * 将SVG转换为PNG
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
      const width = parseFloat(svgElement.getAttribute('width')) || 800
      const height = parseFloat(svgElement.getAttribute('height')) || 600
      
      // 创建Canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      // 设置Canvas尺寸（使用缩放比例提高分辨率）
      canvas.width = width * scale
      canvas.height = height * scale
      
      // 设置白色背景
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // 创建Image对象
      const img = new Image()
      
      img.onload = function() {
        try {
          // 在Canvas上绘制SVG
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
      
      img.onerror = function() {
        reject(new Error('SVG图像加载失败'))
      }
      
      // 将SVG转换为Data URL
      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)
      img.src = url
      
      // 清理URL对象
      img.onload = function() {
        URL.revokeObjectURL(url)
        try {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
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
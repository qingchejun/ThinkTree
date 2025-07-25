/**
 * 积分相关的工具函数
 */

// 估算文本处理所需积分（基于文本长度）
export function estimateCreditsForText(text) {
  if (!text) return 0;
  
  const length = text.length;
  
  // 基础积分计算：每1000个字符消耗10积分
  const baseCredits = Math.ceil(length / 1000) * 10;
  
  // 最低消耗5积分
  return Math.max(baseCredits, 5);
}

// 估算文件处理所需积分（基于文件大小和类型）
export function estimateCreditsForFile(file) {
  if (!file) return 0;
  
  const sizeInMB = file.size / (1024 * 1024);
  const fileType = file.type;
  
  let multiplier = 1;
  
  // 不同文件类型的处理复杂度不同
  if (fileType.includes('pdf')) {
    multiplier = 2; // PDF处理更复杂
  } else if (fileType.includes('word') || fileType.includes('docx')) {
    multiplier = 1.5; // Word文档中等复杂度
  } else {
    multiplier = 1; // 纯文本文件最简单
  }
  
  // 基础积分：每MB消耗20积分
  const baseCredits = Math.ceil(sizeInMB * 20 * multiplier);
  
  // 最低消耗10积分
  return Math.max(baseCredits, 10);
}

// 检查积分是否足够
export function checkSufficientCredits(userCredits, requiredCredits) {
  return userCredits >= requiredCredits;
}

// 格式化积分显示
export function formatCredits(credits) {
  if (credits >= 1000000) {
    return (credits / 1000000).toFixed(1) + 'M';
  } else if (credits >= 1000) {
    return (credits / 1000).toFixed(1) + 'K';
  }
  return credits.toString();
}

// 积分不足时的建议操作
export function getCreditSuggestions(shortfall) {
  const suggestions = [];
  
  if (shortfall <= 100) {
    suggestions.push('邀请1位朋友注册可获得100积分');
  } else if (shortfall <= 500) {
    suggestions.push('邀请5位朋友注册可获得500积分');
  } else {
    suggestions.push('邀请更多朋友注册以获得更多积分');
  }
  
  return suggestions;
}
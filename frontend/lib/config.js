/**
 * 前端配置管理
 */

// 获取API基础URL
export const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // 开发环境下打印配置信息
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 API Base URL:', url);
    console.log('🔧 Environment:', process.env.NODE_ENV);
  }
  
  return url;
};

// API配置
export const API_CONFIG = {
  baseUrl: getApiBaseUrl(),
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json',
  },
};

// 健康检查端点
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/health`, {
      method: 'GET',
      timeout: 5000,
    });
    
    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      statusCode: response.status,
      url: `${API_CONFIG.baseUrl}/health`,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      url: `${API_CONFIG.baseUrl}/health`,
    };
  }
};
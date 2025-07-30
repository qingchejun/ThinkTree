/**
 * useMindMap 自定义 React Hook
 *
 * 功能:
 * - 封装了与思维导图相关的 CRUD (创建, 读取, 删除) 操作。
 * - 管理加载状态 (isLoading) 和错误状态 (error)。
 * - 与 AuthContext 集成，自动处理用户认证 Token。
 *
 * 返回:
 * - maps: (Array) 思维导图列表。
 * - isLoading: (boolean) 是否有任何操作正在进行中。
 * - error: (Error | null) 操作过程中发生的错误。
 * - fetchMaps: (Function) 异步函数，用于获取当前用户的所有思维导图。
 * - createMap: (Function) 异步函数，用于创建新的思维导图。接受 { title, content, description }。
 * - deleteMap: (Function) 异步函数，用于删除指定的思维导图。接受 mindmapId。
 */
import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export const useMindMap = () => {
  const { token } = useAuth();
  const [maps, setMaps] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  /**
   * 获取用户的所有思维导图
   */
  const fetchMaps = useCallback(async () => {
    if (!token) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/mindmaps/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '获取思维导图列表失败');
      }

      const data = await response.json();
      setMaps(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL]);

  /**
   * 创建一个新的思维导图
   * @param {{ title: string, content: string, description: string }} mapData - 新导图的数据
   * @returns {Promise<Object>} - 成功时返回创建的思维导图对象
   */
  const createMap = useCallback(async ({ title, content, description }) => {
    if (!token) {
      throw new Error('用户未认证，无法创建思维导图');
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/mindmaps/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title.trim(),
          content,
          description: description ? description.trim() : null,
          is_public: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '保存思维导图失败');
      }

      const newMap = await response.json();
      setMaps(prevMaps => [newMap, ...prevMaps]);
      return newMap;
    } catch (err) {
      setError(err.message);
      throw err; // 重新抛出错误，以便调用方可以捕获
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL]);

  /**
   * 删除一个思维导图
   * @param {string} mindmapId - 要删除的思维导图ID
   * @returns {Promise<boolean>} - 成功时返回 true
   */
  const deleteMap = useCallback(async (mindmapId) => {
    if (!token) {
        throw new Error('用户未认证，无法删除思维导图');
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/mindmaps/${mindmapId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '删除思维导图失败');
      }
      
      setMaps(prev => prev.filter(map => map.id !== mindmapId));
      return true;
    } catch (err) {
      setError(err.message);
      throw err; // 重新抛出错误
    } finally {
      setIsLoading(false);
    }
  }, [token, API_URL]);

  return { maps, isLoading, error, fetchMaps, createMap, deleteMap };
};

"""
高效缓存服务 - 优化思维导图生成性能
集成文件缓存和积分计算缓存
"""

import time
import uuid
import asyncio
from typing import Dict, Optional, Any, Union
from threading import Lock
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass



@dataclass
class CacheEntry:
    """缓存条目数据结构"""
    data: Any
    user_id: int
    created_at: float
    expires_at: float
    access_count: int = 0
    last_access: float = 0


class HighPerformanceCache:
    """高性能内存缓存管理器"""
    
    def __init__(self, default_ttl: int = 3600, max_entries: int = 1000):
        self.cache: Dict[str, CacheEntry] = {}
        self.default_ttl = default_ttl
        self.max_entries = max_entries
        self.lock = Lock()
        self.executor = ThreadPoolExecutor(max_workers=4)
        
        # 启动清理任务
        asyncio.create_task(self._cleanup_task())
    
    def set(self, key: str, data: Any, user_id: int, ttl: Optional[int] = None) -> str:
        """设置缓存项"""
        expires_at = time.time() + (ttl or self.default_ttl)
        
        with self.lock:
            # 如果超过最大条目数，清理最老的条目
            if len(self.cache) >= self.max_entries:
                self._evict_oldest()
            
            self.cache[key] = CacheEntry(
                data=data,
                user_id=user_id,
                created_at=time.time(),
                expires_at=expires_at
            )
        
        return key
    
    def get(self, key: str, user_id: int) -> Optional[Any]:
        """获取缓存项"""
        with self.lock:
            if key not in self.cache:
                return None
            
            entry = self.cache[key]
            
            # 检查权限
            if entry.user_id != user_id:
                return None
            
            # 检查过期
            if time.time() > entry.expires_at:
                del self.cache[key]
                return None
            
            # 更新访问统计
            entry.access_count += 1
            entry.last_access = time.time()
            
            return entry.data
    
    def delete(self, key: str, user_id: int) -> bool:
        """删除缓存项"""
        with self.lock:
            if key not in self.cache:
                return False
            
            entry = self.cache[key]
            if entry.user_id != user_id:
                return False
            
            del self.cache[key]
            return True
    
    def _evict_oldest(self):
        """清理最老的条目"""
        if not self.cache:
            return
        
        oldest_key = min(self.cache.keys(), 
                        key=lambda k: self.cache[k].created_at)
        del self.cache[oldest_key]
    
    async def _cleanup_task(self):
        """定期清理过期条目"""
        while True:
            await asyncio.sleep(300)  # 每5分钟清理一次
            
            with self.lock:
                current_time = time.time()
                expired_keys = [
                    key for key, entry in self.cache.items()
                    if current_time > entry.expires_at
                ]
                
                for key in expired_keys:
                    del self.cache[key]


# 全局缓存实例
cache_manager = HighPerformanceCache()


class FileProcessingCache:
    """文件处理缓存服务"""
    
    @staticmethod
    def store_file_analysis(user_id: int, filename: str, content: str, 
                          file_type: str, credit_cost: int) -> str:
        """
        存储文件分析结果
        
        Args:
            user_id: 用户ID
            filename: 文件名
            content: 解析内容
            file_type: 文件类型
            credit_cost: 积分成本
        
        Returns:
            str: 文件token
        """
        file_token = str(uuid.uuid4())
        
        cache_data = {
            'filename': filename,
            'content': content,
            'file_type': file_type,
            'credit_cost': credit_cost,
            'content_preview': content[:200] + "..." if len(content) > 200 else content,
            'text_length': len(content.strip())
        }
        
        cache_manager.set(file_token, cache_data, user_id, ttl=3600)
        return file_token
    
    @staticmethod
    def get_file_analysis(file_token: str, user_id: int) -> Optional[Dict]:
        """获取文件分析结果"""
        return cache_manager.get(file_token, user_id)
    


class CreditCalculationCache:
    """积分计算缓存服务"""
    
    _credit_cache: Dict[str, Dict] = {}
    _cache_lock = Lock()
    
    @staticmethod
    def get_cached_credit_cost(content: str, calculation_type: str = 'file') -> Optional[int]:
        """获取缓存的积分成本"""
        cache_key = f"{calculation_type}:{hash(content)}"
        
        with CreditCalculationCache._cache_lock:
            if cache_key in CreditCalculationCache._credit_cache:
                cached_data = CreditCalculationCache._credit_cache[cache_key]
                
                # 检查缓存是否过期（10分钟）
                if time.time() - cached_data['cached_at'] < 600:
                    return cached_data['cost']
                else:
                    # 清理过期缓存
                    del CreditCalculationCache._credit_cache[cache_key]
        
        return None
    
    @staticmethod
    def set_credit_cost_cache(content: str, cost: int, calculation_type: str = 'file'):
        """设置积分成本缓存"""
        cache_key = f"{calculation_type}:{hash(content)}"
        
        with CreditCalculationCache._cache_lock:
            CreditCalculationCache._credit_cache[cache_key] = {
                'cost': cost,
                'cached_at': time.time()
            }
    
    @staticmethod
    def calculate_file_credit_cost_cached(content: str) -> int:
        """计算文件积分成本（带缓存）"""
        # 先尝试从缓存获取
        cached_cost = CreditCalculationCache.get_cached_credit_cost(content, 'file')
        if cached_cost is not None:
            return cached_cost
        
        # 计算成本
        text_length = len(content.strip())
        cost = max(1, (text_length + 99) // 100)  # 每100字符1积分，向上取整
        
        # 存入缓存
        CreditCalculationCache.set_credit_cost_cache(content, cost, 'file')
        return cost
    
    @staticmethod
    def calculate_text_credit_cost_cached(content: str) -> int:
        """计算文本积分成本（带缓存）"""
        # 先尝试从缓存获取
        cached_cost = CreditCalculationCache.get_cached_credit_cost(content, 'text')
        if cached_cost is not None:
            return cached_cost
        
        # 计算成本
        text_length = len(content.strip())
        cost = max(1, (text_length + 99) // 100)  # 每100字符1积分，向上取整
        
        # 存入缓存
        CreditCalculationCache.set_credit_cost_cache(content, cost, 'text')
        return cost


# 导出主要接口
__all__ = [
    'FileProcessingCache',
    'CreditCalculationCache',
    'cache_manager'
]
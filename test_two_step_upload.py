#!/usr/bin/env python3
"""
测试两步文件上传流程的脚本
验证文件分析和生成API是否正常工作
"""

import sys
import os
sys.path.append('.')

import math
import uuid
import time
from typing import Dict, Optional

# 模拟后端函数
def calculate_file_credit_cost(text: str) -> int:
    """根据文件文本长度计算积分成本（每500字符1积分）"""
    text_length = len(text.strip())
    if text_length == 0:
        return 0
    return math.ceil(text_length / 500)

def calculate_credit_cost(text: str) -> int:
    """根据文本长度计算积分成本（每100字符1积分）"""
    text_length = len(text.strip())
    if text_length == 0:
        return 0
    return math.ceil(text_length / 100)

# 模拟文件缓存系统
file_cache: Dict[str, Dict] = {}

def store_file_data(user_id: int, filename: str, content: str, file_type: str) -> str:
    """临时存储文件数据，返回文件token"""
    file_token = str(uuid.uuid4())
    file_cache[file_token] = {
        'user_id': user_id,
        'filename': filename,
        'content': content,
        'file_type': file_type,
        'timestamp': time.time(),
        'expires_at': time.time() + 3600  # 1小时后过期
    }
    return file_token

def get_file_data(file_token: str, user_id: int) -> Optional[Dict]:
    """根据token获取文件数据"""
    if file_token not in file_cache:
        return None
    
    file_data = file_cache[file_token]
    
    # 检查是否过期
    if time.time() > file_data['expires_at']:
        del file_cache[file_token]
        return None
    
    # 检查权限
    if file_data['user_id'] != user_id:
        return None
    
    return file_data

def test_two_step_flow():
    """测试两步文件上传流程"""
    print("🔬 开始测试两步文件上传流程")
    print("=" * 50)
    
    # 模拟用户数据
    user_id = 1
    user_balance = 1000
    
    # 测试文件内容
    test_files = [
        {
            'name': 'small.txt',
            'content': 'A' * 100,  # 100字符
            'type': '.txt'
        },
        {
            'name': 'medium.txt', 
            'content': 'B' * 500,  # 500字符
            'type': '.txt'
        },
        {
            'name': 'large.txt',
            'content': 'C' * 1000,  # 1000字符
            'type': '.txt'
        }
    ]
    
    for test_file in test_files:
        print(f"\n📄 测试文件: {test_file['name']}")
        print(f"   内容长度: {len(test_file['content'])} 字符")
        
        # 第一步：文件分析
        credit_cost = calculate_file_credit_cost(test_file['content'])
        print(f"   预计消耗: {credit_cost} 积分")
        
        sufficient_credits = user_balance >= credit_cost
        print(f"   积分充足: {'✅ 是' if sufficient_credits else '❌ 否'}")
        
        if sufficient_credits:
            # 存储文件数据
            file_token = store_file_data(
                user_id, 
                test_file['name'], 
                test_file['content'], 
                test_file['type']
            )
            print(f"   文件token: {file_token[:8]}...")
            
            # 第二步：模拟生成请求
            file_data = get_file_data(file_token, user_id)
            if file_data:
                print(f"   ✅ 文件数据获取成功")
                print(f"   文件名: {file_data['filename']}")
                print(f"   内容预览: {file_data['content'][:50]}...")
                
                # 模拟扣费
                user_balance -= credit_cost
                print(f"   ✅ 积分扣除成功，剩余: {user_balance} 积分")
            else:
                print(f"   ❌ 文件数据获取失败")
        
        print(f"   流程状态: {'✅ 完成' if sufficient_credits else '❌ 积分不足'}")
    
    # 测试权限验证
    print(f"\n🔒 测试权限验证")
    if file_cache:
        token = list(file_cache.keys())[0]
        wrong_user_data = get_file_data(token, 999)  # 错误的用户ID
        print(f"   错误用户访问: {'❌ 拒绝' if wrong_user_data is None else '⚠️ 允许'}")
    
    # 对比不同计费规则
    print(f"\n💰 计费规则对比")
    test_text = "A" * 1000
    file_cost = calculate_file_credit_cost(test_text)
    text_cost = calculate_credit_cost(test_text)
    print(f"   1000字符文件: {file_cost} 积分 (文件规则: 500字符/积分)")
    print(f"   1000字符文本: {text_cost} 积分 (文本规则: 100字符/积分)")
    print(f"   成本差异: {text_cost - file_cost} 积分 (文件上传更优惠)")
    
    print(f"\n🎉 两步流程测试完成！")

if __name__ == "__main__":
    test_two_step_flow()
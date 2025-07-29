"""
AI 处理模块 - Google Gemini 集成
"""

import json
from typing import Dict, List, Any, Optional
import google.generativeai as genai
from app.core.config import settings

class GeminiProcessor:
    """Google Gemini AI 处理器"""
    
    def __init__(self):
        """初始化 Gemini AI 服务"""
        if settings.gemini_api_key:
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None
    
    async def generate_mindmap_structure(self, content: str, format_type: str = "standard") -> Dict[str, Any]:
        """
        核心功能：将文本内容转换为思维导图结构
        确保关键信息不丢失，支持多种格式输出
        """
        if not self.model:
            return {
                "success": False,
                "error": "Gemini API key not configured"
            }
        
        prompt = self._build_mindmap_prompt(content, format_type)
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # 清理响应文本，提取Markdown部分
            cleaned_markdown = self._clean_markdown_response(response_text)
            
            if not cleaned_markdown:
                return {
                    "success": False,
                    "error": "AI 未生成有效的思维导图内容",
                    "raw_response": response_text
                }
            
            # 提取标题
            title = self._extract_title_from_markdown(cleaned_markdown)
            
            return {
                "success": True,
                "data": {
                    "title": title,
                    "markdown": cleaned_markdown,
                    "format": "markdown"
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"AI生成失败: {str(e)}"
            }
    
    async def generate_mindmap_with_preprocessing(self, content: str, format_type: str = "standard", 
                                                preprocessed_data: Dict = None) -> Dict[str, Any]:
        """
        使用预处理数据的快速生成方法
        利用分析阶段的预处理结果来加速生成过程
        
        Args:
            content: 原始文本内容
            format_type: 格式类型
            preprocessed_data: 预处理数据，包含关键点等
        
        Returns:
            Dict: 生成结果
        """
        if not self.model:
            return {
                "success": False,
                "error": "Gemini API key not configured"
            }
        
        # 使用预处理数据构建优化的提示
        prompt = self._build_optimized_prompt(content, format_type, preprocessed_data)
        
        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # 清理响应文本，提取Markdown部分
            cleaned_markdown = self._clean_markdown_response(response_text)
            
            if not cleaned_markdown:
                # 降级到标准方法
                return await self.generate_mindmap_structure(content, format_type)
            
            # 提取标题
            title = self._extract_title_from_markdown(cleaned_markdown)
            
            return {
                "success": True,
                "data": {
                    "title": title,
                    "markdown": cleaned_markdown,
                    "format": "markdown",
                    "used_preprocessing": True
                }
            }
            
        except Exception as e:
            # 如果优化方法失败，降级到标准方法
            print(f"预处理生成失败，降级到标准方法: {e}")
            return await self.generate_mindmap_structure(content, format_type)
    
    def _clean_markdown_response(self, text: str) -> str:
        """清理AI响应，提取Markdown内容"""
        # 移除markdown代码块标记
        text = text.replace("```markdown", "").replace("```", "")
        
        # 移除多余的空行和首尾空格
        lines = [line.rstrip() for line in text.split('\n')]
        cleaned_lines = []
        
        for line in lines:
            if line.strip():  # 只保留非空行
                cleaned_lines.append(line)
        
        return '\n'.join(cleaned_lines)
    
    def _extract_title_from_markdown(self, markdown: str) -> str:
        """从Markdown中提取主标题"""
        lines = markdown.split('\n')
        for line in lines:
            if line.strip().startswith('# '):
                return line.strip()[2:].strip()
        return "思维导图"
    
    def _validate_mindmap_structure(self, data: dict) -> bool:
        """验证思维导图数据结构"""
        required_keys = ['title', 'nodes']
        
        # 检查必要的键
        for key in required_keys:
            if key not in data:
                return False
        
        # 检查nodes结构
        if not isinstance(data['nodes'], list) or len(data['nodes']) == 0:
            return False
            
        for node in data['nodes']:
            if not all(key in node for key in ['id', 'data', 'type']):
                return False
            if 'label' not in node['data']:
                return False
        
        return True
    
    async def extract_key_points(self, content: str) -> List[str]:
        """提取关键信息点"""
        if not self.model:
            return []
            
        prompt = f"""
        请从以下内容中提取关键信息点，确保不遗漏重要内容：

        内容：
        {content}

        要求：
        1. 提取所有重要观点和概念
        2. 保持信息的层次结构
        3. 返回JSON格式的列表

        返回格式：
        ["关键点1", "关键点2", "关键点3", ...]
        """

        try:
            response = self.model.generate_content(prompt)
            return json.loads(response.text.strip())
        except Exception:
            return []
    
    def _build_mindmap_prompt(self, content: str, format_type: str) -> str:
        """构建思维导图生成提示 - 优化版本，平衡信息完整性与视觉清晰度"""
        
        # 限制内容长度，避免超出 token 限制
        if len(content) > 4000:
            content = content[:4000] + "...(内容已截断，请确保重要信息不丢失)"

        prompt = f"""你是专业的思维导图生成器。请**严格基于提供的原文内容**，将其转换为清晰的Markdown格式思维导图。

**铁律约束（必须严格遵守）：**
🚫 **禁止添加原文中不存在的任何信息、观点或细节**
🚫 **禁止进行推理延伸、知识补充或联想扩展**
🚫 **每个分支的内容不得超过150字**
🚫 **总输出不得超过1200字**
✅ **只能重组、归纳、提炼、简化原文已有内容**

**结构要求：**
- 一级标题 (#): 核心主题，1个
- 二级标题 (##): 主要分支，3-6个
- 三级标题 (###): 子论点，每个二级分支下最多4个
- 列表项 (-): 具体要点，每项不超过30字

**生成步骤：**
1. 仔细阅读原文，提取核心主题
2. 识别主要分支（来自原文的关键部分）
3. 为每个分支提炼子要点（直接来自原文）
4. **自我检查**：确认每个内容都能在原文中找到对应

**输出格式：**
严格使用Markdown语法，层级清晰，表述简洁。

---
原始文本内容：
{content}
---

请严格按照以上要求生成思维导图："""
        return prompt
    
    def _build_optimized_prompt(self, content: str, format_type: str, preprocessed_data: Dict) -> str:
        """
        构建优化的提示，利用预处理数据 - 与标准提示保持一致性
        使用预提取的关键点来加速生成过程，但保持相同的输出质量标准
        """
        # 限制内容长度，避免超出 token 限制
        if len(content) > 4000:
            content = content[:4000] + "...(内容已截断，请确保重要信息不丢失)"
        
        # 提取预处理数据
        key_points = preprocessed_data.get('key_points', []) if preprocessed_data else []
        
        # 构建包含预处理信息的优化提示
        key_points_text = ""
        if key_points:
            key_points_text = f"""
**预处理分析结果:**
{chr(10).join(f"- {point}" for point in key_points[:10])}

利用以上预处理信息，快速构建结构化思维导图：
"""
        
        optimized_prompt = f"""你是专业的思维导图生成器。请**严格基于提供的原文内容**，将其转换为清晰的Markdown格式思维导图。

{key_points_text}

**铁律约束（必须严格遵守）：**
🚫 **禁止添加原文中不存在的任何信息、观点或细节**
🚫 **禁止进行推理延伸、知识补充或联想扩展**
🚫 **每个分支的内容不得超过150字**
🚫 **总输出不得超过1200字**
✅ **只能重组、归纳、提炼、简化原文已有内容**

**结构要求：**
- 一级标题 (#): 核心主题，1个
- 二级标题 (##): 主要分支，3-6个
- 三级标题 (###): 子论点，每个二级分支下最多4个
- 列表项 (-): 具体要点，每项不超过30字

**标题生成规则（按步骤执行）：**
1. **基础处理**（所有内容均需应用）：
   - 移除作者姓名、来源平台、网站名称等
   - 添加内容类型标识（如：[学术]、[实用]、[技术]、[商业]等）
   - 保持简洁明确，去除冗余词汇

2. **长度判断**：
   - 若基础处理后的核心主题 ≤15字：直接使用
   - 若基础处理后的核心主题 >15字：进一步精简至15字以内

**生成步骤：**
1. 仔细阅读原文，提取核心主题并应用标题生成规则
2. 识别主要分支（来自原文的关键部分）
3. 为每个分支提炼子要点（直接来自原文）
4. **自我检查**：确认每个内容都能在原文中找到对应

**输出格式：**
严格使用Markdown语法，层级清晰，表述简洁。

---
原始文本内容：
{content}
---

请严格按照以上要求生成思维导图："""
        
        return optimized_prompt

# 创建全局 AI 处理器实例
ai_processor = GeminiProcessor()
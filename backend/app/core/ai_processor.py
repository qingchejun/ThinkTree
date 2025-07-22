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
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
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
                    "markdown": cleaned_markdown,
                    "title": title
                },
                "format": "markdown"
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"AI处理错误: {str(e)}"
            }
    
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
        """构建思维导图生成提示 - 使用专业的知识架构师模板"""
        
        # 限制内容长度，避免超出 token 限制
        if len(content) > 4000:
            content = content[:4000] + "...(内容已截断，请确保重要信息不丢失)"

        prompt = f"""你是一个顶级的知识架构师和信息分析专家。你的核心任务是将用户提供的复杂、可能结构混乱的原始文本，转换成一份极其详细、高度结构化、完全忠于原文信息的 Markdown 格式思维导图。

**你必须严格遵循以下所有规则：**

1. **【无损原则】**: 你的首要目标是 **零信息损失**。必须捕捉并包含原文中所有的关键概念、论点、论据、数据、案例和细节。如果原文提到了一个具体的名字、数字或例子，你的导图中也必须体现出来。

2. **【结构保留原则】**: 尽可能地识别并保留原文的内在逻辑结构和层级关系。如果原文是按"总-分-总"或者"问题-分析-解决"的结构来写的，你的思维导图主干也应该反映出这种结构。

3. **【逐层深化】**:
    * 一级标题 (#): 应该是整个文档最核心、最顶层的主题。
    * 二级标题 (##): 应该是支撑核心主题的关键分支或主要部分。
    * 三级标题 (###): 应该是对二级分支的进一步展开或子论点。
    * 列表项 (-): 用于列举具体的细节、例子、数据或步骤。可以使用多级缩进列表来表示更深层次的从属关系。

4. **【精确提炼，而非泛泛总结】**: 你的输出应该是对原文信息的**结构化呈现**，而不是模糊的概括。
    * **错误示范**: "作者讨论了几个工具。"
    * **正确示范**: "- 工具示例: Evernote, Notion"

5. **【完整性检查】**: 确保你的思维导图涵盖了原文的所有主要观点、支撑论据和重要细节。宁可详细也不要遗漏。

现在，请基于以上所有规则，处理以下原始文本：

---
原始文本内容：
{content}
---

请直接返回完整的 Markdown 格式思维导图，确保信息无损且结构清晰："""
        return prompt

# 创建全局 AI 处理器实例
ai_processor = GeminiProcessor()
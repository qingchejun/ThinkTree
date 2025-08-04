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
        print(f"初始化 Gemini AI 处理器...")
        print(f"API密钥状态: {'已设置' if settings.gemini_api_key else '未设置'}")
        if settings.gemini_api_key:
            print(f"API密钥前6位: {settings.gemini_api_key[:6]}...")
            genai.configure(api_key=settings.gemini_api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            print("Gemini 模型初始化成功")
        else:
            print("警告: Gemini API密钥未设置，AI功能将不可用")
            self.model = None
    
    async def generate_mindmap_structure(self, content: str) -> Dict[str, Any]:
        """
        核心功能：将文本内容转换为思维导图结构
        统一的AI生成方法，确保关键信息不丢失
        """
        if not self.model:
            error_msg = f"Gemini API 未配置 - API key: {'已设置' if settings.gemini_api_key else '未设置'}"
            print(f"AI处理器错误: {error_msg}")
            return {
                "success": False,
                "error": error_msg
            }
        
        prompt = self._build_mindmap_prompt(content)
        
        try:
            print(f"正在调用 Gemini API，内容长度: {len(content)} 字符")
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            print(f"Gemini API 响应成功，响应长度: {len(response_text)} 字符")
            
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
            error_msg = f"AI生成失败: {str(e)}"
            print(f"Gemini API 调用失败: {error_msg}")
            print(f"错误类型: {type(e).__name__}")
            
            # 更详细的错误信息
            if "API_KEY_INVALID" in str(e):
                error_msg = "API密钥无效，请检查Gemini API配置"
            elif "PERMISSION_DENIED" in str(e):
                error_msg = "API权限被拒绝，请检查API密钥权限"
            elif "QUOTA_EXCEEDED" in str(e):
                error_msg = "API调用次数已达上限，请稍后重试"
            
            return {
                "success": False,
                "error": error_msg
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
    
    
    def _build_mindmap_prompt(self, content: str) -> str:
        """构建思维导图生成提示"""
        
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
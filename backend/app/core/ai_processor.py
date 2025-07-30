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
    
    async def generate_mindmap_structure(self, content: str) -> Dict[str, Any]:
        """
        核心功能：将文本内容转换为思维导图结构
        统一的AI生成方法，确保关键信息不丢失
        """
        if not self.model:
            return {
                "success": False,
                "error": "Gemini API key not configured"
            }
        
        prompt = self._build_mindmap_prompt(content)
        
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

        prompt = f"""# 角色与使命 (Role & Mission)

你是一位顶级的知识管理专家和信息架构师。
你的核心使命是将给定的原始材料，无损地、全面地、且结构化地转换为一个详细的 Markdown 思维导图。最高优先级是 **确保不遗漏任何关键信息和知识点**。

# 核心原则 (Core Principles)

1.  **全面性第一 (Comprehensiveness First):** 相比于简洁，**信息的完整性**拥有绝对优先权。即使内容看起来有些长，也必须包含所有必要的知识点。宁可过于详细，也不可遗漏关键信息。
2.  **绝对忠于原文 (Absolute Fidelity to the Source):** 严禁添加、推断或演绎任何原文未明确提及的信息。所有输出都必须能在原文中找到直接或间接的依据。不要进行任何形式的个人总结或观点升华。
3.  **逻辑清晰，层层递进 (Clear Logic, Progressive Layers):** 导图结构必须反映原文的内在逻辑，从宏观到微观，逐层展开。保持清晰的父子关系，确保每个知识点都挂载在正确的逻辑分支下。

# 工作流程 (Workflow)

请严格遵循以下四个步骤来构建思维导图：

**Step 1: 全局通读与主题确立 (Global Read-through & Theme Establishment)**
首先，完整阅读并理解全部内容，确立最核心、最顶层的中心主题，作为思维导图的根节点（`#` 一级标题）。

**Step 2: 提取主要分支 (Extraction of Main Branches)**
识别出构成核心主题的几个主要组成部分、关键论点或主要流程/阶段。这些将成为二级分支（`##` 二级标题）。确保所有大的板块都被识别出来。

**Step 3: 详细拆解与内容填充 (Detailed Decomposition & Content Population)**
对每一个二级分支，**递归地向下拆解**。提取支撑该分支的子论点、定义、案例、数据、步骤、正反观点等，作为三级节点（`###` 三级标题）。如果三级节点下还有更细致的知识点（例如，一个步骤的具体操作、一个案例的详细数据、一个概念的多种解释），则使用列表项 (`-`) 进行无限深度的补充。**这是确保信息不丢失的关键步骤，务必详尽。**

**Step 4: 最终审查与核对 (Final Review & Verification)**
生成完毕后，在脑海中与原文进行一次快速比对，自查是否遗漏了任何重要的概念、数据、人物、地点或结论。

# 输出格式 (Output Format)

请严格使用以下 Markdown 语法进行输出，确保格式清晰、统一：

- **一级标题 (根节点):** `# [思维导图中心主题]`
- **二级标题 (主要分支):** `## [主要分支名称]`
- **三级标题 (子论点/模块):** `### [子论点名称]`
- **四级及以下细节 (具体知识点):** 使用嵌套的 `-` 列表项。

  - `- [细节/知识点a]`
    - `- [更深层次的细节1]`
    - `- [更深层次的细节2]`
  - `- [细节/知识点b]`

---
**原始材料如下：**

{content}

---
请严格遵循以上所有规则，开始生成详细的思维导图。"""
        return prompt

# 创建全局 AI 处理器实例
ai_processor = GeminiProcessor()
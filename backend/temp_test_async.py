import asyncio
import os
from dotenv import load_dotenv

# 加载环境变量，确保ai_processor能获取到API Key
# 这里的路径是相对于项目根目录的
load_dotenv(dotenv_path='./.env')

from app.core.ai_processor import ai_processor

async def main():
    print("--- 开始异步AI功能测试 ---")
    
    # 检查API Key是否已加载
    if not os.getenv("GEMINI_API_KEY"):
        print("错误：GEMINI_API_KEY 环境变量未设置。请检查 .env 文件。")
        return

    test_content = """
    高效学习的三个核心原则：
    1. 专注：在无干扰的环境下集中注意力。
    2. 费曼技巧：用简单的语言向他人解释一个概念，以检验自己的理解程度。
    3. 间隔重复：在逐渐拉长的时间间隔内复习信息，以加强长期记忆。
    """
    
    print(f"测试内容：\n{test_content}")
    print("\n调用 ai_processor.generate_mindmap_structure...")
    
    try:
        result = await ai_processor.generate_mindmap_structure(test_content)
        
        print("\n--- 测试结果 ---")
        if result and result.get('success'):
            print("✅ 测试成功！")
            print("AI返回的Markdown内容：")
            print(result['data']['markdown'])
        else:
            print("❌ 测试失败。")
            print(f"错误信息：{result.get('error', '未知错误')}")
            
    except Exception as e:
        print("❌ 测试过程中发生异常。")
        print(f"异常类型: {type(e).__name__}")
        print(f"异常信息: {e}")

if __name__ == "__main__":
    asyncio.run(main())

import { NextRequest, NextResponse } from 'next/server';
import pdf from 'pdf-parse';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) return NextResponse.json({ error: "未找到文件" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // 使用 pdf-parse 提取文本，它不需要 DOMMatrix
    const data = await pdf(buffer);
    const text = data.text;

    // 调用 DeepSeek API
    const response = await fetch(`${process.env.DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: `请分析以下内容并给出读者反馈：${text}` }]
      })
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("解析或分析失败:", error);
    return NextResponse.json({ error: "服务器内部错误，请检查日志" }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "AI分析機能は設定されていません" },
        { status: 503 }
      )
    }

    const body = await req.json()
    const { reportData } = body

    if (!reportData) {
      return NextResponse.json(
        { error: "レポートデータが必要です" },
        { status: 400 }
      )
    }

    const prompt = `
あなたは街頭対話活動の分析専門家です。以下の月次データを分析し、日本語で実用的なインサイトと改善提案を提供してください。

【分析データ】
${JSON.stringify(reportData, null, 2)}

以下の項目について、具体的で実践的な分析結果を提供してください：

1. **パフォーマンス総評**
   - 当月の活動全体の評価
   - 定量的な成果と定性的な評価

2. **好調パターンの特定**
   - 成果率が高かった場所・曜日・時間帯
   - 天候との相関分析
   - 効果的だったアプローチの特徴

3. **改善提案**
   - 場所戦略：注力すべき場所、見直すべき場所
   - 時間配分：効率の高い時間帯へのシフト提案
   - アプローチ改善：対話の質を高めるヒント

4. **翌月の目標設定**
   - データに基づいた現実的な目標値
   - 重点的に取り組むべき課題

分析は具体的で実行可能な内容にし、データの裏付けを明示してください。
`

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    })

    const analysis = message.content[0].type === "text" ? message.content[0].text : ""

    return NextResponse.json({
      analysis,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("AI analysis error:", error)
    return NextResponse.json(
      { error: "AI分析の実行に失敗しました" },
      { status: 500 }
    )
  }
}

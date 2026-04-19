import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import {
  callAI,
  checkIsPaid,
  currentYearMonth,
  FREE_AI_LIMIT,
  AI_MODELS,
  type AiModelKey,
} from "@/lib/ai"

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // プラン・利用状況を並行取得
    const [billing, user] = await Promise.all([
      prisma.billing.findUnique({
        where: { userId: session.user.id },
        select: { plan: true, status: true, currentPeriodEnd: true },
      }),
      (prisma.user.findUnique as any)({
        where: { id: session.user.id },
        select: { preferredAiModel: true },
      }),
    ])

    const isPaid = checkIsPaid(billing)
    const yearMonth = currentYearMonth()

    // AI利用回数チェック（無料プランのみ）
    const usageLog = await (prisma as any).aiUsageLog.findUnique({
      where: { userId_yearMonth: { userId: session.user.id, yearMonth } },
    })
    const usedBefore: number = usageLog?.count ?? 0

    if (!isPaid && usedBefore >= FREE_AI_LIMIT) {
      return NextResponse.json(
        {
          error: `今月のAI分析回数（${FREE_AI_LIMIT}回）の上限に達しました。スタンダードプランにアップグレードすると無制限でご利用いただけます。`,
          limitReached: true,
        },
        { status: 429 }
      )
    }

    // モデル決定（無料プランは haiku 固定）
    let modelKey: AiModelKey = "claude-haiku"
    if (isPaid) {
      const preferred = user?.preferredAiModel as string | undefined
      if (preferred && AI_MODELS[preferred as AiModelKey]) {
        modelKey = preferred as AiModelKey
      }
    }

    const body = await req.json()
    const { reportData } = body
    if (!reportData) {
      return NextResponse.json({ error: "レポートデータが必要です" }, { status: 400 })
    }

    const prompt = `
あなたは街頭対話活動の分析専門家です。以下の月次データを分析し、日本語で実用的なインサイトと改善提案を提供してください。

【分析データ】
${JSON.stringify(reportData, null, 2)}

以下の項目について、具体的で実践的な分析結果を提供してください：

1. **パフォーマンス総評**
   - 当月の活動全体の評価
   - 定量的な成果と定性的な評価
   - 各成果指標に月次目標（monthlyTarget）が設定されている場合は、実績（total）と目標値を比較し、達成率と評価を示してください
   - 定性目標（qualitativeTarget）が設定されている場合は、活動データに照らして達成状況を評価してください

2. **好調パターンの特定**
   - 成果率が高かった場所・曜日・時間帯
   - 天候との相関分析
   - 効果的だったアプローチの特徴

3. **改善提案**
   - 場所戦略：注力すべき場所、見直すべき場所
   - 時間配分：効率の高い時間帯へのシフト提案
   - アプローチ改善：対話の質を高めるヒント
   - 目標未達の指標がある場合は、具体的な改善策を提案してください

4. **翌月の目標設定**
   - 年間累計目標（annualTarget）が設定されている場合は、現時点の累計ペースと年間目標の差分を計算し、翌月に必要なペースを示してください
   - データに基づいた現実的な目標値
   - 重点的に取り組むべき課題

分析は具体的で実行可能な内容にし、データの裏付けを明示してください。
`

    const analysis = await callAI(modelKey, prompt)

    // 利用回数をインクリメント
    await (prisma as any).aiUsageLog.upsert({
      where: { userId_yearMonth: { userId: session.user.id, yearMonth } },
      create: { userId: session.user.id, yearMonth, count: 1 },
      update: { count: { increment: 1 } },
    })

    const usedAfter = usedBefore + 1

    return NextResponse.json({
      analysis,
      generatedAt: new Date().toISOString(),
      modelKey,
      modelLabel: AI_MODELS[modelKey].label,
      usage: {
        used: usedAfter,
        limit: isPaid ? null : FREE_AI_LIMIT,
        remaining: isPaid ? null : Math.max(0, FREE_AI_LIMIT - usedAfter),
      },
    })
  } catch (error) {
    console.error("AI analysis error:", error)
    return NextResponse.json({ error: "AI分析の実行に失敗しました" }, { status: 500 })
  }
}

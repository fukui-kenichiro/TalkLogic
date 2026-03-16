import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const goalSchema = z.object({
  goalName: z.string().min(1),
  outcomeName: z.string().min(1),
  colorCode: z.string().default("#3b82f6"),
})

const bodySchema = z.object({
  goals: z.array(goalSchema),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { goals } = bodySchema.parse(body)

    // 選択した成果指標を一括作成
    if (goals.length > 0) {
      await prisma.goal.createMany({
        data: goals.map((g, i) => ({
          userId: session.user.id,
          goalName: g.goalName,
          outcomeName: g.outcomeName,
          colorCode: g.colorCode,
          isPrimary: i === 0,
          displayOrder: i,
        })),
      })
    }

    // オンボーディング完了フラグを更新
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.user.update as any)({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力データが不正です" },
        { status: 400 }
      )
    }
    console.error("Onboarding complete error:", error)
    return NextResponse.json(
      { error: "処理中にエラーが発生しました" },
      { status: 500 }
    )
  }
}

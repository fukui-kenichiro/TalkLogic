import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const goalSchema = z.object({
  goalName: z.string().min(1).max(100),
  outcomeName: z.string().min(1).max(100),
  isPrimary: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  monthlyTarget: z.number().int().positive().nullable().optional(),
  annualTarget: z.number().int().positive().nullable().optional(),
  qualitativeTarget: z.string().max(500).nullable().optional(),
})

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

// PUT /api/goals/:id
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const existing = await prisma.goal.findUnique({
      where: { id: id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "成果指標が見つかりません" },
        { status: 404 }
      )
    }

    const body = await req.json()
    const validated = goalSchema.parse(body)

    const goal = await prisma.goal.update({
      where: { id: id },
      data: {
        goalName: validated.goalName,
        outcomeName: validated.outcomeName,
        isPrimary: validated.isPrimary,
        displayOrder: validated.displayOrder,
        colorCode: validated.colorCode,
        monthlyTarget: validated.monthlyTarget ?? null,
        annualTarget: validated.annualTarget ?? null,
        qualitativeTarget: validated.qualitativeTarget ?? null,
      },
    })

    return NextResponse.json(goal)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力データが不正です", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Goal PUT error:", error)

    return NextResponse.json(
      { error: "成果指標の更新に失敗しました" },
      { status: 500 }
    )
  }
}

// DELETE /api/goals/:id
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const existing = await prisma.goal.findUnique({
      where: { id: id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: "成果指標が見つかりません" },
        { status: 404 }
      )
    }

    await prisma.goal.delete({
      where: { id: id },
    })

    return NextResponse.json({ message: "削除しました" })
  } catch (error) {
    console.error("Goal DELETE error:", error)

    return NextResponse.json(
      { error: "成果指標の削除に失敗しました" },
      { status: 500 }
    )
  }
}

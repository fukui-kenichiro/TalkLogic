import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const goalSchema = z.object({
  goalName: z.string().min(1).max(100),
  outcomeName: z.string().min(1).max(100),
  activityCountLabel: z.string().min(1).max(20).optional(),
  isPrimary: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
  colorCode: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  monthlyTarget: z.number().int().positive().nullable().optional(),
  annualTarget: z.number().int().positive().nullable().optional(),
})

// GET /api/goals
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const goals = await prisma.goal.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        displayOrder: "asc",
      },
    })

    return NextResponse.json(goals)
  } catch (error) {
    console.error("Goals GET error:", error)
    return NextResponse.json(
      { error: "成果指標の取得に失敗しました" },
      { status: 500 }
    )
  }
}

// POST /api/goals
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const body = await req.json()
    const validated = goalSchema.parse(body)

    // Get max display order
    const maxOrder = await prisma.goal.aggregate({
      where: { userId: session.user.id },
      _max: { displayOrder: true },
    })

    const goal = await prisma.goal.create({
      data: {
        userId: session.user.id,
        goalName: validated.goalName,
        outcomeName: validated.outcomeName,
        activityCountLabel: validated.activityCountLabel || "対話人数",
        isPrimary: validated.isPrimary || false,
        displayOrder: validated.displayOrder ?? (maxOrder._max.displayOrder ?? 0) + 1,
        colorCode: validated.colorCode || "#3b82f6",
        monthlyTarget: validated.monthlyTarget ?? null,
        annualTarget: validated.annualTarget ?? null,
      },
    })

    return NextResponse.json(goal, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力データが不正です", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Goal POST error:", error)
    return NextResponse.json(
      { error: "成果指標の作成に失敗しました" },
      { status: 500 }
    )
  }
}

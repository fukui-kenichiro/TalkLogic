import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { FREE_ACTIVITY_LIMIT, checkIsPaid, currentMonthRange } from "@/lib/ai"

const activitySchema = z.object({
  activityDate: z.string().datetime(),
  locationName: z.string().min(1).max(200),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  durationMinutes: z.number().int().optional(),
  weather: z.string().optional(),
  staffCount: z.number().int().optional(),
  dialogueCount: z.number().int(),
  memo: z.string().optional(),
  results: z.array(z.object({
    goalId: z.string(),
    resultCount: z.number().int(),
  })).optional(),
})

// GET /api/activities - List activities with filters
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const where: Prisma.ActivityWhereInput = {
      userId: session.user.id,
    }

    if (startDate || endDate) {
      where.activityDate = {}
      if (startDate) where.activityDate.gte = new Date(startDate)
      if (endDate) where.activityDate.lte = new Date(endDate)
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          activityResults: {
            include: {
              goal: true,
            },
          },
        },
        orderBy: {
          activityDate: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ])

    return NextResponse.json({
      activities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Activities GET error:", error)
    return NextResponse.json(
      { error: "活動記録の取得に失敗しました" },
      { status: 500 }
    )
  }
}

// POST /api/activities - Create new activity
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    // 無料プランの月間登録数チェック
    const billing = await prisma.billing.findUnique({
      where: { userId: session.user.id },
      select: { plan: true, status: true, currentPeriodEnd: true },
    })
    if (!checkIsPaid(billing)) {
      const { start, end } = currentMonthRange()
      const monthlyCount = await prisma.activity.count({
        where: { userId: session.user.id, activityDate: { gte: start, lte: end } },
      })
      if (monthlyCount >= FREE_ACTIVITY_LIMIT) {
        return NextResponse.json(
          {
            error: `今月の活動登録数（${FREE_ACTIVITY_LIMIT}件）の上限に達しました。スタンダードプランにアップグレードすると無制限でご利用いただけます。`,
            limitReached: true,
          },
          { status: 429 }
        )
      }
    }

    const body = await req.json()
    const validated = activitySchema.parse(body)

    const activity = await prisma.activity.create({
      data: {
        userId: session.user.id,
        activityDate: new Date(validated.activityDate),
        locationName: validated.locationName,
        latitude: validated.latitude,
        longitude: validated.longitude,
        durationMinutes: validated.durationMinutes,
        weather: validated.weather,
        staffCount: validated.staffCount,
        dialogueCount: validated.dialogueCount,
        memo: validated.memo,
        activityResults: validated.results
          ? {
              create: validated.results.map((result) => ({
                goalId: result.goalId,
                resultCount: result.resultCount,
              })),
            }
          : undefined,
      },
      include: {
        activityResults: {
          include: {
            goal: true,
          },
        },
      },
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力データが不正です", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Activity POST error:", error)
    return NextResponse.json(
      { error: "活動記録の作成に失敗しました" },
      { status: 500 }
    )
  }
}

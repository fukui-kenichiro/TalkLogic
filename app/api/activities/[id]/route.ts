import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { z } from "zod"

const activitySchema = z.object({
  activityDate: z.string().datetime(),
  locationName: z.string().min(1).max(200),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  durationMinutes: z.number().int().optional(),
  weather: z.string().optional(),
  staffCount: z.number().int().optional(),
  dialogueCount: z.number().int().optional(),
  memo: z.string().optional(),
  results: z.array(
    z.object({
      goalId: z.string(),
      activityCount: z.number().int().optional(),
      resultCount: z.number().int(),
    })
  ).optional(),
})

type RouteParams = {
  params: Promise<{ id: string }>
}

// GET /api/activities/:id
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const activity = await prisma.activity.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      include: {
        activityResults: {
          include: {
            goal: true,
          },
        },
      },
    })

    if (!activity) {
      return NextResponse.json({ error: "活動記録が見つかりません" }, { status: 404 })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error("Activity GET error:", error)
    return NextResponse.json({ error: "活動記録の取得に失敗しました" }, { status: 500 })
  }
}

// PUT /api/activities/:id
export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const existing = await prisma.activity.findUnique({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "活動記録が見つかりません" }, { status: 404 })
    }

    const body = await req.json()
    const validated = activitySchema.parse(body)

    await prisma.activityResult.deleteMany({
      where: { activityId: id },
    })

    const activity = await prisma.activity.update({
      where: { id },
      data: {
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
                activityCount: result.activityCount ?? 0,
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

    return NextResponse.json(activity)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "入力データが不正です", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Activity PUT error:", error)
    return NextResponse.json({ error: "活動記録の更新に失敗しました" }, { status: 500 })
  }
}

// DELETE /api/activities/:id
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const existing = await prisma.activity.findUnique({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: "活動記録が見つかりません" }, { status: 404 })
    }

    await prisma.activity.delete({
      where: { id },
    })

    return NextResponse.json({ message: "削除しました" })
  } catch (error) {
    console.error("Activity DELETE error:", error)
    return NextResponse.json({ error: "活動記録の削除に失敗しました" }, { status: 500 })
  }
}

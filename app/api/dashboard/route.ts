import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const now = new Date()
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    // This month activities
    const thisMonthActivities = await prisma.activity.findMany({
      where: {
        userId: session.user.id,
        activityDate: {
          gte: thisMonthStart,
          lte: thisMonthEnd,
        },
      },
      include: {
        activityResults: {
          include: {
            goal: true,
          },
        },
      },
    })

    // Last month activities
    const lastMonthActivities = await prisma.activity.findMany({
      where: {
        userId: session.user.id,
        activityDate: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      include: {
        activityResults: true,
      },
    })

    // Calculate stats
    const thisMonthStats = {
      activityCount: thisMonthActivities.length,
      totalDuration: thisMonthActivities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0),
    }

    const lastMonthStats = {
      activityCount: lastMonthActivities.length,
      totalDuration: lastMonthActivities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0),
    }

    // Get user's goals
    const goals = await prisma.goal.findMany({
      where: { userId: session.user.id },
      orderBy: { displayOrder: "asc" },
    })

    // Calculate goal achievements
    const goalAchievements = goals.map((goal) => {
      const thisMonthResults = thisMonthActivities.flatMap((a) =>
        a.activityResults.filter((r) => r.goalId === goal.id)
      )
      const lastMonthResults = lastMonthActivities.flatMap((a) =>
        a.activityResults.filter((r) => r.goalId === goal.id)
      )

      const thisMonthTotal = thisMonthResults.reduce((sum, r) => sum + r.resultCount, 0)
      const lastMonthTotal = lastMonthResults.reduce((sum, r) => sum + r.resultCount, 0)
      const thisMonthActivityTotal = thisMonthResults.reduce((sum, r) => sum + r.activityCount, 0)

      return {
        goal,
        thisMonth: thisMonthTotal,
        lastMonth: lastMonthTotal,
        thisMonthActivityCount: thisMonthActivityTotal,
        change: lastMonthTotal > 0 ? ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100 : 0,
      }
    })

    // Recent activities
    const recentActivities = await prisma.activity.findMany({
      where: {
        userId: session.user.id,
      },
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
      take: 5,
    })

    return NextResponse.json({
      thisMonthStats,
      lastMonthStats,
      changes: {
        activityCount:
          lastMonthStats.activityCount > 0
            ? ((thisMonthStats.activityCount - lastMonthStats.activityCount) /
                lastMonthStats.activityCount) *
              100
            : 0,
      },
      goalAchievements,
      recentActivities,
    })
  } catch (error) {
    console.error("Dashboard GET error:", error)
    return NextResponse.json(
      { error: "ダッシュボードデータの取得に失敗しました" },
      { status: 500 }
    )
  }
}

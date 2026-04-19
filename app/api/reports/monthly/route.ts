import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from "date-fns"

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())
    const month = parseInt(searchParams.get("month") || (new Date().getMonth() + 1).toString())

    const targetDate = new Date(year, month - 1, 1)
    const monthStart = startOfMonth(targetDate)
    const monthEnd = endOfMonth(targetDate)

    // Get all activities for the month
    const activities = await prisma.activity.findMany({
      where: {
        userId: session.user.id,
        activityDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      include: {
        activityResults: {
          include: {
            goal: true,
          },
        },
      },
      orderBy: {
        activityDate: "asc",
      },
    })

    // Get user's goals
    const goals = await prisma.goal.findMany({
      where: { userId: session.user.id },
      orderBy: { displayOrder: "asc" },
    })

    // Daily aggregation for time series charts
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
    const dailyData = days.map((day) => {
      const dayActivities = activities.filter((a) => {
        const activityDate = new Date(a.activityDate)
        return activityDate.toDateString() === day.toDateString()
      })

      const goalData = goals.map((goal) => {
        const results = dayActivities.flatMap((a) =>
          a.activityResults.filter((r) => r.goalId === goal.id)
        )
        return {
          goalId: goal.id,
          goalName: goal.outcomeName,
          activityCountLabel: goal.activityCountLabel,
          activityCount: results.reduce((sum, r) => sum + r.activityCount, 0),
          count: results.reduce((sum, r) => sum + r.resultCount, 0),
        }
      })

      return {
        date: format(day, "yyyy-MM-dd"),
        activityCount: dayActivities.length,
        goals: goalData,
      }
    })

    // Location aggregation
    const locationData = activities.reduce((acc: { locationName: string; latitude: number | null; longitude: number | null; count: number }[], activity) => {
      const existing = acc.find((l) => l.locationName === activity.locationName)
      if (existing) {
        existing.count++
      } else {
        acc.push({
          locationName: activity.locationName,
          latitude: activity.latitude,
          longitude: activity.longitude,
          count: 1,
        })
      }
      return acc
    }, [])

    // Weather analysis
    const weatherData = activities.reduce((acc: { weather: string; count: number }[], activity) => {
      if (!activity.weather) return acc
      const existing = acc.find((w) => w.weather === activity.weather)
      if (existing) {
        existing.count++
      } else {
        acc.push({ weather: activity.weather, count: 1 })
      }
      return acc
    }, [])

    // Day of week analysis
    const dayOfWeekData = activities.reduce((acc: { dayOfWeek: string; count: number }[], activity) => {
      const dayOfWeek = new Date(activity.activityDate).getDay()
      const dayNames = ["日", "月", "火", "水", "木", "金", "土"]
      const dayName = dayNames[dayOfWeek]

      const existing = acc.find((d) => d.dayOfWeek === dayName)
      if (existing) {
        existing.count++
      } else {
        acc.push({ dayOfWeek: dayName, count: 1 })
      }
      return acc
    }, [])

    // Summary stats
    const summary = {
      totalActivities: activities.length,
      totalDuration: activities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0),
      goalAchievements: goals.map((goal) => {
        const results = activities.flatMap((a) =>
          a.activityResults.filter((r) => r.goalId === goal.id)
        )
        return {
          goal: goal.outcomeName,
          activityCountLabel: goal.activityCountLabel,
          totalActivityCount: results.reduce((sum, r) => sum + r.activityCount, 0),
          total: results.reduce((sum, r) => sum + r.resultCount, 0),
          colorCode: goal.colorCode,
          monthlyTarget: goal.monthlyTarget,
          annualTarget: goal.annualTarget,
          qualitativeTarget: goal.qualitativeTarget,
        }
      }),
    }

    return NextResponse.json({
      year,
      month,
      summary,
      dailyData,
      locationData,
      weatherData,
      dayOfWeekData,
      activities,
    })
  } catch (error) {
    console.error("Monthly report GET error:", error)
    return NextResponse.json(
      { error: "月次レポートの取得に失敗しました" },
      { status: 500 }
    )
  }
}

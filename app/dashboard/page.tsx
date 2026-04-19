"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, TrendingDown, Activity, Clock, CalendarDays, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react"
import Link from "next/link"
import { formatDate, formatTime } from "@/lib/utils"

type DashboardData = {
  thisMonthStats: {
    activityCount: number
    totalDuration: number
  }
  lastMonthStats: {
    activityCount: number
    totalDuration: number
  }
  changes: {
    activityCount: number
  }
  goalAchievements: Array<{
    goal: any
    thisMonth: number
    lastMonth: number
    thisMonthActivityCount: number
    change: number
  }>
  recentActivities: Array<any>
  upcomingPlans: Array<any>
}

// ---- Calendar helpers ----

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function toYMD(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"]
const MONTH_LABELS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"]

type CalendarProps = {
  activities: Array<any>
  plans: Array<any>
}

function ActivityCalendar({ activities, plans }: CalendarProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth)
  const todayYMD = toYMD(today)

  // Build lookup: ymd -> { actCount, planCount }
  const dayMap: Record<string, { actCount: number; planCount: number }> = {}
  for (const a of activities) {
    const ymd = toYMD(a.activityDate)
    if (!dayMap[ymd]) dayMap[ymd] = { actCount: 0, planCount: 0 }
    dayMap[ymd].actCount++
  }
  for (const p of plans) {
    const ymd = toYMD(p.activityDate)
    if (!dayMap[ymd]) dayMap[ymd] = { actCount: 0, planCount: 0 }
    dayMap[ymd].planCount++
  }

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="select-none">
      {/* header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-muted">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-semibold text-sm">
          {viewYear}年 {MONTH_LABELS[viewMonth]}
        </span>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-muted">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* day-of-week row */}
      <div className="grid grid-cols-7 mb-1">
        {DOW_LABELS.map((d, i) => (
          <div
            key={d}
            className={`text-center text-xs font-medium py-1 ${
              i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      {/* day cells */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />
          const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          const info = dayMap[ymd]
          const isToday = ymd === todayYMD
          const dow = (firstDow + day - 1) % 7

          return (
            <div
              key={ymd}
              className={`relative flex flex-col items-center py-1 rounded-md ${
                isToday ? "bg-primary/10 ring-1 ring-primary" : ""
              }`}
            >
              <span
                className={`text-xs font-medium ${
                  dow === 0 ? "text-red-500" : dow === 6 ? "text-blue-500" : ""
                } ${isToday ? "text-primary font-bold" : ""}`}
              >
                {day}
              </span>
              <div className="flex gap-0.5 mt-0.5 h-2 items-center">
                {info?.actCount > 0 && (
                  <span className="block w-1.5 h-1.5 rounded-full bg-primary" title={`活動 ${info.actCount}件`} />
                )}
                {info?.planCount > 0 && (
                  <span className="block w-1.5 h-1.5 rounded-full bg-amber-400" title={`予定 ${info.planCount}件`} />
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* legend */}
      <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="block w-2 h-2 rounded-full bg-primary" />活動
        </span>
        <span className="flex items-center gap-1">
          <span className="block w-2 h-2 rounded-full bg-amber-400" />予定
        </span>
      </div>
    </div>
  )
}

// ---- Dashboard Page ----

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">データの読み込みに失敗しました</p>
      </div>
    )
  }

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
  }: {
    title: string
    value: number | string
    change?: number
    icon: any
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center text-xs text-muted-foreground mt-1">
            {change >= 0 ? (
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
            )}
            <span className={change >= 0 ? "text-green-500" : "text-red-500"}>
              {Math.abs(change).toFixed(1)}%
            </span>
            <span className="ml-1">前月比</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  // Gather all past activities for calendar (use recentActivities + upcomingPlans)
  // For a richer calendar we need all activities; recentActivities is limited to 5.
  // We'll use what we have — the dots will reflect those records.
  const allForCalendar = data.recentActivities

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <p className="text-muted-foreground mt-1">今月の活動状況</p>
        </div></div>
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
          <Link href="/activities/new?mode=plan">
            <Button size="lg" variant="outline" className="gap-2">
              <CalendarDays className="h-5 w-5" />
              予定を登録
            </Button>
          </Link>
          <Link href="/activities/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              新規記録
            </Button>
          </Link>
        </div>
        </div>
      </div>

      {/* Stats + Calendar row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stats column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <StatCard
              title="活動回数"
              value={`${data.thisMonthStats.activityCount}回`}
              change={data.changes.activityCount}
              icon={Activity}
            />
            <StatCard
              title="活動時間"
              value={formatTime(data.thisMonthStats.totalDuration)}
              icon={Clock}
            />
          </div>

          {/* Goal Achievements */}
          {data.goalAchievements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>成果指標の達成状況</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.goalAchievements.map((achievement) => (
                    <div key={achievement.goal.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: achievement.goal.colorCode }}
                        />
                        <div>
                          <p className="font-medium">{achievement.goal.outcomeName}</p>
                          <p className="text-sm text-muted-foreground">
                            {achievement.goal.goalName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {achievement.goal.activityCountLabel}: {achievement.thisMonthActivityCount}
                        </p>
                        <p className="text-2xl font-bold">
                          {achievement.thisMonth}
                          <span className="text-sm font-normal text-muted-foreground ml-1">
                            {achievement.goal.outcomeName}
                          </span>
                        </p>
                        {achievement.change !== 0 && (
                          <p
                            className={`text-sm flex items-center justify-end gap-1 ${
                              achievement.change >= 0 ? "text-green-500" : "text-red-500"
                            }`}
                          >
                            {achievement.change >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {Math.abs(achievement.change).toFixed(1)}%
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Calendar column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                カレンダー
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityCalendar
                activities={allForCalendar}
                plans={data.upcomingPlans}
              />
            </CardContent>
          </Card>

          {/* Upcoming plans */}
          {data.upcomingPlans.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  今後の予定
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.upcomingPlans.map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/activities/${plan.id}`}
                    className="flex items-start gap-2 p-2 rounded-md hover:bg-muted transition-colors"
                  >
                    <span className="mt-0.5 block w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{plan.locationName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(plan.activityDate)}
                      </p>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>最近の活動記録</CardTitle>
          <Link href="/activities">
            <Button variant="outline" size="sm">
              すべて見る
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {data.recentActivities.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              まだ活動記録がありません
            </p>
          ) : (
            <div className="space-y-4">
              {data.recentActivities.map((activity) => (
                <Link
                  key={activity.id}
                  href={`/activities/${activity.id}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">{activity.locationName}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(activity.activityDate)} • 対話{activity.dialogueCount}人
                        {activity.durationMinutes && ` • ${formatTime(activity.durationMinutes)}`}
                      </p>
                      {activity.activityResults.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {activity.activityResults.map((result: any) => (
                            <span
                              key={result.id}
                              className="text-xs bg-gray-100 px-2 py-1 rounded"
                            >
                              {result.goal.outcomeName}: {result.resultCount}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

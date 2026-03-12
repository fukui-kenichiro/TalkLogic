"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, TrendingUp, TrendingDown, Activity, MessageCircle, Clock } from "lucide-react"
import Link from "next/link"
import { formatDate, formatTime } from "@/lib/utils"

type DashboardData = {
  thisMonthStats: {
    activityCount: number
    totalDialogues: number
    totalDuration: number
  }
  lastMonthStats: {
    activityCount: number
    totalDialogues: number
    totalDuration: number
  }
  changes: {
    activityCount: number
    totalDialogues: number
  }
  goalAchievements: Array<{
    goal: any
    thisMonth: number
    lastMonth: number
    change: number
  }>
  recentActivities: Array<any>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/dashboard")
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">ダッシュボード</h1>
          <p className="text-muted-foreground mt-1">今月の活動状況</p>
        </div>
        <Link href="/activities/new">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            新規記録
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="活動回数"
          value={`${data.thisMonthStats.activityCount}回`}
          change={data.changes.activityCount}
          icon={Activity}
        />
        <StatCard
          title="対話人数"
          value={`${data.thisMonthStats.totalDialogues}人`}
          change={data.changes.totalDialogues}
          icon={MessageCircle}
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
                    <p className="text-2xl font-bold">{achievement.thisMonth}</p>
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

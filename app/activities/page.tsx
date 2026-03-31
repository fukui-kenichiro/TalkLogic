"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, MapPin, Calendar, Clock } from "lucide-react"
import Link from "next/link"
import { formatDate, formatTime } from "@/lib/utils"

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [])

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/activities?limit=50")
      if (res.ok) {
        const json = await res.json()
        setActivities(json.activities)
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">活動記録</h1>
          <p className="text-muted-foreground mt-1">過去の活動を確認・編集できます</p>
        </div>
        <Link href="/activities/new">
          <Button size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            新規記録
          </Button>
        </Link>
      </div>

      {/* Activities List */}
      {activities.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">まだ活動記録がありません</p>
            <p className="text-muted-foreground mb-6">
              最初の活動を記録して、データを蓄積しましょう
            </p>
            <Link href="/activities/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新規記録を作成
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activities.map((activity) => (
            <Link key={activity.id} href={`/activities/${activity.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{activity.locationName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(activity.activityDate)}
                  </div>

                  {activity.durationMinutes && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {formatTime(activity.durationMinutes)}
                    </div>
                  )}

                  {activity.weather && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">天候:</span>{" "}
                      <span>{activity.weather}</span>
                    </div>
                  )}

                  {activity.activityResults.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {activity.activityResults.map((result: any) => (
                        <span
                          key={result.id}
                          className="text-xs px-2 py-1 rounded"
                          style={{
                            backgroundColor: result.goal.colorCode + "20",
                            color: result.goal.colorCode,
                          }}
                        >
                          {result.goal.outcomeName}: {result.resultCount}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

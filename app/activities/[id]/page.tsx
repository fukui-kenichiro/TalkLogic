"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  Cloud,
  Users,
  MessageCircle,
  MapPin,
  FileText,
  Pencil,
  Trash2,
  Loader2,
  ArrowLeft,
} from "lucide-react"
import { formatDateTime, formatTime } from "@/lib/utils"
import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps"

const WEATHER_EMOJI: Record<string, string> = {
  晴: "☀️",
  曇: "☁️",
  雨: "🌧️",
  雪: "❄️",
}

type Activity = {
  id: string
  activityDate: string
  locationName: string
  latitude: number | null
  longitude: number | null
  durationMinutes: number | null
  weather: string | null
  staffCount: number | null
  dialogueCount: number
  memo: string | null
  activityResults: Array<{
    id: string
    resultCount: number
    goal: {
      id: string
      outcomeName: string
      goalName: string
      colorCode: string
    }
  }>
}

export default function ActivityDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchActivity()
  }, [id])

  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/activities/${id}`)
      if (!res.ok) {
        router.push("/activities")
        return
      }
      const data = await res.json()
      setActivity(data)
    } catch {
      router.push("/activities")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("この活動記録を削除しますか？この操作は元に戻せません。")) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" })
      if (res.ok) {
        router.push("/activities")
        router.refresh()
      }
    } catch {
      alert("削除に失敗しました")
      setDeleting(false)
    }
  }

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

  if (!activity) return null

  const hasLocation =
    activity.latitude !== null && activity.longitude !== null

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/activities">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold line-clamp-2">
              {activity.locationName}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {formatDateTime(activity.activityDate)}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link href={`/activities/${id}/edit`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Pencil className="h-4 w-4" />
              編集
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            削除
          </Button>
        </div>
      </div>

      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">活動情報</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-3">
          <InfoItem
            icon={<Calendar className="h-4 w-4" />}
            label="日時"
            value={formatDateTime(activity.activityDate)}
          />
          {activity.durationMinutes !== null && (
            <InfoItem
              icon={<Clock className="h-4 w-4" />}
              label="活動時間"
              value={formatTime(activity.durationMinutes)}
            />
          )}
          {activity.weather && (
            <InfoItem
              icon={<Cloud className="h-4 w-4" />}
              label="天候"
              value={`${WEATHER_EMOJI[activity.weather] ?? ""} ${activity.weather}`}
            />
          )}
          {activity.staffCount !== null && (
            <InfoItem
              icon={<Users className="h-4 w-4" />}
              label="参加スタッフ"
              value={`${activity.staffCount}人`}
            />
          )}
          <InfoItem
            icon={<MessageCircle className="h-4 w-4" />}
            label="対話人数"
            value={`${activity.dialogueCount}人`}
          />
        </CardContent>
      </Card>

      {/* 成果実績 */}
      {activity.activityResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">成果実績</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {activity.activityResults.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-1 p-3 rounded-lg border"
                style={{ borderColor: r.goal.colorCode + "60" }}
              >
                <span
                  className="text-xs font-medium"
                  style={{ color: r.goal.colorCode }}
                >
                  {r.goal.goalName}
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold">{r.resultCount}</span>
                  <span className="text-sm text-muted-foreground">
                    {r.goal.outcomeName}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 場所・地図 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            場所
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="font-medium">{activity.locationName}</p>
          {hasLocation && (
            <>
              <p className="text-xs text-muted-foreground">
                {activity.latitude!.toFixed(6)}, {activity.longitude!.toFixed(6)}
              </p>
              <div className="rounded-lg overflow-hidden h-56 w-full">
                <APIProvider
                  apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
                >
                  <Map
                    defaultCenter={{
                      lat: activity.latitude!,
                      lng: activity.longitude!,
                    }}
                    defaultZoom={15}
                    gestureHandling="cooperative"
                    disableDefaultUI={false}
                    style={{ width: "100%", height: "100%" }}
                  >
                    <Marker
                      position={{
                        lat: activity.latitude!,
                        lng: activity.longitude!,
                      }}
                    />
                  </Map>
                </APIProvider>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* メモ */}
      {activity.memo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              メモ・所感
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {activity.memo}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="font-medium text-sm">{value}</p>
    </div>
  )
}

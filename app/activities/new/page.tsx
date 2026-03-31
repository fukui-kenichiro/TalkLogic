"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Loader2, Navigation, AlertCircle, Zap } from "lucide-react"
import type { Goal } from "@prisma/client"
import Link from "next/link"

type ActivityUsage = {
  used: number | null
  limit: number | null
  remaining: number | null
  isPaid: boolean
}

type GoalEntry = { activityCount: string; resultCount: string }

export default function NewActivityPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [error, setError] = useState("")
  const [usage, setUsage] = useState<ActivityUsage | null>(null)

  const [formData, setFormData] = useState({
    activityDate: new Date().toISOString().slice(0, 16),
    locationName: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    durationMinutes: "",
    weather: "",
    staffCount: "",
    memo: "",
  })

  const [results, setResults] = useState<Record<string, GoalEntry>>({})

  useEffect(() => {
    fetchGoals()
    fetch("/api/activities/usage")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => null)
  }, [])

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/goals")
      if (res.ok) {
        const data = await res.json()
        setGoals(data)
      }
    } catch (error) {
      console.error("Failed to fetch goals:", error)
    }
  }

  const getCurrentLocation = () => {
    setGettingLocation(true)
    setError("")

    if (!navigator.geolocation) {
      setError("お使いのブラウザは位置情報をサポートしていません")
      setGettingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setGettingLocation(false)
      },
      (error) => {
        setError("位置情報の取得に失敗しました: " + error.message)
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const updateResult = (goalId: string, field: keyof GoalEntry, value: string) => {
    setResults((prev) => {
      const current: GoalEntry = prev[goalId] ?? { activityCount: "", resultCount: "" }
      return { ...prev, [goalId]: { ...current, [field]: value } }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const activityResults = goals
        .filter((goal) => {
          const entry = results[goal.id]
          return entry && (parseInt(entry.activityCount || "0") > 0 || parseInt(entry.resultCount || "0") > 0)
        })
        .map((goal) => ({
          goalId: goal.id,
          activityCount: parseInt(results[goal.id]?.activityCount || "0"),
          resultCount: parseInt(results[goal.id]?.resultCount || "0"),
        }))

      const payload = {
        activityDate: new Date(formData.activityDate).toISOString(),
        locationName: formData.locationName,
        latitude: formData.latitude,
        longitude: formData.longitude,
        durationMinutes: formData.durationMinutes ? parseInt(formData.durationMinutes) : undefined,
        weather: formData.weather || undefined,
        staffCount: formData.staffCount ? parseInt(formData.staffCount) : undefined,
        memo: formData.memo || undefined,
        results: activityResults.length > 0 ? activityResults : undefined,
      }

      const res = await fetch("/api/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "保存に失敗しました")
        setLoading(false)
        return
      }

      router.push("/activities")
      router.refresh()
    } catch (err) {
      setError("保存処理中にエラーが発生しました")
      setLoading(false)
    }
  }

  const isAtLimit = usage && !usage.isPaid && (usage.remaining ?? 1) <= 0
  const isNearLimit = usage && !usage.isPaid && !isAtLimit && (usage.remaining ?? 99) <= 2

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">新規活動記録</h1>
        <p className="text-muted-foreground mt-1">街頭活動の詳細を記録します</p>
      </div>

      {/* 利用状況バナー（無料プランのみ） */}
      {usage && !usage.isPaid && (
        isAtLimit ? (
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">今月の活動登録数（{usage.limit}件）の上限に達しました</p>
              <p className="mt-0.5">
                <Link href="/mypage/billing" className="underline font-medium">
                  スタンダードプランにアップグレード
                </Link>
                すると無制限でご利用いただけます。
              </p>
            </div>
          </div>
        ) : (
          <div className={`flex items-center gap-2 text-sm px-4 py-2.5 rounded-lg ${
            isNearLimit ? "bg-amber-50 border border-amber-200 text-amber-800" : "bg-blue-50 border border-blue-100 text-blue-700"
          }`}>
            <Zap className="h-4 w-4 flex-shrink-0" />
            今月の登録: {usage.used} / {usage.limit} 件（残り {usage.remaining} 件）
          </div>
        )
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>活動情報</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Date and Time */}
            <div className="space-y-2">
              <Label htmlFor="activityDate">実施日時 *</Label>
              <Input
                id="activityDate"
                type="datetime-local"
                required
                value={formData.activityDate}
                onChange={(e) =>
                  setFormData({ ...formData, activityDate: e.target.value })
                }
              />
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="locationName">場所 *</Label>
              <div className="flex gap-2">
                <Input
                  id="locationName"
                  type="text"
                  required
                  placeholder="例: JR吉祥寺駅北口"
                  value={formData.locationName}
                  onChange={(e) =>
                    setFormData({ ...formData, locationName: e.target.value })
                  }
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={getCurrentLocation}
                  disabled={gettingLocation}
                  className="gap-2"
                >
                  {gettingLocation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Navigation className="h-4 w-4" />
                  )}
                  GPS
                </Button>
              </div>
              {formData.latitude && formData.longitude && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  位置情報: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                </p>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">活動時間（分）</Label>
              <Input
                id="durationMinutes"
                type="number"
                min="0"
                placeholder="例: 60"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: e.target.value })
                }
              />
            </div>

            {/* Weather */}
            <div className="space-y-2">
              <Label htmlFor="weather">天候</Label>
              <Select
                value={formData.weather}
                onValueChange={(value) =>
                  setFormData({ ...formData, weather: value })
                }
              >
                <SelectTrigger id="weather">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="晴">晴</SelectItem>
                  <SelectItem value="曇">曇</SelectItem>
                  <SelectItem value="雨">雨</SelectItem>
                  <SelectItem value="雪">雪</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Staff Count */}
            <div className="space-y-2">
              <Label htmlFor="staffCount">参加スタッフ数</Label>
              <Input
                id="staffCount"
                type="number"
                min="0"
                placeholder="例: 3"
                value={formData.staffCount}
                onChange={(e) =>
                  setFormData({ ...formData, staffCount: e.target.value })
                }
              />
            </div>

            {/* Goal Results */}
            {goals.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">活動量・成果実績</h3>
                {goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="space-y-3 p-4 rounded-lg border"
                    style={{ borderColor: goal.colorCode + "60" }}
                  >
                    <p
                      className="text-sm font-medium"
                      style={{ color: goal.colorCode }}
                    >
                      {goal.goalName}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`activity-${goal.id}`} className="text-xs">
                          {goal.activityCountLabel}
                        </Label>
                        <Input
                          id={`activity-${goal.id}`}
                          type="number"
                          min="0"
                          placeholder="0"
                          value={results[goal.id]?.activityCount || ""}
                          onChange={(e) => updateResult(goal.id, "activityCount", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`result-${goal.id}`} className="text-xs">
                          {goal.outcomeName}
                        </Label>
                        <Input
                          id={`result-${goal.id}`}
                          type="number"
                          min="0"
                          placeholder="0"
                          value={results[goal.id]?.resultCount || ""}
                          onChange={(e) => updateResult(goal.id, "resultCount", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Memo */}
            <div className="space-y-2">
              <Label htmlFor="memo">メモ・所感</Label>
              <Textarea
                id="memo"
                rows={4}
                placeholder="対話内容や気づいたことを記録..."
                value={formData.memo}
                onChange={(e) =>
                  setFormData({ ...formData, memo: e.target.value })
                }
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading || !!isAtLimit} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "保存する"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                キャンセル
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

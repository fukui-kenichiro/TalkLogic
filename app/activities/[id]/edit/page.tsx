"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MapPin, Loader2, Navigation, ArrowLeft } from "lucide-react"
import type { Goal } from "@prisma/client"

export default function EditActivityPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [goals, setGoals] = useState<Goal[]>([])
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    activityDate: "",
    locationName: "",
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    durationMinutes: "",
    weather: "",
    staffCount: "",
    dialogueCount: "",
    memo: "",
  })
  const [results, setResults] = useState<Record<string, string>>({})
  const [dialogueLabel, setDialogueLabel] = useState("対話人数")

  useEffect(() => {
    Promise.all([fetchActivity(), fetchGoals()])
    fetch("/api/settings/dialogue-label")
      .then((r) => r.json())
      .then((d) => setDialogueLabel(d.label ?? "対話人数"))
      .catch(() => null)
  }, [id])

  const fetchActivity = async () => {
    try {
      const res = await fetch(`/api/activities/${id}`)
      if (!res.ok) {
        router.push("/activities")
        return
      }
      const data = await res.json()
      const d = new Date(data.activityDate)
      const localIso = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)

      setFormData({
        activityDate: localIso,
        locationName: data.locationName,
        latitude: data.latitude ?? undefined,
        longitude: data.longitude ?? undefined,
        durationMinutes: data.durationMinutes?.toString() ?? "",
        weather: data.weather ?? "",
        staffCount: data.staffCount?.toString() ?? "",
        dialogueCount: data.dialogueCount.toString(),
        memo: data.memo ?? "",
      })

      const resultMap: Record<string, string> = {}
      for (const r of data.activityResults) {
        resultMap[r.goalId] = r.resultCount.toString()
      }
      setResults(resultMap)
    } finally {
      setLoading(false)
    }
  }

  const fetchGoals = async () => {
    try {
      const res = await fetch("/api/goals")
      if (res.ok) {
        const data = await res.json()
        setGoals(data)
      }
    } catch {
      // silent
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
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }))
        setGettingLocation(false)
      },
      (err) => {
        setError("位置情報の取得に失敗しました: " + err.message)
        setGettingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")

    try {
      const activityResults = goals
        .filter((g) => results[g.id] && parseInt(results[g.id]) > 0)
        .map((g) => ({
          goalId: g.id,
          resultCount: parseInt(results[g.id]),
        }))

      const payload = {
        activityDate: new Date(formData.activityDate).toISOString(),
        locationName: formData.locationName,
        latitude: formData.latitude,
        longitude: formData.longitude,
        durationMinutes: formData.durationMinutes
          ? parseInt(formData.durationMinutes)
          : undefined,
        weather: formData.weather || undefined,
        staffCount: formData.staffCount
          ? parseInt(formData.staffCount)
          : undefined,
        dialogueCount: parseInt(formData.dialogueCount),
        memo: formData.memo || undefined,
        results: activityResults.length > 0 ? activityResults : undefined,
      }

      const res = await fetch(`/api/activities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "保存に失敗しました")
        setSaving(false)
        return
      }

      router.push(`/activities/${id}`)
      router.refresh()
    } catch {
      setError("保存処理中にエラーが発生しました")
      setSaving(false)
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

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/activities/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">活動記録を編集</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            内容を変更して保存してください
          </p>
        </div>
      </div>

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
                  位置情報: {formData.latitude.toFixed(6)},{" "}
                  {formData.longitude.toFixed(6)}
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

            {/* Dialogue Count */}
            <div className="space-y-2">
              <Label htmlFor="dialogueCount">{dialogueLabel} *</Label>
              <Input
                id="dialogueCount"
                type="number"
                min="0"
                required
                placeholder="例: 15"
                value={formData.dialogueCount}
                onChange={(e) =>
                  setFormData({ ...formData, dialogueCount: e.target.value })
                }
              />
            </div>

            {/* Goal Results */}
            {goals.length > 0 && (
              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-semibold">成果実績</h3>
                {goals.map((goal) => (
                  <div key={goal.id} className="space-y-2">
                    <Label htmlFor={`goal-${goal.id}`}>
                      {goal.outcomeName}
                      <span className="text-sm text-muted-foreground ml-2">
                        ({goal.goalName})
                      </span>
                    </Label>
                    <Input
                      id={`goal-${goal.id}`}
                      type="number"
                      min="0"
                      placeholder="0"
                      value={results[goal.id] || ""}
                      onChange={(e) =>
                        setResults({ ...results, [goal.id]: e.target.value })
                      }
                    />
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
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    保存中...
                  </>
                ) : (
                  "変更を保存"
                )}
              </Button>
              <Link href={`/activities/${id}`}>
                <Button type="button" variant="outline" disabled={saving}>
                  キャンセル
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

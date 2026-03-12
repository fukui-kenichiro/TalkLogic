"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Loader2, Calendar, TrendingUp } from "lucide-react"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

export default function ReportsPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [reportData, setReportData] = useState<any>(null)
  const [aiAnalysis, setAiAnalysis] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    fetchReport()
  }, [year, month])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/monthly?year=${year}&month=${month}`)
      if (res.ok) {
        const data = await res.json()
        setReportData(data)
      }
    } catch (error) {
      console.error("Failed to fetch report:", error)
    } finally {
      setLoading(false)
    }
  }

  const runAIAnalysis = async () => {
    if (!reportData) return

    setAnalyzing(true)
    try {
      const res = await fetch("/api/reports/monthly/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reportData }),
      })

      if (res.ok) {
        const data = await res.json()
        setAiAnalysis(data.analysis)
      }
    } catch (error) {
      console.error("AI analysis failed:", error)
    } finally {
      setAnalyzing(false)
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)
  const months = Array.from({ length: 12 }, (_, i) => i + 1)

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

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">レポートデータの読み込みに失敗しました</p>
      </div>
    )
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">月次レポート</h1>
          <p className="text-muted-foreground mt-1">活動データの分析と可視化</p>
        </div>

        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <Select
            value={year.toString()}
            onValueChange={(v) => setYear(parseInt(v))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={month.toString()}
            onValueChange={(v) => setMonth(parseInt(v))}
          >
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {m}月
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              活動回数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{reportData.summary.totalActivities}回</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              対話人数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{reportData.summary.totalDialogues}人</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              活動時間
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {Math.floor(reportData.summary.totalDuration / 60)}h{" "}
              {reportData.summary.totalDuration % 60}m
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              平均対話数
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {reportData.summary.averageDialogues.toFixed(1)}人
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>日別推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={reportData.dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={(val) => val.slice(8)} />
                <YAxis />
                <Tooltip
                  labelFormatter={(val) => `${month}/${val.slice(8)}日`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="dialogueCount"
                  stroke="#3b82f6"
                  name="対話人数"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="activityCount"
                  stroke="#10b981"
                  name="活動回数"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Goal Achievements */}
      {reportData.summary.goalAchievements.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>成果指標の達成状況</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.summary.goalAchievements}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="goal" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" name="達成数">
                      {reportData.summary.goalAchievements.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.colorCode} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>成果指標の割合</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.summary.goalAchievements}
                      dataKey="total"
                      nameKey="goal"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {reportData.summary.goalAchievements.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.colorCode} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Day of Week Analysis */}
      {reportData.dayOfWeekData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>曜日別の活動状況</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportData.dayOfWeekData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dayOfWeek" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="活動回数" />
                  <Bar dataKey="dialogueCount" fill="#10b981" name="対話人数" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis */}
      <Card className="border-2 border-primary">
        <CardHeader className="bg-primary/5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI分析レポート
            </CardTitle>
            <Button
              onClick={runAIAnalysis}
              disabled={analyzing}
              variant="default"
              size="sm"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  分析中...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  分析を実行
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {aiAnalysis ? (
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {aiAnalysis}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="mb-2">
                AIによる分析を実行して、データから実用的なインサイトを取得できます
              </p>
              <p className="text-sm">
                ※ Anthropic Claude APIの設定が必要です
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

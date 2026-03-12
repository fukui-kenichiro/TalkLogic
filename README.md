# TalkLogic

![TalkLogic](https://img.shields.io/badge/version-1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)

**TalkLogic（トークロジック）** は、街頭対話活動を記録・分析し、AIで改善提案を行うWebアプリケーションです。政治活動、営業活動、NPO活動など、対面コミュニケーションを主軸とする活動の効率化を支援します。

## 🎯 プロジェクト概要

### 目的
- 街頭での対話活動をデジタル化し、データとして蓄積
- AI分析により、効果的な活動パターンの発見と改善提案
- ユーザー独自の成果指標（KPI）でカスタマイズ可能な記録システム

### ターゲットユーザー
- **政治団体・活動家**: 街頭宣伝、選挙活動、組織拡大活動
- **ビジネス層**: 保険営業、不動産営業、イベント集客
- **NPO・市民団体**: 署名活動、会員獲得、アウトリーチ活動

### 主な特徴
- 📍 **GPS位置情報取得**: 活動場所を自動記録
- 📊 **データ可視化**: Rechartsによる直感的なグラフ表示
- 🤖 **AI分析**: Anthropic Claude APIによる実用的なインサイト
- 🎯 **カスタマイズ可能なKPI**: 業種に合わせた成果指標の設定
- 📱 **レスポンシブデザイン**: スマートフォン最適化

---

## 🚀 技術スタック

### フロントエンド
- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Recharts** (データ可視化)
- **Zustand** (状態管理)
- **Zod** (バリデーション)

### バックエンド
- **Next.js API Routes**
- **Prisma** (ORM)
- **PostgreSQL** (Supabase)
- **NextAuth.js v5** (認証)
- **bcryptjs** (パスワードハッシュ化)

### 外部API
- **Anthropic Claude API** (AI分析)
- **Google Maps API** (位置情報・地図表示) ※オプション

---

## 📦 セットアップ手順

### 1. 必要な環境
- Node.js 18.x以上
- PostgreSQL データベース（Supabaseを推奨）
- npm または yarn

### 2. リポジトリのクローン
```bash
git clone <repository-url>
cd talklogic
```

### 3. 依存パッケージのインストール
```bash
npm install
```

### 4. 環境変数の設定
`.env.example` を `.env` にコピーして、必要な値を設定します。

```bash
cp .env.example .env
```

`.env` の設定項目：

```env
# Database
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<openssl rand -base64 32 で生成>"

# Google Maps API (オプション)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your-google-maps-api-key"

# Anthropic Claude API (AI分析に必要)
ANTHROPIC_API_KEY="your-anthropic-api-key"

# PAY.JP (課金機能 - MVP では不要)
PAYJP_SECRET_KEY="your-payjp-secret-key"
NEXT_PUBLIC_PAYJP_PUBLIC_KEY="your-payjp-public-key"
```

### 5. データベースのセットアップ
```bash
# Prismaマイグレーション実行
npx prisma migrate dev --name init

# Prisma Clientの生成
npx prisma generate
```

### 6. 開発サーバーの起動
```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスしてください。

---

## 📁 プロジェクト構造

```
talklogic/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/              # 認証関連API
│   │   ├── activities/        # 活動記録CRUD
│   │   ├── goals/             # 成果指標管理
│   │   ├── dashboard/         # ダッシュボードデータ
│   │   └── reports/           # レポート・AI分析
│   ├── dashboard/             # ダッシュボードページ
│   ├── activities/            # 活動記録管理ページ
│   ├── goals/                 # 成果指標設定ページ
│   ├── reports/               # 月次レポートページ
│   ├── login/                 # ログインページ
│   ├── register/              # 新規登録ページ
│   ├── layout.tsx             # ルートレイアウト
│   └── globals.css            # グローバルCSS
├── components/
│   ├── ui/                    # shadcn/ui コンポーネント
│   └── dashboard-nav.tsx      # ナビゲーション
├── lib/
│   ├── auth.ts                # NextAuth設定
│   ├── prisma.ts              # Prismaクライアント
│   └── utils.ts               # ユーティリティ関数
├── prisma/
│   └── schema.prisma          # データベーススキーマ
├── types/
│   └── next-auth.d.ts         # 型定義
├── middleware.ts              # 認証ミドルウェア
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🎨 主要機能

### ✅ 実装済み機能（MVP フェーズ1）

#### 1. 認証システム
- ユーザー登録（ユーザー名・メール・パスワード）
- ログイン・ログアウト
- セッション管理（JWT、7日間有効）

#### 2. 活動記録CRUD
- **新規記録作成**: GPS位置情報取得、日時・場所・対話人数・天候・メモ
- **一覧表示**: カード形式で直感的に閲覧
- **詳細表示・編集・削除**: 完全なCRUD操作

#### 3. 成果指標（Goals）管理
- カスタム指標の作成（目的名・成果名・カラーコード）
- 活動記録との紐付け
- 指標ごとの実績集計

#### 4. ダッシュボード
- 今月の活動回数・対話人数・活動時間
- 前月比の増減表示
- 成果指標の達成状況
- 最近の活動記録一覧

#### 5. 月次レポート
- **データ可視化**:
  - 日別推移グラフ（LineChart）
  - 成果指標の達成状況（BarChart）
  - 成果指標の割合（PieChart）
  - 曜日別活動状況（BarChart）
- **統計情報**: 活動回数、対話人数、活動時間、平均対話数

#### 6. AI分析
- Anthropic Claude API統合
- 月次データに基づく以下の分析:
  - パフォーマンス総評
  - 好調パターンの特定
  - 場所・時間帯の改善提案
  - アプローチ改善提案
  - 翌月の目標設定サポート

---

## 🗄️ データベース構造

### 主要テーブル

#### `users` - ユーザー管理
- `id`: ユーザーID
- `username`: ユーザー名（ログインID）
- `email`: メールアドレス
- `password`: ハッシュ化パスワード
- `nickname`: ニックネーム

#### `activities` - 活動記録
- `id`: 活動ID
- `userId`: ユーザーID
- `activityDate`: 実施日時
- `locationName`: 場所名
- `latitude`, `longitude`: GPS座標
- `durationMinutes`: 活動時間（分）
- `weather`: 天候
- `staffCount`: スタッフ数
- `dialogueCount`: 対話人数
- `memo`: メモ・所感

#### `goals` - 成果指標定義
- `id`: 指標ID
- `userId`: ユーザーID
- `goalName`: 目的名
- `outcomeName`: 成果名
- `isPrimary`: 主要指標フラグ
- `displayOrder`: 表示順
- `colorCode`: カラーコード

#### `activity_results` - 活動成果実績
- `id`: 実績ID
- `activityId`: 活動ID
- `goalId`: 指標ID
- `resultCount`: 実績数

#### `billing` - 課金管理
- `userId`: ユーザーID
- `plan`: プラン（free/standard/pro/enterprise）
- `status`: ステータス

---

## 🔌 API エンドポイント

### 認証
- `POST /api/auth/register` - ユーザー登録
- `POST /api/auth/[...nextauth]` - NextAuth（ログイン）

### 活動記録
- `GET /api/activities` - 活動一覧取得
- `POST /api/activities` - 活動作成
- `GET /api/activities/:id` - 活動詳細取得
- `PUT /api/activities/:id` - 活動更新
- `DELETE /api/activities/:id` - 活動削除

### 成果指標
- `GET /api/goals` - 指標一覧取得
- `POST /api/goals` - 指標作成
- `PUT /api/goals/:id` - 指標更新
- `DELETE /api/goals/:id` - 指標削除

### レポート
- `GET /api/dashboard` - ダッシュボードデータ取得
- `GET /api/reports/monthly` - 月次レポート取得
- `POST /api/reports/monthly/analyze` - AI分析実行

---

## 🛠️ 今後の拡張機能（フェーズ2以降）

### フェーズ2: 課金基盤構築
- [ ] PAY.JP統合
- [ ] サブスクリプション管理
- [ ] プラン別機能制限

### フェーズ3: 成長機能
- [ ] チーム・組織機能
- [ ] レポートPDF出力
- [ ] OAuth連携（Google/LINE）
- [ ] 地図ヒートマップ表示

### フェーズ4: スケールアップ
- [ ] エンタープライズ対応（SSO、SLA）
- [ ] 多言語対応（i18n）
- [ ] ネイティブアプリ化（PWA/React Native）

---

## 📊 現在の機能URI一覧

### ページ
- `/` - ランディング（→ログインへリダイレクト）
- `/login` - ログイン
- `/register` - 新規登録
- `/dashboard` - ダッシュボード（要認証）
- `/activities` - 活動記録一覧（要認証）
- `/activities/new` - 新規活動記録（要認証）
- `/activities/:id` - 活動詳細（要認証）
- `/goals` - 成果指標設定（要認証）
- `/reports` - 月次レポート（要認証）

---

## 🔒 セキュリティ

- パスワード: bcryptによるハッシュ化
- セッション: JWT（7日間有効、リフレッシュトークン対応）
- CSRF対策: NextAuth.js組み込み機能
- SQLインジェクション対策: Prismaによるパラメータ化クエリ
- 位置情報: ユーザーの明示的許可のみ取得

---

## 🚀 デプロイメント

### Vercelへのデプロイ（推奨）

1. Vercelアカウント作成
2. GitHubリポジトリと連携
3. 環境変数を設定
4. デプロイ実行

```bash
# Vercel CLIでのデプロイ
npm install -g vercel
vercel
```

### データベース
- **Supabase**（推奨）: マネージドPostgreSQL
- 自動バックアップ、99.9%稼働率

---

## 🤝 貢献

プルリクエストを歓迎します。大きな変更の場合は、まずissueを開いて変更内容を議論してください。

---

## 📝 ライセンス

MIT License

---

## 📞 サポート・連絡先

- **プロジェクト**: TalkLogic v1.0.0 (MVP)
- **開発**: Claude Code + Next.js 15
- **AI分析**: Anthropic Claude API

---

## 🎓 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Anthropic Claude API](https://docs.anthropic.com)

---

**TalkLogic** - 対話の記録と論理的分析で、街頭活動をより効果的に。

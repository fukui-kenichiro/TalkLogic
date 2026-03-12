# セットアップガイド

## 🚀 クイックスタート

### 1. データベースの準備（Supabase推奨）

#### Supabaseでの設定手順
1. [Supabase](https://supabase.com)にアクセスし、アカウント作成
2. 新しいプロジェクトを作成
3. Settings → Database → Connection string からPostgreSQL接続文字列を取得
4. `.env` ファイルに `DATABASE_URL` として設定

```env
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"
```

### 2. NextAuthシークレットの生成

```bash
openssl rand -base64 32
```

生成された文字列を `.env` の `NEXTAUTH_SECRET` に設定してください。

### 3. Anthropic Claude API キーの取得

AI分析機能を利用する場合：

1. [Anthropic](https://www.anthropic.com)にアクセス
2. APIキーを取得
3. `.env` に `ANTHROPIC_API_KEY` として設定

### 4. Google Maps API（オプション）

位置情報の地図表示機能を利用する場合：

1. [Google Cloud Console](https://console.cloud.google.com/)でプロジェクト作成
2. Maps JavaScript API と Geocoding API を有効化
3. APIキーを作成
4. `.env` に `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` として設定

---

## 📦 インストールと初回セットアップ

```bash
# 1. リポジトリのクローン
git clone <repository-url>
cd talklogic

# 2. 依存パッケージのインストール
npm install

# 3. 環境変数の設定
cp .env.example .env
# .envファイルを編集して必要な値を入力

# 4. Prismaマイグレーション実行
npx prisma migrate dev --name init

# 5. Prisma Studioでデータベース確認（オプション）
npx prisma studio

# 6. 開発サーバー起動
npm run dev
```

---

## 🔐 初回ログインまでの流れ

1. ブラウザで `http://localhost:3000` にアクセス
2. 自動的にログインページにリダイレクト
3. 「新規登録」をクリック
4. 必要事項を入力してアカウント作成
5. 登録完了後、ログインページでログイン
6. ダッシュボードにアクセス成功！

---

## 🎯 最初にやるべきこと

### ステップ1: 成果指標の設定
1. 左メニューから「成果指標設定」を選択
2. 「新規追加」をクリック
3. 自分の活動に合った指標を追加
   - 例（政治活動）: 目的名「同盟員獲得」/ 成果名「加入数」
   - 例（営業活動）: 目的名「新規契約」/ 成果名「成約数」

### ステップ2: 最初の活動を記録
1. 「活動記録」→「新規記録」
2. GPS取得ボタンで現在地を自動入力（ブラウザの位置情報許可が必要）
3. 活動情報を入力して保存

### ステップ3: データの蓄積
- 活動を継続的に記録していくことで、データが蓄積されます
- 月次レポートでグラフ表示されるようになります
- AI分析は最低5〜10件の活動記録があると効果的です

---

## 🐛 トラブルシューティング

### データベース接続エラー
```
Error: Can't reach database server
```

**解決方法**:
- `.env` の `DATABASE_URL` が正しいか確認
- Supabaseプロジェクトが起動しているか確認
- ネットワーク接続を確認

### Prismaマイグレーションエラー
```
Error: P3009 - Failed to create database
```

**解決方法**:
```bash
# Prisma Clientを再生成
npx prisma generate

# データベースをリセット（開発環境のみ）
npx prisma migrate reset
```

### NextAuth認証エラー
```
Error: [next-auth][error][SIGNIN_OAUTH_ERROR]
```

**解決方法**:
- `NEXTAUTH_SECRET` が設定されているか確認
- `NEXTAUTH_URL` が正しいか確認（本番環境では実際のURLに変更）

### AI分析が実行できない
```
Error: AI分析機能は設定されていません
```

**解決方法**:
- `.env` に `ANTHROPIC_API_KEY` が設定されているか確認
- Anthropic APIの利用上限を確認
- インターネット接続を確認

---

## 📱 モバイルでの利用

### GPS機能の有効化
1. スマートフォンのブラウザで位置情報を許可
2. HTTPS接続が必要（開発環境ではlocalhostでも動作）
3. 「GPS」ボタンをタップして現在地を取得

### PWA化（将来実装予定）
- ホーム画面に追加してアプリのように利用可能
- オフライン機能対応

---

## 🔧 開発者向け情報

### Prisma Studioの起動
```bash
npx prisma studio
```
`http://localhost:5555` でデータベースをGUIで確認・編集できます。

### データベーススキーマの変更
```bash
# schema.prismaを編集後
npx prisma migrate dev --name your_migration_name
```

### Lintの実行
```bash
npm run lint
```

### ビルドテスト
```bash
npm run build
```

---

## 📊 データのバックアップ

### Supabaseでの自動バックアップ
- 日次自動バックアップが有効
- Settings → Database → Backups で確認

### 手動バックアップ（ローカル）
```bash
# データをJSON形式でエクスポート（Prisma Studio経由）
# または pg_dump を使用
```

---

## 🚀 本番環境デプロイ

### Vercelへのデプロイ
1. GitHubにプッシュ
2. [Vercel](https://vercel.com)でインポート
3. 環境変数を設定:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (実際のURL)
   - `NEXTAUTH_SECRET`
   - `ANTHROPIC_API_KEY`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
4. デプロイ実行

### 環境変数の本番設定
```env
NEXTAUTH_URL="https://your-domain.vercel.app"
```

---

## 📞 サポート

質問や問題がある場合は、以下をご確認ください：
- README.mdの内容
- このセットアップガイド
- Prisma/Next.js公式ドキュメント

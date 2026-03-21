import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "TalkLogic - 街頭対話記録・AI分析システム",
  description: "街頭での対話活動を記録し、AIで分析・改善提案を行うWebアプリケーション",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <br /><br />
              　<Link href="https://talk.logic.zi.cr/terms.html" className="text-primary hover:underline">
                利用規約
              </Link>
              <br /><br />
              <Link href="https://talk.logic.zi.cr/tokusho.html" className="text-primary hover:underline">
                特定商取引法に基づく表示
              </Link>
      </body>
    </html>
  )
}

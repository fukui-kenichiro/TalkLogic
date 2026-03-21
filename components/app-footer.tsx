import Link from "next/link"

export function AppFooter() {
  return (
    <footer className="border-t bg-white py-4 mt-8">
      <div className="container mx-auto px-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>
          Copyright 2026{" "}
          <a
            href="https://talk.logic.zi.cr/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            TalkLogic
          </a>
        </span>
        <Link href="https://talk.logic.zi.cr/terms.html" className="text-primary hover:underline">
          利用規約
        </Link>
        <Link href="https://talk.logic.zi.cr/privacy.html" className="text-primary hover:underline">
          プライバシーポリシー
        </Link>
        <Link href="https://talk.logic.zi.cr/tokusho.html" className="text-primary hover:underline">
          特定商取引法に基づく表示
        </Link>
      </div>
    </footer>
  )
}

import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "サイトについて",
  description: "KomeSomme 侍米師の運営者と、銘柄データ・価格の出所について。",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <LegalShell title="サイトについて">
      <p>
        KomeSomme 侍米師は、個人の開発者である高江Takaeが、米が好きで、AIの手を借りた開発も自分で試したくて作っている趣味のサイトです。
      </p>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">運営者</h2>
        <p>
          高江Takae。X は
          <a
            className="text-[var(--km-gold)] underline-offset-2 hover:underline"
            href="https://x.com/Toy_Takae"
            rel="me noopener noreferrer"
            target="_blank"
          >
            https://x.com/Toy_Takae
          </a>
          です。
        </p>
        <p>
          販売や特定商取引法に関する表記は
          <Link
            className="text-[var(--km-gold)] underline-offset-2 hover:underline"
            href="/tokushoho"
          >
            特定商取引法に基づく表記
          </Link>
          にあります。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">銘柄の扱い</h2>
        <p>
          甘みや粒感の数字と、合う料理の文章は、KomeSomme の編集です。公的な食味検定や等級、科学的な測定値ではありません。案内役の「侍米師」は編集上の呼び名で、お米ソムリエなどの資格とは関係ありません。
        </p>
        <p>
          米そのものの販売や配送はしていません。お店へのリンクは各社の通販やふるさと納税のページへ移ります。リンクの一部はアフィリエイトです。詳しくは
          <Link
            className="text-[var(--km-gold)] underline-offset-2 hover:underline"
            href="/terms"
          >
            利用規約
          </Link>
          を見てください。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">価格と作柄</h2>
        <p>
          新米のころの特集に書く店頭価格や作柄は、農林水産省が公表した資料からの引用です。スーパーの平均価格は
          <a
            className="text-[var(--km-gold)] underline-offset-2 hover:underline"
            href="https://www.maff.go.jp/j/nousan/kokumotu/ksppos.pdf"
            rel="noopener noreferrer"
            target="_blank"
          >
            スーパーでの販売数量・価格の推移
          </a>
          を見ています。公表のあと、特集の文を直します。
        </p>
      </section>
    </LegalShell>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { LegalShell } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "プライバシーポリシー | KomeSomme",
  description: "KomeSomme における個人情報・通信データの取扱いについて。",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="プライバシーポリシー">
      <p>最終更新: 2026年8月28日</p>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
          1. 事業者
        </h2>
        <p>
          本ポリシーは KomeSomme（以下「当サービス」）に適用されます。事業者の詳細は
          <Link
            className="text-[var(--km-gold)] underline-offset-2 hover:underline"
            href="/tokushoho"
          >
            特定商取引法に基づく表記
          </Link>
          をご覧ください。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
          2. 取得する情報
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-[var(--km-ink)]">相談文:</strong>「米ソムリエに相談」に入力された文章。推薦のためサーバーで処理します。
          </li>
          <li>
            <strong className="text-[var(--km-ink)]">技術情報:</strong>
            IP アドレス、User-Agent、アクセス日時など、セキュリティとレート制限に必要な通信メタデータ。
          </li>
          <li>
            <strong className="text-[var(--km-ink)]">利用状況:</strong>
            地図操作・購入リンククリック等のイベント（分析タグ導入後）。個人を特定しない形で集計します。
          </li>
        </ul>
        <p>会員登録・氏名・住所・決済情報は、現時点では取得しません。</p>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
          3. 利用目的
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>銘柄の意味検索・短い案内文の生成</li>
          <li>不正利用の防止（レート制限・障害対応）</li>
          <li>サービス改善と導線の把握（分析導入後）</li>
          <li>法令に基づく対応</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
          4. 外部サービスへの委託
        </h2>
        <p>目的達成のため、次のような外部サービスを利用することがあります。</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>ホスティング（例: Vercel）</li>
          <li>データベース（例: Supabase）</li>
          <li>埋め込み・文章生成 API（例: Google Gemini / OpenAI）</li>
          <li>アクセス解析（導入時に本ページへ追記）</li>
          <li>アフィリエイト計測（各 EC・ASP）</li>
        </ul>
        <p>
          相談文は推薦処理のため上記 API 提供者へ送信される場合があります。各社のプライバシーポリシーもご確認ください。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
          5. Cookie 等
        </h2>
        <p>
          初回ヒント表示のためブラウザの localStorage を使うことがあります。分析タグ導入後は
          Cookie 等を用いる場合があり、その際は本ページを更新します。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
          6. 保管と安全管理
        </h2>
        <p>
          必要最小限の期間で取り扱い、漏洩・滅失・毀損の防止に努めます。相談 API
          にはレート制限等の技術的措置を講じます。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
          7. お問い合わせ
        </h2>
        <p>
          個人情報の取扱いに関するお問い合わせは、特定商取引法に基づく表記に記載の連絡先へご連絡ください（準備中の場合は追記します）。
        </p>
      </section>
    </LegalShell>
  );
}

import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  description: "KomeSomme の特定商取引法に基づく表記。",
};

export default function TokushohoPage() {
  return (
    <LegalShell title="特定商取引法に基づく表記">
      <p>最終更新: 2026年8月30日</p>
      <p>
        当サービス（KomeSomme）は、米の通信販売を自ら行うものではなく、外部
        EC サイト（Amazon、楽天市場、Yahoo!ショッピング等）およびふるさと納税サイト（さとふる等）への案内・アフィリエイトプログラムによる商品紹介を行っております。
      </p>

      <dl className="divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
        {[
          ["運営事業者", "KomeSomme 運営事務局"],
          ["運営責任者", "Takae"],
          [
            "所在地",
            "埼玉県\n※詳細な所在地につきましては、取引時に請求があった場合、遅滞なく開示いたします。",
          ],
          [
            "連絡先（メールアドレス）",
            "contact.somme.app@gmail.com\n※お問い合わせは上記メールアドレスよりお願いいたします。電話番号につきましては、請求があった場合、遅滞なく開示いたします。",
          ],
          [
            "販売価格",
            "当サイトでは商品の直接販売を行っておりません。遷移先の各 EC・ふるさと納税サイトの表示に従います。",
          ],
          [
            "商品代金以外の必要料金",
            "当サイトの閲覧・利用にかかる通信料等は利用者のご負担となります。購入時の送料や各種手数料等は、遷移先サイトの定めに従います。",
          ],
          [
            "支払方法・引渡し時期・返品・交換",
            "各 EC・ふるさと納税サイトおよび販売企業の定めに従います。",
          ],
          [
            "表現・商品に関する注意",
            "当サイトで表示される味わい評価・診断結果は独自基準による目安であり、公的な品質や等級等を保証するものではありません。",
          ],
        ].map(([term, detail]) => (
          <div key={term} className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
            <dt className="text-[12px] font-medium text-[var(--km-ink)]">{term}</dt>
            <dd className="min-w-0 whitespace-pre-line break-words">{detail}</dd>
          </div>
        ))}
      </dl>
    </LegalShell>
  );
}

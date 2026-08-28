import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記",
  description: "KomeSomme の特定商取引法に基づく表記。",
};

/**
 * Fill operator fields before public monetized launch.
 * Until then the page states that details are being prepared.
 */
export default function TokushohoPage() {
  return (
    <LegalShell title="特定商取引法に基づく表記">
      <p>最終更新: 2026年8月28日</p>
      <p>
        当サービスは米の通信販売を自ら行うものではなく、外部 EC・ふるさと納税サイトへの案内およびアフィリエイト広告を含みます。以下は公開準備中の項目です。収益化公開前に確定値へ置き換えてください。
      </p>

      <dl className="divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
        {[
          ["販売事業者名", "（準備中）"],
          ["代表責任者", "（準備中）"],
          ["所在地", "（準備中）"],
          ["電話番号", "（準備中・メールでの受付を予定）"],
          ["メールアドレス", "（準備中）"],
          ["販売価格", "当サイトでは商品を販売しません。価格は遷移先各社の表示に従います。"],
          ["商品代金以外の必要料金", "通信費等は利用者負担。購入条件は遷移先に従います。"],
          ["支払方法", "各 EC・ふるさと納税サイトの定めに従います。"],
          ["引渡し時期", "各サイトの定めに従います。"],
          ["返品・交換", "各サイトの定めに従います。"],
          ["表現・商品に関する注意", "味わい評価は独自基準の目安です。公的等級を示すものではありません。"],
        ].map(([term, detail]) => (
          <div key={term} className="grid gap-1 py-3 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-4">
            <dt className="text-[12px] font-medium text-[var(--km-ink)]">{term}</dt>
            <dd className="min-w-0 break-words">{detail}</dd>
          </div>
        ))}
      </dl>
    </LegalShell>
  );
}

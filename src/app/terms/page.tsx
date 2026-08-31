import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalPage";
import {
  AFFILIATE_PR_NOTICE_DETAIL,
  AMAZON_ASSOCIATE_DISCLOSURE,
} from "@/lib/affiliate";

export const metadata: Metadata = {
  title: "利用規約",
  description: "KomeSomme の利用条件について。",
};

export default function TermsPage() {
  return (
    <LegalShell title="利用規約">
      <p>最終更新: 2026年8月31日</p>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
          1. 適用
        </h2>
        <p>
          本規約は、KomeSomme（以下「当サービス」）の利用条件を定めるものです。当サービスを利用した時点で、本規約に同意したものとみなします。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
          2. サービスの内容
        </h2>
        <p>
          当サービスは、ブランド米の味わいマップ・意味検索・銘柄解説、および外部 EC・ふるさと納税サイトへの検索導線を提供します。米そのものの販売・配送は行いません。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
          3. 味わい評価について
        </h2>
        <p>
          表示する甘み・粒感等の数値および文章は、KomeSomme
          独自の編集評価であり、公的な食味検定・等級・科学測定値ではありません。購入・調理の判断は利用者ご自身の責任で行ってください。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
          4. 外部リンク・アフィリエイト
        </h2>
        <p>
          お店へのリンクは各事業者が運営するサイトへ遷移します。商品・価格・在庫・返礼品の内容・契約は各サイトの条件に従います。
          {AFFILIATE_PR_NOTICE_DETAIL}
          {AMAZON_ASSOCIATE_DISCLOSURE}
          Amazon
          の顧客対応・注文条件は amazon.co.jp に従い、当サイトは Amazon
          の後援・提携を示すものではありません。楽天ウェブサービス（商品検索 API）を利用する場合があり、クレジット表示は楽天の指定方法に従います。当サービスは KomeSomme
          が制作・運営するものであり、楽天グループの運営するサイトではありません。バリューコマースの成果計測は同社のトラッキングに従い、広告主サイトの注文条件は各広告主に帰属します。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
          5. 禁止事項
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>API やインフラへの過度な負荷、自動化による大量アクセス</li>
          <li>逆コンパイルや不正アクセスの試み</li>
          <li>法令または公序良俗に反する利用</li>
          <li>当サービスの運営を妨害する行為</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
          6. 免責
        </h2>
        <p>
          当サービスは現状有姿で提供されます。推薦結果の正確性・適合性、外部サイトの表示内容、一時的な中断・遅延について、法令で認められる範囲で責任を負いません。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-serif text-lg font-semibold text-[var(--km-ink)]">
          7. 規約の変更
        </h2>
        <p>
          必要に応じて本規約を変更できます。変更後に利用を継続した場合、変更に同意したものとみなします。
        </p>
      </section>
    </LegalShell>
  );
}

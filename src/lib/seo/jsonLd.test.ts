import { describe, expect, it } from "vitest";
import {
  absoluteUrl,
  articleLd,
  breadcrumbListLd,
  faqPageLd,
  itemListLd,
} from "@/lib/seo/jsonLd";

const ORIGIN = "https://komesomme.jp";

describe("absoluteUrl", () => {
  it("joins a site-relative path onto the origin", () => {
    expect(absoluteUrl("/library/koshihikari", ORIGIN)).toBe(
      "https://komesomme.jp/library/koshihikari"
    );
  });

  it("keeps the bare origin for the root path", () => {
    expect(absoluteUrl("/", ORIGIN)).toBe(ORIGIN);
  });

  it("tolerates a trailing slash on the origin", () => {
    expect(absoluteUrl("/library", "https://komesomme.jp/")).toBe(
      "https://komesomme.jp/library"
    );
  });

  it("passes through an already absolute URL", () => {
    expect(absoluteUrl("https://example.com/x", ORIGIN)).toBe("https://example.com/x");
  });
});

describe("breadcrumbListLd", () => {
  it("numbers the trail from 1 and absolutises every item", () => {
    const ld = breadcrumbListLd(
      [
        { name: "トップ", path: "/" },
        { name: "銘柄ライブラリ", path: "/library" },
        { name: "コシヒカリ", path: "/library/koshihikari" },
      ],
      ORIGIN
    );

    expect(ld["@type"]).toBe("BreadcrumbList");
    expect(ld.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "トップ", item: ORIGIN },
      {
        "@type": "ListItem",
        position: 2,
        name: "銘柄ライブラリ",
        item: `${ORIGIN}/library`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "コシヒカリ",
        item: `${ORIGIN}/library/koshihikari`,
      },
    ]);
  });
});

describe("articleLd", () => {
  const base = {
    headline: "コシヒカリ｜銘柄ライブラリ",
    description: "  甘みと粘りのバランス。  ",
    path: "/library/koshihikari",
    imagePath: "/library/koshihikari/opengraph-image",
    datePublished: "2026-09-01T00:00:00.000Z",
    origin: ORIGIN,
  };

  it("points mainEntityOfPage and url at the same absolute URL", () => {
    const ld = articleLd(base);
    expect(ld.url).toBe(`${ORIGIN}/library/koshihikari`);
    expect(ld.mainEntityOfPage).toEqual({
      "@type": "WebPage",
      "@id": `${ORIGIN}/library/koshihikari`,
    });
  });

  it("trims the description and absolutises the image", () => {
    const ld = articleLd(base);
    expect(ld.description).toBe("甘みと粘りのバランス。");
    expect(ld.image).toEqual([`${ORIGIN}/library/koshihikari/opengraph-image`]);
  });

  it("mirrors datePublished into dateModified when only one is known", () => {
    const ld = articleLd(base);
    expect(ld.dateModified).toBe(base.datePublished);
  });

  it("keeps a distinct dateModified", () => {
    const ld = articleLd({ ...base, dateModified: "2026-09-08T00:00:00.000Z" });
    expect(ld.dateModified).toBe("2026-09-08T00:00:00.000Z");
  });

  it("omits the date fields when no date is known", () => {
    const ld = articleLd({ ...base, datePublished: undefined });
    expect(ld).not.toHaveProperty("datePublished");
    expect(ld).not.toHaveProperty("dateModified");
  });

  it("names a person as author and keeps the publisher organization", () => {
    const ld = articleLd(base);
    expect(ld.author).toEqual({
      "@type": "Person",
      name: "高江Takae",
      url: `${ORIGIN}/about`,
      sameAs: ["https://x.com/Toy_Takae"],
    });
    expect(ld.publisher).toEqual({
      "@type": "Organization",
      name: "KomeSomme",
      url: ORIGIN,
      logo: {
        "@type": "ImageObject",
        url: `${ORIGIN}/icon`,
      },
    });
  });

  it("caps the headline at 110 characters", () => {
    const ld = articleLd({ ...base, headline: "あ".repeat(200) });
    expect(String(ld.headline)).toHaveLength(110);
    expect(String(ld.headline).endsWith("…")).toBe(true);
  });
});

describe("itemListLd", () => {
  it("counts and orders the entries", () => {
    const ld = itemListLd({
      name: "銘柄ライブラリ",
      items: [
        { name: "コシヒカリ", path: "/library/koshihikari" },
        { name: "つや姫", path: "/library/tsuyahime" },
      ],
      origin: ORIGIN,
    });

    expect(ld.numberOfItems).toBe(2);
    expect(ld.itemListElement).toEqual([
      {
        "@type": "ListItem",
        position: 1,
        name: "コシヒカリ",
        url: `${ORIGIN}/library/koshihikari`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "つや姫",
        url: `${ORIGIN}/library/tsuyahime`,
      },
    ]);
  });
});

describe("faqPageLd", () => {
  it("maps questions to schema.org FAQPage", () => {
    const ld = faqPageLd(
      [
        { q: " なぜ味で選ぶ？ ", a: " 献立の印象が変わるから。 " },
        { q: "特Aと同じ？", a: "違います。" },
      ],
      ORIGIN
    );
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.mainEntity).toEqual([
      {
        "@type": "Question",
        name: "なぜ味で選ぶ？",
        acceptedAnswer: { "@type": "Answer", text: "献立の印象が変わるから。" },
      },
      {
        "@type": "Question",
        name: "特Aと同じ？",
        acceptedAnswer: { "@type": "Answer", text: "違います。" },
      },
    ]);
  });
});

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function OpsLoginForm() {
  const router = useRouter();
  const [secret, setSecret] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/ops/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret }),
      });
      if (!response.ok) {
        setError(response.status === 429 ? "尝试过多，请稍后再试。" : "密钥不正确。");
        return;
      }
      router.replace("/ops");
      router.refresh();
    } catch {
      setError("无法连接。");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto w-full max-w-md space-y-6">
      <div>
        <p className="text-[11px] tracking-[0.22em] text-[#d49a2a]">KOMESOMME</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight text-[#fff5e5]">
          观测台
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#cbb9a4]">站点行为看板。输入密钥进入。</p>
      </div>

      <label className="block">
        <span className="text-[11px] tracking-[0.16em] text-[#9a8774]">密钥</span>
        <input
          type="password"
          autoComplete="current-password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-[#5a4636] bg-[#1a1410] px-3 text-sm text-[#fff5e5] outline-none focus:border-[#d49a2a]"
          required
          minLength={16}
          maxLength={256}
        />
      </label>

      {error ? <p className="text-sm text-[#e56b3f]">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="h-12 w-full rounded-full bg-[#e56b3f] text-sm font-semibold text-[#fffdf7] transition hover:bg-[#c85a28] disabled:opacity-60"
      >
        {pending ? "验证中…" : "进入观测台"}
      </button>
    </form>
  );
}

import { describe, expect, it } from "vitest";
import {
  createOpsSessionToken,
  isOpsPath,
  isSafeOpsNextPath,
  secretsMatch,
  verifyOpsSessionToken,
} from "@/lib/ops/auth";

describe("ops auth", () => {
  const secret = "unit-test-ops-secret-32chars!!";

  it("accepts a freshly signed token", async () => {
    const token = await createOpsSessionToken(secret, 1_700_000_000_000);
    expect(await verifyOpsSessionToken(secret, token, 1_700_000_000_000)).toBe(true);
  });

  it("rejects expired tokens", async () => {
    const token = await createOpsSessionToken(secret, 1_700_000_000_000);
    expect(
      await verifyOpsSessionToken(secret, token, 1_700_000_000_000 + 13 * 60 * 60 * 1000)
    ).toBe(false);
  });

  it("rejects tampered signatures", async () => {
    const token = await createOpsSessionToken(secret);
    const [payload] = token.split(".");
    expect(await verifyOpsSessionToken(secret, `${payload}.deadbeefdeadbeefdeadbeefde`)).toBe(
      false
    );
  });

  it("compares secrets independently of string length", async () => {
    expect(await secretsMatch(secret, secret)).toBe(true);
    expect(await secretsMatch("wrong-secret-value!!!!!", secret)).toBe(false);
    expect(await secretsMatch("short", secret)).toBe(false);
  });

  it("only allows the dashboard root as next", () => {
    expect(isSafeOpsNextPath("/ops")).toBe(true);
    expect(isSafeOpsNextPath("/ops/login")).toBe(false);
    expect(isSafeOpsNextPath("/ops/../secret")).toBe(false);
    expect(isSafeOpsNextPath("//evil.example")).toBe(false);
    expect(isSafeOpsNextPath("/library")).toBe(false);
    expect(isOpsPath("/ops")).toBe(true);
    expect(isOpsPath("/ops/login")).toBe(true);
    expect(isOpsPath("/library")).toBe(false);
  });
});

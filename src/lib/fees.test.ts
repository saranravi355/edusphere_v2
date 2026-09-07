import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { methodLabel, receiptNo, settlingPayment } from "./fees";

/**
 * The first tests in this codebase, on the module whose bug was caught by
 * looking at a screenshot.
 *
 * `receiptNo` originally sliced the FRONT of the payment id. Every seeded
 * payment id begins `pay_`, so two different payments rendered as "RCP-PAY_64"
 * and "RCP-PAY_35" — and a cuid one as "RCP-CMTBTZ". The references were barely
 * distinguishing and looked broken. Nothing failed, nothing threw, the build was
 * green; it was visible only on the rendered page. The first case below is that
 * bug, written down so it cannot come back quietly.
 *
 * Run with `npm test`. No test framework was added: Node has run tests since 18
 * and tsx is already here for the Prisma seed.
 */

/** The real shapes in the database: seeded `pay_*` ids and newer cuids. */
const SEEDED_ID = "pay_64b798d0c5f8918f1e";
const CUID_ID = "cmtbtz9tt02lvm2kcfs1lumxk";

describe("receiptNo", () => {
  it("reads the end of the id, not the constant prefix", () => {
    // The bug: two payments sharing the `pay_` prefix must not collide.
    const a = receiptNo("pay_64b798d0c5f8918f1e");
    const b = receiptNo("pay_35924733828851fed4");
    assert.notEqual(a, b);
    assert.equal(a, "RCP-F8918F1E");
    assert.equal(b, "RCP-8851FED4");
  });

  it("matches what the fees page renders", () => {
    assert.equal(receiptNo(SEEDED_ID), "RCP-F8918F1E");
  });

  it("handles a cuid as well as a seeded id", () => {
    assert.equal(receiptNo(CUID_ID), "RCP-FS1LUMXK");
  });

  it("strips punctuation rather than passing it through", () => {
    assert.ok(!receiptNo(SEEDED_ID).slice(4).includes("_"));
    assert.equal(receiptNo("ab-cd_ef.gh"), "RCP-ABCDEFGH");
  });

  it("uppercases", () => {
    assert.equal(receiptNo("aaaaaaaaaaaabcdefgh"), "RCP-ABCDEFGH");
  });

  it("is stable — the same payment always prints the same reference", () => {
    assert.equal(receiptNo(SEEDED_ID), receiptNo(SEEDED_ID));
  });

  it("does not pad or throw on an id shorter than the reference", () => {
    assert.equal(receiptNo("ab12"), "RCP-AB12");
    assert.equal(receiptNo(""), "RCP-");
  });

  it("keeps 8 characters, which is what keeps references from colliding", () => {
    // Six was the invoice reference's length and is too few: by the birthday
    // bound a few thousand payments would collide. Locking the width in.
    assert.equal(receiptNo(SEEDED_ID).length, "RCP-".length + 8);
  });
});

describe("methodLabel", () => {
  it("writes the stored codes the way a person says them", () => {
    assert.equal(methodLabel("UPI"), "UPI");
    assert.equal(methodLabel("CARD"), "Card");
    assert.equal(methodLabel("NET_BANKING"), "Net banking");
  });

  it("covers every method present in the database", () => {
    // CARD, NET_BANKING and UPI are the three the school actually uses.
    for (const m of ["CARD", "NET_BANKING", "UPI"]) {
      assert.notEqual(methodLabel(m), m.toLowerCase(), `${m} should have a written label`);
    }
  });

  it("humanises an unknown code rather than hiding it", () => {
    // A method added later must still show something, not an empty cell.
    assert.equal(methodLabel("SOME_NEW_WALLET"), "some new wallet");
    assert.equal(methodLabel(""), "");
  });
});

describe("settlingPayment", () => {
  const at = (iso: string) => new Date(iso);
  const paid = (id: string, iso: string, status = "SUCCESS") => ({ id, status, createdAt: at(iso) });

  it("returns nothing when there are no transactions", () => {
    assert.equal(settlingPayment(undefined), undefined);
    assert.equal(settlingPayment([]), undefined);
  });

  it("returns the one successful payment", () => {
    const p = paid("a", "2026-08-14");
    assert.equal(settlingPayment([p]), p);
  });

  it("ignores anything that did not succeed", () => {
    const failed = paid("a", "2026-08-14", "FAILED");
    const ok = paid("b", "2026-08-10");
    assert.equal(settlingPayment([failed, ok]), ok);
  });

  it("returns nothing when every attempt failed", () => {
    // An invoice can be marked PAID with only failed attempts behind it; the
    // pages show "no record of how" rather than a date from a failed charge.
    assert.equal(settlingPayment([paid("a", "2026-08-14", "FAILED")]), undefined);
  });

  it("takes the most recent success when there is more than one", () => {
    const older = paid("old", "2025-06-09");
    const newer = paid("new", "2026-08-14");
    assert.equal(settlingPayment([older, newer])?.id, "new");
    assert.equal(settlingPayment([newer, older])?.id, "new", "order of the input must not matter");
  });

  it("does not reorder the caller's array", () => {
    // The pages pass the Prisma relation straight in and render it elsewhere;
    // sorting it in place would quietly reshuffle what they show.
    const rows = [paid("a", "2025-06-09"), paid("b", "2026-08-14")];
    settlingPayment(rows);
    assert.deepEqual(rows.map((r) => r.id), ["a", "b"]);
  });
});

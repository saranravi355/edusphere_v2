/**
 * How a payment is shown.
 *
 * PaymentTransaction has held 361 rows — amount, method, status and date, one
 * per paid invoice — and until now no screen in the application read a single
 * one of them. A parent looking at their fees saw the word "PAID" and nothing
 * else: not when they paid, not how, and no reference to quote if they ever had
 * to ask about it. The office saw the same.
 *
 * Nothing here changes the schema. It is the vocabulary both screens need so
 * they describe a payment the same way.
 */

/**
 * A receipt reference, derived from the payment's own id.
 *
 * There is no receiptNo column and this is not the place to add one — a receipt
 * number that means something to an accountant is a sequence with rules about
 * gaps and resets, not a display concern. This is a stable, quotable handle for
 * one payment, in the same shape as the INV- reference the invoice ledger
 * already prints, so a parent on the phone and the person answering are looking
 * at the same string.
 */
export function receiptNo(paymentId: string): string {
  // Taken from the END of the id, and with punctuation stripped. The seeded
  // payments are `pay_64b798d0c5f8918f1e` and the newer ones are cuids, so the
  // first characters are a constant prefix: slicing the front gives "RCP-PAY_64"
  // for one payment and "RCP-CMTBTZ" for the next, which is neither readable
  // nor distinguishing.
  //
  // Eight characters, not the six the invoice reference uses. Six hex digits is
  // 16 million values, and by the birthday bound a few thousand payments — a
  // couple of years for this school — makes a collision more likely than not.
  // Two families quoting the same receipt number down the phone is a bad
  // afternoon. Eight is four billion, and the 361 payments on file are all
  // distinct at both lengths today.
  const clean = paymentId.replace(/[^a-zA-Z0-9]/g, "");
  return `RCP-${clean.slice(-8).toUpperCase()}`;
}

/** The stored method codes, written the way a person would say them. */
const METHOD_LABELS: Record<string, string> = {
  UPI: "UPI",
  CARD: "Card",
  NET_BANKING: "Net banking",
  CASH: "Cash",
  CHEQUE: "Cheque",
  BANK_TRANSFER: "Bank transfer",
};

/** Falls back to the raw code rather than hiding a method nobody mapped yet. */
export function methodLabel(method: string): string {
  return METHOD_LABELS[method] ?? method.replace(/_/g, " ").toLowerCase();
}

/**
 * The payment that settled an invoice.
 *
 * Every paid invoice on file has exactly one successful payment covering it in
 * full, so this takes the latest successful one rather than modelling part
 * payment — which the schema allows but the school does not currently do.
 * Ordering by date makes the choice deterministic if that ever changes.
 */
export function settlingPayment<T extends { status: string; createdAt: Date }>(
  transactions: T[] | undefined,
): T | undefined {
  if (!transactions?.length) return undefined;
  return transactions
    .filter((t) => t.status === "SUCCESS")
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

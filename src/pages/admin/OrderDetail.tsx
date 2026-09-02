import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import { adjustOrder, downloadInvoice, getAdminOrder, priceQuote } from "../../api/admin";
import type { OrderAdjustmentType } from "../../api/admin";
import { ErrorMessage } from "../../components/layout/AsyncState";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Skeleton } from "../../components/ui/skeleton";
import { Textarea } from "../../components/ui/textarea";
import { formatCurrency, PRICING_TBD_LABEL } from "../../lib/utils";
import type { AdminOrder, OrderStatus } from "../../types";

const ADJUSTMENT_TYPES: { value: OrderAdjustmentType; label: string; disabled?: boolean }[] = [
  { value: "discount", label: "Discount" },
  { value: "refund", label: "Refund (full, via Stripe)" },
  { value: "shipping_change", label: "Shipping change" },
  { value: "manual_adjustment", label: "Manual adjustment" },
  { value: "status_change", label: "Status change" },
];

// Deliberately excludes 'pending_quote': an order leaves that state only by
// being priced (the Quote panel below), never by a bare status change — the
// server rejects the transition for the same reason, since the total would
// still be 0.00. 'refunded' is likewise absent, handled by the refund action.
const ORDER_STATUSES: OrderStatus[] = [
  "pending_payment",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<AdminOrder | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [adjType, setAdjType] = useState<OrderAdjustmentType>("discount");
  const [amount, setAmount] = useState("");
  const [newStatus, setNewStatus] = useState<OrderStatus>("processing");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  // order_item id -> typed unit price, for a pending_quote order.
  const [quotePrices, setQuotePrices] = useState<Record<number, string>>({});
  const [pricingQuote, setPricingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  function load() {
    if (!id) return;
    getAdminOrder(id)
      .then(setOrder)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load order"),
      );
  }

  useEffect(load, [id]);

  async function handleAdjust(e: FormEvent) {
    e.preventDefault();
    if (!order) return;
    if (adjType === "refund" && !window.confirm("Refund this order in full via Stripe? This cannot be undone.")) {
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const signedAmount =
        adjType === "discount" ? -Math.abs(Number(amount)) : Number(amount);
      await adjustOrder(order.id, {
        type: adjType,
        amount: adjType !== "status_change" && adjType !== "refund" ? signedAmount : undefined,
        newStatus: adjType === "status_change" ? newStatus : undefined,
        reason: reason || undefined,
      });
      setAmount("");
      setReason("");
      load();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to apply adjustment",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePriceQuote(e: FormEvent) {
    e.preventDefault();
    if (!order) return;
    const unpriced = order.items.filter((item) => item.item_type === "line" && item.unit_price == null);

    // Validated here as well as server-side so the admin sees which field is
    // wrong rather than a single rejected request.
    const prices: Record<number, number> = {};
    for (const item of unpriced) {
      const raw = quotePrices[item.id];
      const value = Number(raw);
      if (!raw?.trim() || !Number.isFinite(value) || value <= 0) {
        setQuoteError(`Enter a price greater than zero for "${item.label}".`);
        return;
      }
      prices[item.id] = value;
    }

    setPricingQuote(true);
    setQuoteError(null);
    try {
      await priceQuote(order.id, prices);
      setQuotePrices({});
      load();
    } catch (err) {
      setQuoteError(err instanceof Error ? err.message : "Failed to price this quote");
    } finally {
      setPricingQuote(false);
    }
  }

  if (error) return <ErrorMessage message={error} />;
  if (!order) return <Skeleton className="h-64 w-full" />;

  async function handleDownloadInvoice() {
    if (!order) return;
    setDownloadingInvoice(true);
    setInvoiceError(null);
    try {
      await downloadInvoice(order.id);
    } catch (err) {
      setInvoiceError(
        err instanceof Error ? err.message : "Failed to download invoice",
      );
    } finally {
      setDownloadingInvoice(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Order #{order.id}</h1>
        <div className="flex items-center gap-3">
          {order.status === "delivered" && (
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
            >
              {downloadingInvoice ? "Downloading..." : "Download Invoice"}
            </Button>
          )}
          <Badge>{order.status.replace("_", " ")}</Badge>
        </div>
      </div>

      {invoiceError && <ErrorMessage message={invoiceError} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">Shipping address</h2>
          <p className="text-sm text-muted-foreground">
            {order.shipping_address.recipient_name}
            <br />
            {order.shipping_address.line1}
            {order.shipping_address.line2
              ? `, ${order.shipping_address.line2}`
              : ""}
            <br />
            {order.shipping_address.city}, {order.shipping_address.region}{" "}
            {order.shipping_address.postal_code}
            <br />
            {order.shipping_address.country}
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <h2 className="mb-2 font-medium">Line items</h2>
          <div className="flex flex-col gap-1 text-sm">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between">
                <span>
                  {item.label}
                  {item.quantity ? ` × ${item.quantity}` : ""}
                </span>
                <span>
                  {item.unit_price == null && item.amount == null
                    ? PRICING_TBD_LABEL
                    : formatCurrency(
                        item.unit_price
                          ? item.unit_price * (item.quantity ?? 1)
                          : (item.amount ?? 0),
                      )}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-1 border-t pt-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Adjustments</span>
              <span>{formatCurrency(order.adjustment_total)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax ({order.tax_rate_percent.toFixed(2)}%)</span>
              <span>{formatCurrency(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {order.status === "pending_quote" && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-4">
          <h2 className="font-medium">Price this quote</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This customer ordered a custom size, so nothing has been charged. Set a price for each
            item below — the order moves to awaiting payment and the customer is notified that their
            quote is ready.
          </p>
          <form onSubmit={handlePriceQuote} className="mt-4 flex max-w-md flex-col gap-4">
            {order.items
              .filter((item) => item.item_type === "line" && item.unit_price == null)
              .map((item) => (
                <div key={item.id} className="space-y-1">
                  <Label>
                    {item.label}
                    {item.quantity && item.quantity > 1 ? ` (unit price × ${item.quantity})` : ""}
                  </Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={quotePrices[item.id] ?? ""}
                    onChange={(e) =>
                      setQuotePrices((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                  />
                </div>
              ))}
            {quoteError && <ErrorMessage message={quoteError} />}
            <Button type="submit" disabled={pricingQuote} className="w-fit">
              {pricingQuote ? "Saving…" : "Send quote to customer"}
            </Button>
          </form>
        </div>
      )}

      <div className="rounded-lg border p-4">
        <h2 className="mb-4 font-medium">Add adjustment</h2>
        <form onSubmit={handleAdjust} className="flex flex-col gap-4 max-w-md">
          <div className="space-y-1">
            <Label>Type</Label>
            <Select
              value={adjType}
              onValueChange={(v) => setAdjType(v as OrderAdjustmentType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADJUSTMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} disabled={t.disabled}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {adjType === "status_change" ? (
            <div className="space-y-1">
              <Label>New status</Label>
              <Select
                value={newStatus}
                onValueChange={(v) => setNewStatus(v as OrderStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : adjType === "refund" ? (
            <p className="text-sm text-muted-foreground">
              Refunds the full order total ({formatCurrency(order.total)}) via Stripe.
            </p>
          ) : (
            <div className="space-y-1">
              <Label>
                {adjType === "discount"
                  ? "Discount amount"
                  : "Amount (negative to reduce total, positive to add)"}
              </Label>
              <Input
                type="number"
                step="0.01"
                min={adjType === "discount" ? "0" : undefined}
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-1">
            <Label>Reason (optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {formError && <ErrorMessage message={formError} />}

          <Button type="submit" disabled={submitting} className="w-fit">
            {submitting ? "Applying..." : "Apply adjustment"}
          </Button>
        </form>
      </div>

      <div className="rounded-lg border p-4">
        <h2 className="mb-2 font-medium">Audit log</h2>
        {order.auditLog.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No changes recorded yet.
          </p>
        )}
        <div className="flex flex-col gap-2">
          {order.auditLog.map((entry) => (
            <div key={entry.id} className="border-b pb-2 text-sm last:border-0">
              <p>
                <strong>{entry.field_changed}</strong>: {entry.old_value ?? "—"}{" "}
                &rarr; {entry.new_value}
              </p>
              {entry.reason && (
                <p className="text-muted-foreground">Reason: {entry.reason}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {new Date(entry.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

"use strict";

// QuickQuote keeps a single quote draft in memory and mirrors it in localStorage.
// The first version stays intentionally small: line items, totals, print, and a saved draft.
const STORAGE_KEY = "quickquote.draft.v1";
const NUMBER_FORMAT = new Intl.NumberFormat(undefined, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const els = {
  form: document.querySelector("#quote-form"),
  status: document.querySelector("#save-status"),
  loadSampleBtn: document.querySelector("#load-sample-btn"),
  saveDraftBtn: document.querySelector("#save-draft-btn"),
  printBtn: document.querySelector("#print-btn"),
  addItemBtn: document.querySelector("#add-item-btn"),
  quoteNumber: document.querySelector("#quote-number"),
  quoteDate: document.querySelector("#quote-date"),
  validityDays: document.querySelector("#validity-days"),
  businessName: document.querySelector("#business-name"),
  clientName: document.querySelector("#client-name"),
  clientEmail: document.querySelector("#client-email"),
  clientPhone: document.querySelector("#client-phone"),
  projectTitle: document.querySelector("#project-title"),
  discountPercent: document.querySelector("#discount-percent"),
  taxPercent: document.querySelector("#tax-percent"),
  depositAmount: document.querySelector("#deposit-amount"),
  quoteNotes: document.querySelector("#quote-notes"),
  lineItems: document.querySelector("#line-items"),
  lineItemTemplate: document.querySelector("#line-item-template"),
  previewTitle: document.querySelector("#preview-title"),
  previewSubtitle: document.querySelector("#preview-subtitle"),
  previewBusiness: document.querySelector("#preview-business"),
  previewClient: document.querySelector("#preview-client"),
  previewClientEmail: document.querySelector("#preview-client-email"),
  previewClientPhone: document.querySelector("#preview-client-phone"),
  previewEmailRow: document.querySelector("#preview-email-row"),
  previewPhoneRow: document.querySelector("#preview-phone-row"),
  previewNotes: document.querySelector("#preview-notes"),
  previewNotesBlock: document.querySelector("#preview-notes-block"),
  previewNumber: document.querySelector("#preview-number"),
  previewDate: document.querySelector("#preview-date"),
  previewValidUntil: document.querySelector("#preview-valid-until"),
  previewItems: document.querySelector("#preview-items"),
  subtotal: document.querySelector("#subtotal"),
  discountValue: document.querySelector("#discount-value"),
  taxValue: document.querySelector("#tax-value"),
  depositValue: document.querySelector("#deposit-value"),
  grandTotal: document.querySelector("#grand-total"),
  balanceDue: document.querySelector("#balance-due"),
};

let state = loadDraft();

function uid() {
  // crypto.randomUUID is ideal, but we keep a fallback so the app runs everywhere.
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayISO() {
  // Use the user's local calendar date instead of UTC to avoid a date shift near midnight.
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatMoney(value) {
  return `MMK ${NUMBER_FORMAT.format(Number(value) || 0)}`;
}

function formatDate(dateISO, daysToAdd = 0) {
  const base = new Date(`${dateISO}T12:00:00`);
  if (Number.isFinite(daysToAdd) && daysToAdd !== 0) {
    base.setDate(base.getDate() + daysToAdd);
  }
  return base.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function blankItem(description = "", qty = 1, price = 0) {
  return {
    id: uid(),
    description,
    qty,
    price,
  };
}

function sampleDraft() {
  const quoteDate = todayISO();
  return {
    quoteNumber: `Q-${new Date().getFullYear()}-001`,
    quoteDate,
    validityDays: 7,
    businessName: "QuickQuote Studio",
    clientName: "Green Market Co.",
    clientEmail: "billing@greenmarket.example",
    clientPhone: "+95 9XX XXX XXX",
    projectTitle: "Website design and setup",
    discountPercent: 5,
    taxPercent: 0,
    depositAmount: 0,
    notes: "Valid for 7 days. 50% deposit before work starts.",
    items: [
      blankItem("Homepage design", 1, 45000),
      blankItem("Responsive layout", 1, 35000),
      blankItem("Contact form setup", 1, 20000),
    ],
  };
}

function normalizeDraft(raw) {
  if (!raw || typeof raw !== "object") return sampleDraft();
  const items = Array.isArray(raw.items)
    ? raw.items
        .map((item) => ({
          id: typeof item?.id === "string" ? item.id : uid(),
          description: typeof item?.description === "string" ? item.description.slice(0, 120) : "",
          qty: Number.isFinite(Number(item?.qty)) && Number(item.qty) > 0 ? Math.max(1, Math.floor(Number(item.qty))) : 1,
          price: Number.isFinite(Number(item?.price)) && Number(item.price) >= 0 ? Number(item.price) : 0,
        }))
        .filter((item) => item.description || item.qty || item.price >= 0)
    : [];

  return {
    quoteNumber: typeof raw.quoteNumber === "string" ? raw.quoteNumber.slice(0, 24) : sampleDraft().quoteNumber,
    quoteDate: typeof raw.quoteDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(raw.quoteDate) ? raw.quoteDate : todayISO(),
    validityDays: Number.isFinite(Number(raw.validityDays)) ? Math.min(365, Math.max(1, Math.floor(Number(raw.validityDays)))) : 7,
    businessName: typeof raw.businessName === "string" ? raw.businessName.slice(0, 80) : "",
    clientName: typeof raw.clientName === "string" ? raw.clientName.slice(0, 80) : "",
    clientEmail: typeof raw.clientEmail === "string" ? raw.clientEmail.slice(0, 120) : "",
    clientPhone: typeof raw.clientPhone === "string" ? raw.clientPhone.slice(0, 40) : "",
    projectTitle: typeof raw.projectTitle === "string" ? raw.projectTitle.slice(0, 120) : "",
    discountPercent: Number.isFinite(Number(raw.discountPercent)) ? Math.min(100, Math.max(0, Number(raw.discountPercent))) : 0,
    taxPercent: Number.isFinite(Number(raw.taxPercent)) ? Math.min(100, Math.max(0, Number(raw.taxPercent))) : 0,
    depositAmount: Number.isFinite(Number(raw.depositAmount)) ? Math.max(0, Number(raw.depositAmount)) : 0,
    notes: typeof raw.notes === "string" ? raw.notes.slice(0, 300) : "",
    items: items.length > 0 ? items : [blankItem()],
  };
}

function loadDraft() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return sampleDraft();
    return normalizeDraft(JSON.parse(saved));
  } catch (error) {
    console.warn("QuickQuote could not read saved data.", error);
    return sampleDraft();
  }
}

function saveDraft(message = "Draft saved locally") {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    setStatus(message, "saving");
  } catch (error) {
    console.warn("QuickQuote could not save the draft.", error);
    setStatus("Could not save draft in this browser", "error");
  }
}

function setStatus(message, type = "saving") {
  els.status.textContent = message;
  els.status.classList.toggle("is-saving", type === "saving");
  els.status.classList.toggle("is-error", type === "error");
}

function syncFormToState() {
  state.quoteNumber = els.quoteNumber.value.trim();
  state.quoteDate = els.quoteDate.value;
  state.validityDays = clampNumber(els.validityDays.value, 1, 365, 7);
  state.businessName = els.businessName.value.trim();
  state.clientName = els.clientName.value.trim();
  state.clientEmail = els.clientEmail.value.trim();
  state.clientPhone = els.clientPhone.value.trim();
  state.projectTitle = els.projectTitle.value.trim();
  state.discountPercent = clampNumber(els.discountPercent.value, 0, 100, 0);
  state.taxPercent = clampNumber(els.taxPercent.value, 0, 100, 0);
  state.depositAmount = Math.max(0, Number(els.depositAmount.value) || 0);
  state.notes = els.quoteNotes.value.trim();
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function renderFormFromState() {
  els.quoteNumber.value = state.quoteNumber;
  els.quoteDate.value = state.quoteDate;
  els.validityDays.value = state.validityDays;
  els.businessName.value = state.businessName;
  els.clientName.value = state.clientName;
  els.clientEmail.value = state.clientEmail;
  els.clientPhone.value = state.clientPhone;
  els.projectTitle.value = state.projectTitle;
  els.discountPercent.value = state.discountPercent;
  els.taxPercent.value = state.taxPercent;
  els.depositAmount.value = state.depositAmount;
  els.quoteNotes.value = state.notes;
}

function renderItems() {
  // Rebuild the editable rows only when the list structure changes.
  els.lineItems.replaceChildren(...state.items.map((item) => renderItemRow(item)));
}

function renderItemRow(item) {
  const fragment = els.lineItemTemplate.content.cloneNode(true);
  const row = fragment.querySelector("tr");
  row.dataset.itemId = item.id;
  row.querySelector(".item-description").value = item.description;
  row.querySelector(".item-qty").value = item.qty;
  row.querySelector(".item-price").value = item.price;
  row.querySelector(".item-total").textContent = formatMoney(item.qty * item.price);
  return fragment;
}

function updateItemFromRow(row) {
  const item = state.items.find((entry) => entry.id === row.dataset.itemId);
  if (!item) return;

  const description = row.querySelector(".item-description").value.trim();
  const qty = Math.max(1, Math.floor(Number(row.querySelector(".item-qty").value) || 1));
  const price = Math.max(0, Number(row.querySelector(".item-price").value) || 0);

  item.description = description;
  item.qty = qty;
  item.price = price;
  row.querySelector(".item-total").textContent = formatMoney(qty * price);
}

function calculateTotals() {
  const subtotal = state.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const discountValue = subtotal * (state.discountPercent / 100);
  const taxableAmount = Math.max(0, subtotal - discountValue);
  const taxValue = taxableAmount * (state.taxPercent / 100);
  const grandTotal = taxableAmount + taxValue;
  const balanceDue = Math.max(0, grandTotal - state.depositAmount);

  return {
    subtotal,
    discountValue,
    taxValue,
    grandTotal,
    balanceDue,
  };
}

function renderPreview() {
  const totals = calculateTotals();
  const clientLabel = state.clientName || state.clientEmail || "—";
  const projectLabel = state.projectTitle || "QuickQuote estimate";

  els.previewTitle.textContent = projectLabel;
  els.previewSubtitle.textContent = `Prepared for ${clientLabel}`;
  els.previewBusiness.textContent = state.businessName || "—";
  els.previewClient.textContent = clientLabel;
  els.previewClientEmail.textContent = state.clientEmail;
  els.previewClientPhone.textContent = state.clientPhone;
  els.previewEmailRow.hidden = !state.clientEmail;
  els.previewPhoneRow.hidden = !state.clientPhone;
  els.previewNotes.textContent = state.notes;
  els.previewNotesBlock.hidden = !state.notes;
  els.previewNumber.textContent = state.quoteNumber || "—";
  els.previewDate.textContent = state.quoteDate ? formatDate(state.quoteDate) : "—";
  els.previewValidUntil.textContent = state.quoteDate ? formatDate(state.quoteDate, state.validityDays) : "—";

  els.previewItems.replaceChildren();
  if (state.items.length === 0) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="2" class="text-secondary">No line items yet</td>`;
    els.previewItems.append(row);
  } else {
    state.items.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(item.description || "Untitled item")}</td>
        <td class="text-end">${formatMoney(item.qty * item.price)}</td>
      `;
      els.previewItems.append(row);
    });
  }

  els.subtotal.textContent = formatMoney(totals.subtotal);
  els.discountValue.textContent = `- ${formatMoney(totals.discountValue)}`;
  els.taxValue.textContent = formatMoney(totals.taxValue);
  els.depositValue.textContent = `- ${formatMoney(state.depositAmount)}`;
  els.grandTotal.textContent = formatMoney(totals.grandTotal);
  if (els.balanceDue) {
    els.balanceDue.textContent = formatMoney(totals.balanceDue);
  }
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function refreshAll(message = "Draft saved locally") {
  syncFormToState();
  saveDraft(message);
  renderPreview();
}

function addItem() {
  state.items.push(blankItem());
  renderItems();
  renderPreview();
  saveDraft("Item added and draft saved");
  const lastDescription = els.lineItems.querySelector("tr:last-child .item-description");
  if (lastDescription) lastDescription.focus();
}

function loadSample() {
  state = sampleDraft();
  renderFormFromState();
  renderItems();
  renderPreview();
  saveDraft("Sample quotation loaded");
}

function printQuote() {
  refreshAll("Draft saved locally");
  window.print();
}

els.form.addEventListener("input", () => refreshAll());
els.form.addEventListener("change", () => refreshAll());

els.lineItems.addEventListener("input", (event) => {
  const row = event.target.closest("tr");
  if (!row) return;
  updateItemFromRow(row);
  renderPreview();
  saveDraft("Draft saved locally");
});

els.lineItems.addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-item-btn");
  if (!removeButton) return;

  const row = removeButton.closest("tr");
  if (!row) return;
  const index = state.items.findIndex((item) => item.id === row.dataset.itemId);
  if (index >= 0) {
    state.items.splice(index, 1);
  }
  if (state.items.length === 0) {
    state.items.push(blankItem());
  }
  renderItems();
  renderPreview();
  saveDraft("Item removed and draft saved");
});

els.addItemBtn.addEventListener("click", addItem);
els.loadSampleBtn.addEventListener("click", loadSample);
els.saveDraftBtn.addEventListener("click", () => {
  syncFormToState();
  saveDraft("Draft saved locally");
});
els.printBtn.addEventListener("click", printQuote);

// Keep the date picker populated when the app opens for the first time.
if (!state.quoteDate) {
  state.quoteDate = todayISO();
}
renderFormFromState();
renderItems();
renderPreview();
setStatus("Draft ready");

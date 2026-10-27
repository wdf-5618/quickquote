# QuickQuote — Small Business Quotation Builder

QuickQuote is a small quotation and estimate builder for freelancers and small service businesses. It is a front-end learning project built with HTML, CSS, Bootstrap 5, and vanilla JavaScript.

**Live demo:** [Open QuickQuote](https://quickquote-wdf-5618s-projects.vercel.app)  
**Source code:** [wdf-5618/quickquote](https://github.com/wdf-5618/quickquote)

## Features

- Create a quote number, issue date, and validity period.
- Add customer name and optional contact details.
- Add, edit, and remove itemized services or products.
- Calculate subtotal, discount, tax, deposit, grand total, and balance due.
- Add notes or payment terms to the customer-facing quote.
- See the quotation preview update as the form changes.
- Save one draft in the current browser and restore it on the next visit.
- Load example data to explore the app quickly.
- Print the quotation or use the browser's print dialog to save it as a PDF.

## Run locally

No build step or package installation is required. From the repository root, run:

```bash
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Project structure

```text
quickquote/
├── index.html   # Form and quotation preview
├── styles.css   # Responsive styling and print layout
├── app.js       # Form state, totals, browser storage, and events
└── README.md
```

## Implementation notes

- Bootstrap is loaded from its public CDN; the app itself has no JavaScript package dependencies.
- Money values are displayed in Myanmar kyat (MMK).
- Quote totals are calculated from item state rather than stored as separate values.
- User-entered item descriptions and notes are rendered as text, not executable HTML.
- Browser storage access is wrapped in error handling so storage failures are reported in the status area.
- The quote date uses the local calendar date to avoid UTC date shifts close to midnight.

## Scope and limitations

This is a learning prototype, not an accounting, tax, invoicing, or billing system. Drafts stay in the current browser profile and do not sync across devices. There are no user accounts, hosted database, payment processing, or multi-user permissions. The app should not be used as a replacement for professional accounting or tax advice.

## Manual test checklist

- [ ] Load the sample quote and confirm line-item and quote totals.
- [ ] Add and remove a line item.
- [ ] Change quantity, unit price, discount, tax, and deposit.
- [ ] Enter customer email, phone, and notes and confirm they appear in the preview.
- [ ] Save a draft, refresh the page, and check that the draft is restored.
- [ ] Print or save to PDF and confirm the form controls are not included and all totals remain visible.
- [ ] Check the layout on a narrow screen.

Manual browser testing still needs to be completed for this version.

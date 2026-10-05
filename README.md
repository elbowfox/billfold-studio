# Billfold Studio

Two products that can charge money without a server. Both run in the browser. You own the Stripe account and the license secret.

## 1. Billfold web app

`web/` is a static invoice, estimate, and change-order studio.

- Business profile, clients, line items, tax, discount, notes
- Print to PDF from the browser
- Archive in localStorage
- Free: 3 saves per month and a watermark
- Pro: paste a license key. The check is local

Deploy: GitHub Pages from `/web`, Netlify, or Cloudflare Pages. No build step.

Before selling, change `LICENSE_SECRET` in `web/app.js`. The matching key is printed in the browser console on load, and also shown if someone enters a bad key (remove that hint in production).

Create a [Stripe Payment Link](https://dashboard.stripe.com/payment-links) for $12/month or $79 once. Paste it into the Upgrade screen. Deliver the key by email, Gumroad, or a Stripe receipt note. A webhook is optional.

## 2. DomainMeter extension

`extension/` is a Manifest V3 Chrome extension. It records one minute per focused, active http(s) tab and prices the day at an hourly rate.

- Free: top 3 sites
- Pro key: `DM-PRO` (change this in `popup.js` before release)
- CSV export for invoicing, including into Billfold

Load unpacked at `chrome://extensions` for testing. Zip `extension/` and upload to the Chrome Web Store. Developer account is a one-time $5 fee.

Icon: add a 128px `icon.png` before store review. The manifest references it.

## What this is not

This is not a guarantee of revenue. Distribution is the work: a Chrome Web Store listing, a landing page, and a payment link. The products themselves do not need you online after that.

Do not use the extension to track other people. It only logs the browser it is installed in.

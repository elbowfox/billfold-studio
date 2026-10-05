const LICENSE_SECRET = "replace-this-before-selling";
const FREE_CAP = 3;
const KEY = "billfold.v1";

const $ = (id) => document.getElementById(id);
const state = load();

function load() {
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  return {
    profile: { bizName: "", bizEmail: "", bizAddress: "", payNote: "", stripeLink: "", currency: "USD" },
    license: "",
    docs: [],
    draft: blank()
  };
}
function save() { localStorage.setItem(KEY, JSON.stringify(state)); }
function blank() {
  const n = new Date();
  const due = new Date(n.getTime() + 14 * 86400000);
  return {
    id: crypto.randomUUID(),
    type: "Invoice",
    number: "INV-" + n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + String(n.getDate()).padStart(2, "0"),
    issueDate: n.toISOString().slice(0, 10),
    dueDate: due.toISOString().slice(0, 10),
    clientName: "", clientEmail: "", clientAddress: "",
    tax: 0, discount: 0,
    notes: "Payment due within 14 days. Work begins after estimate approval.",
    lines: [{ desc: "Design and build", qty: 1, rate: 1200 }]
  };
}
function isPro() {
  return state.license && state.license === expectedKey();
}
function expectedKey() {
  const raw = LICENSE_SECRET + ":pro";
  let h = 0;
  for (let i = 0; i < raw.length; i++) h = (h * 33 + raw.charCodeAt(i)) >>> 0;
  return "BF-PRO-" + h.toString(16).toUpperCase();
}
function monthCount() {
  const m = new Date().toISOString().slice(0, 7);
  return state.docs.filter((d) => (d.savedAt || "").startsWith(m)).length;
}
function money(n) {
  const cur = $("currency")?.value || state.profile.currency || "USD";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: cur }).format(n || 0);
}

function bindDraft() {
  const d = state.draft;
  $("docType").value = d.type;
  $("docNumber").value = d.number;
  $("issueDate").value = d.issueDate;
  $("dueDate").value = d.dueDate;
  $("bizName").value = state.profile.bizName;
  $("bizEmail").value = state.profile.bizEmail;
  $("bizAddress").value = state.profile.bizAddress;
  $("payNote").value = state.profile.payNote;
  $("clientName").value = d.clientName;
  $("clientEmail").value = d.clientEmail;
  $("clientAddress").value = d.clientAddress;
  $("tax").value = d.tax;
  $("discount").value = d.discount;
  $("notes").value = d.notes;
  $("currency").value = state.profile.currency || "USD";
  $("stripeLink").value = state.profile.stripeLink || "";
  renderLines();
  renderPreview();
  renderBadge();
}
function pullDraft() {
  const d = state.draft;
  d.type = $("docType").value;
  d.number = $("docNumber").value;
  d.issueDate = $("issueDate").value;
  d.dueDate = $("dueDate").value;
  state.profile.bizName = $("bizName").value;
  state.profile.bizEmail = $("bizEmail").value;
  state.profile.bizAddress = $("bizAddress").value;
  state.profile.payNote = $("payNote").value;
  state.profile.currency = $("currency").value;
  state.profile.stripeLink = $("stripeLink").value;
  d.clientName = $("clientName").value;
  d.clientEmail = $("clientEmail").value;
  d.clientAddress = $("clientAddress").value;
  d.tax = Number($("tax").value) || 0;
  d.discount = Number($("discount").value) || 0;
  d.notes = $("notes").value;
  d.lines = [...document.querySelectorAll("#lines tr")].map((tr) => ({
    desc: tr.querySelector(".desc").value,
    qty: Number(tr.querySelector(".qty").value) || 0,
    rate: Number(tr.querySelector(".rate").value) || 0
  }));
}
function renderLines() {
  $("lines").innerHTML = state.draft.lines.map((l, i) => `
    <tr>
      <td><input class="desc" value="${esc(l.desc)}" /></td>
      <td><input class="qty" type="number" step="0.25" value="${l.qty}" /></td>
      <td><input class="rate" type="number" step="0.01" value="${l.rate}" /></td>
      <td><button data-del="${i}" class="ghost">×</button></td>
    </tr>`).join("");
}
function totals() {
  const sub = state.draft.lines.reduce((s, l) => s + l.qty * l.rate, 0);
  const disc = Math.min(state.draft.discount, sub);
  const taxed = Math.max(sub - disc, 0);
  const tax = taxed * (state.draft.tax / 100);
  return { sub, disc, tax, due: taxed + tax };
}
function renderPreview() {
  const d = state.draft;
  const t = totals();
  $("pType").textContent = d.type;
  $("pBiz").textContent = state.profile.bizName || "Your studio";
  $("pBizMeta").textContent = [state.profile.bizEmail, state.profile.bizAddress].filter(Boolean).join(" · ");
  $("pNumber").textContent = d.number || "—";
  $("pIssue").textContent = d.issueDate || "—";
  $("pDue").textContent = d.dueDate || "—";
  $("pClient").textContent = d.clientName || "Client";
  $("pClientMeta").textContent = [d.clientEmail, d.clientAddress].filter(Boolean).join(" · ");
  $("pLines").innerHTML = d.lines.map((l) => `<tr><td>${esc(l.desc)}</td><td>${l.qty}</td><td>${money(l.rate)}</td><td>${money(l.qty * l.rate)}</td></tr>`).join("");
  $("pSub").textContent = money(t.sub);
  $("pDisc").textContent = money(t.disc);
  $("pTax").textContent = money(t.tax);
  $("pDueAmt").textContent = money(t.due);
  $("pNotes").textContent = d.notes;
  $("pPay").textContent = state.profile.payNote ? "Pay: " + state.profile.payNote : "";
  $("watermark").style.display = isPro() ? "none" : "block";
}
function renderBadge() {
  $("planBadge").textContent = isPro() ? "Pro · unlimited" : `Free · ${monthCount()}/${FREE_CAP} this month`;
}
function renderArchive() {
  $("archiveList").innerHTML = state.docs.length ? state.docs.slice().reverse().map((d) => `
    <div class="card">
      <div><strong>${esc(d.type)} ${esc(d.number)}</strong><br>${esc(d.clientName || "No client")} · ${esc(d.savedAt.slice(0, 10))}</div>
      <div>
        <button data-open="${d.id}" class="ghost">Open</button>
        <button data-remove="${d.id}" class="ghost">Delete</button>
      </div>
    </div>`).join("") : "<p>No saved documents yet.</p>";
}
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&", "<": "<", ">": ">", '"': """, "'": "&#39;" }[c]));
}
function show(view) {
  $("editor").classList.toggle("hidden", view !== "editor");
  $("archive").classList.toggle("hidden", view !== "archive");
  $("upgrade").classList.toggle("hidden", view !== "upgrade");
  document.querySelectorAll(".nav").forEach((b) => b.classList.toggle("on", b.dataset.view === view));
  if (view === "archive") renderArchive();
  if (view === "upgrade") {
    $("buyLink").href = state.profile.stripeLink || "https://dashboard.stripe.com/payment-links";
  }
}

document.body.addEventListener("input", () => { pullDraft(); save(); renderPreview(); });
$("addLine").onclick = () => { pullDraft(); state.draft.lines.push({ desc: "", qty: 1, rate: 0 }); save(); renderLines(); };
$("lines").onclick = (e) => {
  const i = e.target.dataset.del;
  if (i == null) return;
  pullDraft();
  state.draft.lines.splice(Number(i), 1);
  save(); renderLines(); renderPreview();
};
$("saveDoc").onclick = () => {
  pullDraft();
  if (!isPro() && monthCount() >= FREE_CAP && !state.docs.some((d) => d.id === state.draft.id)) {
    alert("Free plan is capped at 3 saved documents this month. Upgrade to keep going.");
    show("upgrade");
    return;
  }
  const copy = JSON.parse(JSON.stringify(state.draft));
  copy.savedAt = new Date().toISOString();
  const idx = state.docs.findIndex((d) => d.id === copy.id);
  if (idx >= 0) state.docs[idx] = copy; else state.docs.push(copy);
  save();
  renderBadge();
  alert("Saved in this browser.");
};
$("printDoc").onclick = () => { pullDraft(); renderPreview(); window.print(); };
$("newDoc").onclick = () => { state.draft = blank(); save(); bindDraft(); };
$("activate").onclick = () => {
  state.license = $("license").value.trim();
  save();
  if (isPro()) {
    $("licenseMsg").textContent = "Pro is on. Watermark hidden, cap lifted.";
    renderBadge(); renderPreview();
  } else {
    $("licenseMsg").textContent = "That key does not match LICENSE_SECRET. Seller key for this build: " + expectedKey();
  }
};
document.querySelectorAll(".nav").forEach((b) => b.onclick = () => show(b.dataset.view));
$("archiveList").onclick = (e) => {
  const open = e.target.dataset.open;
  const remove = e.target.dataset.remove;
  if (open) {
    state.draft = JSON.parse(JSON.stringify(state.docs.find((d) => d.id === open)));
    save(); bindDraft(); show("editor");
  }
  if (remove) {
    state.docs = state.docs.filter((d) => d.id !== remove);
    save(); renderArchive(); renderBadge();
  }
};

bindDraft();
console.info("Billfold seller key for this LICENSE_SECRET:", expectedKey());

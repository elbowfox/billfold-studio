const FREE = 3;
const day = new Date().toISOString().slice(0, 10);
document.getElementById("today").textContent = day;

async function read() {
  return chrome.storage.local.get({ days: {}, rate: 75, pro: false });
}
async function render() {
  const data = await read();
  document.getElementById("rate").value = data.rate;
  document.getElementById("key").value = data.pro ? "DM-PRO" : "";
  const sites = Object.entries(data.days[day] || {}).sort((a, b) => b[1] - a[1]);
  const shown = data.pro ? sites : sites.slice(0, FREE);
  const hidden = data.pro ? 0 : Math.max(0, sites.length - FREE);
  document.getElementById("rows").innerHTML = shown.map(([host, mins]) => {
    const dollars = (mins / 60) * Number(data.rate || 0);
    return `<tr><td>${host}<br><span class="fine">${mins} min</span></td><td>$${dollars.toFixed(2)}</td></tr>`;
  }).join("") || "<tr><td>No time yet today.</td></tr>";
  const totalMin = sites.reduce((s, x) => s + x[1], 0);
  const total = (totalMin / 60) * Number(data.rate || 0);
  document.getElementById("total").textContent =
    `Today ${totalMin} min · $${total.toFixed(2)}` + (hidden ? ` · ${hidden} sites locked` : "");
}
document.getElementById("rate").addEventListener("change", async (e) => {
  await chrome.storage.local.set({ rate: Number(e.target.value) || 0 });
  render();
});
document.getElementById("key").addEventListener("change", async (e) => {
  await chrome.storage.local.set({ pro: e.target.value.trim() === "DM-PRO" });
  render();
});
document.getElementById("csv").addEventListener("click", async () => {
  const data = await read();
  const lines = ["date,host,minutes,amount"];
  for (const [d, sites] of Object.entries(data.days)) {
    for (const [host, mins] of Object.entries(sites)) {
      lines.push([d, host, mins, ((mins / 60) * data.rate).toFixed(2)].join(","));
    }
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "domainmeter.csv"; a.click();
});
document.getElementById("reset").addEventListener("click", async () => {
  const data = await read();
  delete data.days[day];
  await chrome.storage.local.set({ days: data.days });
  render();
});
render();

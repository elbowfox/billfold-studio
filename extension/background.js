const ALARM = "tick";

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM, { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM) return;
  const idle = await chrome.idle.queryState(60);
  if (idle !== "active") return;
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab || !tab.url || !/^https?:/.test(tab.url)) return;
  let host = "other";
  try { host = new URL(tab.url).hostname.replace(/^www\./, ""); } catch (e) { return; }
  const day = new Date().toISOString().slice(0, 10);
  const data = await chrome.storage.local.get({ days: {}, rate: 75 });
  const days = data.days;
  days[day] = days[day] || {};
  days[day][host] = (days[day][host] || 0) + 1;
  const keys = Object.keys(days).sort();
  for (const k of keys.slice(0, Math.max(0, keys.length - 30))) delete days[k];
  await chrome.storage.local.set({ days });
});

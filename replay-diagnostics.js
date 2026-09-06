// DOM bridge for browser tools whose read-only evaluation cannot see page globals.
// Read with JSON.parse(document.querySelector('#replay-diagnostics').textContent).
(() => {
  const storageKey = 'turnarchist.lastReplayReport.v1';
  const element = document.createElement('script');
  element.id = 'replay-diagnostics';
  element.type = 'application/json';
  document.body.appendChild(element);
  let previous = null;
  try { previous = JSON.parse(sessionStorage.getItem(storageKey) || 'null'); } catch {}
  element.textContent = JSON.stringify({ schemaVersion: 1, report: previous });
  window.publishReplayReport = (report) => {
    window.lastReplayReport = report;
    element.textContent = JSON.stringify({ schemaVersion: 1, report });
    try { sessionStorage.setItem(storageKey, JSON.stringify(report)); } catch {}
  };
  const saveKey = 'turnarchist.saveDiagnostics.v1';
  const saveElement = document.createElement('script');
  saveElement.id = 'save-diagnostics';
  saveElement.type = 'application/json';
  document.body.appendChild(saveElement);
  let saveEvents = [];
  try {
    const stored = JSON.parse(sessionStorage.getItem(saveKey) || '[]');
    if (Array.isArray(stored)) saveEvents = stored.slice(-20);
  } catch {}
  const showSaves = () => { saveElement.textContent = JSON.stringify({schemaVersion: 1, events: saveEvents}); };
  showSaves();
  window.publishSaveDiagnostic = (event) => {
    saveEvents.push(event);
    saveEvents = saveEvents.slice(-20);
    showSaves();
    try { sessionStorage.setItem(saveKey, JSON.stringify(saveEvents)); } catch {}
  };
  if (window.lastReplayReport) window.publishReplayReport(window.lastReplayReport);
})();

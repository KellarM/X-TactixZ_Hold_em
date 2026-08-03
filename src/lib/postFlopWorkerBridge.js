// ============================================================
// POST-FLOP WORKER BRIDGE — Manages the persistent audit worker
// ============================================================

let _worker = null;
let _callId = 0;
const _pendingCalls = new Map();

function getWorker() {
  if (!_worker) {
    _worker = new Worker(
      new URL('../workers/postFlopAuditWorker.js', import.meta.url),
      { type: 'module' }
    );
    _worker.onmessage = (e) => {
      const { type, callId, data, done, total, message } = e.data;
      const pending = callId !== undefined ? _pendingCalls.get(callId) : null;

      if (type === 'PROGRESS' && pending?.onProgress) {
        const pct = total > 0 ? done / total : 0;
        pending.onProgress(pct, done, total);
        return;
      }

      if (type === 'RESULT' && pending) {
        _pendingCalls.delete(callId);
        pending.resolve(data);
        return;
      }

      if (type === 'ERROR' && pending) {
        _pendingCalls.delete(callId);
        pending.reject(new Error(message || 'Worker error'));
        return;
      }
    };
    _worker.onerror = (e) => {
      console.error('[PostFlopAuditWorker] Error:', e);
    };
  }
  return _worker;
}

export function runPostFlopAudit({ flopCards, rounds, trueProbabilities, mode, onProgress }) {
  return new Promise((resolve, reject) => {
    const callId = ++_callId;
    _pendingCalls.set(callId, { resolve, reject, onProgress });
    getWorker().postMessage({ type: 'RUN', callId, flopCards, rounds, trueProbabilities, mode });
  });
}

export function resetWorker() {
  if (_worker) {
    _worker.terminate();
    _worker = null;
    _pendingCalls.clear();
  }
}

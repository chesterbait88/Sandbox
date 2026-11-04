import { findUnsupported, type SupportInput } from './support';

export interface SupportRequest extends SupportInput {
  type: 'support';
  /** Echoed back so the main thread can match the structure and ignore stale answers. */
  seq: number;
}

export interface SupportResponse {
  type: 'support';
  seq: number;
  id: number;
  clusters: Int32Array[];
  ms: number;
  fillMs: number;
}

self.onmessage = (e: MessageEvent<SupportRequest>) => {
  const req = e.data;
  if (req.type !== 'support') return;
  const t0 = performance.now();
  const r = findUnsupported(req);
  const resp: SupportResponse = { type: 'support', seq: req.seq, id: req.id, clusters: r.clusters, ms: performance.now() - t0, fillMs: r.fillMs };
  (self as unknown as Worker).postMessage(
    resp,
    r.clusters.map((c) => c.buffer as ArrayBuffer)
  );
};

import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { SCORING } from '@vw/config';

export interface ScoreRow {
  id: number;
  theme: string;
  seed: string;
  initials: string;
  score: number;
  stats_json: string;
  ip_hash: string;
  created_at: string;
}

export interface Entry {
  rank: number;
  initials: string;
  score: number;
  date: string;
  seed: string;
}

/** SQLite storage: one file under DATA_DIR (or in memory for tests). */
export class Db {
  readonly db: Database.Database;

  constructor(file: string) {
    if (file !== ':memory:') mkdirSync(path.dirname(file), { recursive: true });
    this.db = new Database(file);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        theme TEXT NOT NULL,
        seed TEXT NOT NULL,
        initials TEXT NOT NULL,
        score INTEGER NOT NULL,
        stats_json TEXT NOT NULL,
        ip_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
      );
      CREATE INDEX IF NOT EXISTS scores_theme_score ON scores(theme, score DESC);
      CREATE TABLE IF NOT EXISTS used_tokens (
        nonce TEXT PRIMARY KEY,
        used_at INTEGER NOT NULL
      );
    `);
  }

  insertScore(row: Omit<ScoreRow, 'id' | 'created_at'>): number {
    const r = this.db
      .prepare('INSERT INTO scores (theme, seed, initials, score, stats_json, ip_hash) VALUES (?, ?, ?, ?, ?, ?)')
      .run(row.theme, row.seed, row.initials, row.score, row.stats_json, row.ip_hash);
    return Number(r.lastInsertRowid);
  }

  top(theme: string, limit: number): Entry[] {
    const rows =
      theme === 'all'
        ? this.db.prepare('SELECT initials, score, seed, created_at FROM scores ORDER BY score DESC, created_at ASC LIMIT ?').all(limit)
        : this.db.prepare('SELECT initials, score, seed, created_at FROM scores WHERE theme = ? ORDER BY score DESC, created_at ASC LIMIT ?').all(theme, limit);
    return (rows as { initials: string; score: number; seed: string; created_at: string }[]).map((r, i) => ({ rank: i + 1, initials: r.initials, score: r.score, date: r.created_at.slice(0, 10), seed: r.seed }));
  }

  /**
   * 1-based rank. Before insertion (`prospective`) a score ranks below existing equal scores;
   * after insertion its rank counts only strictly higher scores, so ties share a rank.
   */
  rankFor(theme: string, score: number, prospective = false): number {
    const op = prospective ? '>=' : '>';
    const r =
      theme === 'all'
        ? (this.db.prepare(`SELECT COUNT(*) AS n FROM scores WHERE score ${op} ?`).get(score) as { n: number })
        : (this.db.prepare(`SELECT COUNT(*) AS n FROM scores WHERE theme = ? AND score ${op} ?`).get(theme, score) as { n: number });
    return r.n + 1;
  }

  /** Score of the last leaderboard slot, or null when the board is not full. */
  cutoff(theme: string): number | null {
    const size = SCORING.leaderboardSize;
    const rows =
      theme === 'all'
        ? this.db.prepare('SELECT score FROM scores ORDER BY score DESC LIMIT 1 OFFSET ?').all(size - 1)
        : this.db.prepare('SELECT score FROM scores WHERE theme = ? ORDER BY score DESC LIMIT 1 OFFSET ?').all(theme, size - 1);
    const r = rows[0] as { score: number } | undefined;
    return r ? r.score : null;
  }

  /** Mark a token nonce used; returns false when it was already used. */
  useToken(nonce: string, now: number): boolean {
    try {
      this.db.prepare('INSERT INTO used_tokens (nonce, used_at) VALUES (?, ?)').run(nonce, now);
      return true;
    } catch {
      return false;
    }
  }

  /** Drop used-token rows older than maxAgeMs. */
  pruneTokens(now: number, maxAgeMs: number): void {
    this.db.prepare('DELETE FROM used_tokens WHERE used_at < ?').run(now - maxAgeMs);
  }

  close(): void {
    this.db.close();
  }
}

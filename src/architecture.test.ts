import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards two boundaries:
 *
 * 1. Data honesty — UI code reaches data only through the service layer, never
 *    `fetch` or `Math.random` directly, and there is no mock data layer left
 *    to import.
 * 2. Read-only — nothing anywhere in the app can send a trading or
 *    account-modifying command. See docs/READ_ONLY.md.
 */

const SRC = join(process.cwd(), 'src');
const UI_ROOTS = ['app', 'components', 'hooks', 'lib', 'providers'];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry) && !entry.endsWith('.test.ts') ? [full] : [];
  });
}

const uiFiles = UI_ROOTS.flatMap((root) => sourceFiles(join(SRC, root)));
const allSourceFiles = sourceFiles(SRC).filter((file) => !file.endsWith('.test.ts'));

describe('data architecture boundary', () => {
  it('finds UI files to check', () => {
    expect(uiFiles.length).toBeGreaterThan(20);
  });

  it.each(uiFiles.map((file) => [relative(SRC, file), file]))(
    '%s does not import a data provider directly or call fetch/Math.random',
    (_name, file) => {
      const source = readFileSync(file as string, 'utf8');
      expect(source).not.toMatch(/@\/data\/providers/);
      expect(source).not.toMatch(/Math\.random\(/);
      expect(source).not.toMatch(/\bfetch\(/);
    },
  );
});

describe('read-only guarantee', () => {
  // Names that would only ever appear if someone wired up order execution.
  const FORBIDDEN_IDENTIFIERS = [
    /\bCTrade\b/,
    /\bOrderSend\s*\(/,
    /\bPositionClose\s*\(/,
    /\bPositionModify\s*\(/,
    /\bOrderModify\s*\(/,
    /\bOrderDelete\s*\(/,
    /\.controlAccount\b/,
    /\.controlAllAccounts\b/,
    /\bcloseAllPositions\b/,
    /\bpauseNewTrades\b/,
    /\bresumeNewTrades\b/,
    // A literal trading verb called as a function, e.g. `trade.Buy(...)` —
    // deliberately excludes prose like "BUY basket" or a `direction: 'BUY'` value.
    /\bBuy\s*\(/,
    /\bSell\s*\(/,
  ];

  it.each(allSourceFiles.map((file) => [relative(SRC, file), file]))(
    '%s contains no trading-execution identifiers',
    (_name, file) => {
      const source = readFileSync(file as string, 'utf8');
      for (const pattern of FORBIDDEN_IDENTIFIERS) {
        expect(source).not.toMatch(pattern);
      }
    },
  );

  it('apiClient only implements GET, POST and PATCH — never DELETE', () => {
    const source = readFileSync(join(SRC, 'services', 'apiClient.ts'), 'utf8');
    expect(source).not.toMatch(/'DELETE'/);
    expect(source).not.toMatch(/\bdelete:\s*</);
  });

  it('no route in this app is defined as POST, PUT, PATCH or DELETE for trading', () => {
    // The app ships no local backend at all — every data call goes to the
    // real backend at NEXT_PUBLIC_API_BASE_URL, and this app defines no
    // API routes of its own.
    expect(() => statSync(join(SRC, 'app', 'api'))).toThrow();
  });
});

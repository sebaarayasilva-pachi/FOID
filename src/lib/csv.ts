/**
 * Parse CSV string to array of objects.
 * Normalizes: comma → dot for decimals.
 * For returnPct/interestRate: if value > 1, divide by 100.
 */
export function parseCsv<T extends Record<string, string>>(
  csv: string,
  decimalFields: string[] = [],
  pctFields: string[] = []
): T[] {
  if (!csv?.trim()) return [];

  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim());
  const rows: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      let val = values[idx] ?? '';
      if (decimalFields.includes(h)) {
        val = val.replace(',', '.');
      }
      if (pctFields.includes(h)) {
        const num = parseFloat(val.replace(',', '.'));
        if (!isNaN(num) && Math.abs(num) > 1) {
          val = String(num / 100);
        }
      }
      row[h] = val;
    });
    rows.push(row as T);
  }

  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if ((c === ',' && !inQuotes) || c === '\n') {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

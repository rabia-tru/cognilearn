/* ------------------------------------------------------------------ *
 * PDF TEXT EXTRACTION (no external dependency)
 *
 * Works both in the browser (WebView / Chrome) and in Node (the server),
 * because both expose the global `DecompressionStream`. It walks the PDF
 * objects, inflates FlateDecode content streams and pulls the text out of
 * the `Tj` / `TJ` / `'` / `"` text-showing operators.
 *
 * It is used for the on-device fallback (when the AI backend cannot be
 * reached or is unavailable) so a PDF can still become a study deck.
 * ------------------------------------------------------------------ */

const latin1 = (bytes: Uint8Array): string => {
  let out = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    out += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return out;
};

/** Inflates a zlib (or raw deflate) stream, returning empty bytes on failure. */
const inflate = async (bytes: Uint8Array): Promise<Uint8Array> => {
  const formats: ('deflate' | 'deflate-raw')[] = ['deflate', 'deflate-raw'];

  for (const format of formats) {
    try {
      const stream = new DecompressionStream(format);
      const writer = stream.writable.getWriter();
      // Copy into a standalone ArrayBuffer so the stream accepts the bytes.
      const copy = new Uint8Array(bytes.byteLength);
      copy.set(bytes);
      void writer.write(copy.buffer);
      void writer.close();
      const buffer = await new Response(stream.readable).arrayBuffer();
      return new Uint8Array(buffer);
    } catch {
      /* try the next format */
    }
  }

  return new Uint8Array();
};

interface TextOperand {
  text: string;
}

/** Decodes the escape sequences of a PDF literal string. */
const decodeLiteral = (raw: string): string => {
  let out = '';
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch !== '\\') {
      out += ch;
      continue;
    }
    const next = raw[i + 1];
    if (next === undefined) break;
    if (next === 'n') out += '\n';
    else if (next === 'r') out += '\r';
    else if (next === 't') out += '\t';
    else if (next === 'b') out += '\b';
    else if (next === 'f') out += '\f';
    else if (next === '\n') {
      /* line continuation */
    } else if (next >= '0' && next <= '7') {
      let oct = '';
      let j = i + 1;
      while (j < raw.length && oct.length < 3 && raw[j] >= '0' && raw[j] <= '7') {
        oct += raw[j];
        j++;
      }
      out += String.fromCharCode(parseInt(oct, 8));
      i = j - 1;
    } else out += next;
    i++;
  }
  return out;
};

/** Decodes a hex string (`<48656C6C6F>`) into text. */
const decodeHex = (raw: string): string => {
  const hex = raw.replace(/[^0-9A-Fa-f]/g, '');
  let out = '';
  for (let i = 0; i + 1 < hex.length; i += 2) {
    out += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  if (hex.length % 2 === 1) {
    out += String.fromCharCode(parseInt(hex[hex.length - 1] + '0', 16));
  }
  return out;
};

/**
 * Pulls every text run out of a decoded PDF content stream.
 * Text positioning operators (Td / TD / T* / ET) become line breaks.
 */
const extractTextFromContentStream = (content: string): string => {
  const lines: string[] = [];
  let current = '';
  let operands: TextOperand[] = [];
  let arrayItems: { text?: string; number?: number }[] = [];
  let inArray = false;
  let arrayNumbers: number[] = [];

  const flush = () => {
    const text = current.replace(/[ \t]+/g, ' ').trim();
    if (text) lines.push(text);
    current = '';
  };

  const push = (text: string) => {
    if (!text) return;
    if (current && !current.endsWith(' ') && !text.startsWith(' ')) current += ' ';
    current += text;
  };

  let i = 0;
  const n = content.length;

  while (i < n) {
    const ch = content[i];

    /* ------------------------- literal string ------------------------- */
    if (ch === '(') {
      let depth = 1;
      let j = i + 1;
      let raw = '';
      while (j < n && depth > 0) {
        const c = content[j];
        if (c === '\\') {
          raw += c;
          if (j + 1 < n) raw += content[j + 1];
          j += 2;
          continue;
        }
        if (c === '(') depth++;
        if (c === ')') {
          depth--;
          if (depth === 0) break;
        }
        raw += c;
        j++;
      }
      const text = decodeLiteral(raw);
      i = j + 1;
      if (inArray) arrayItems.push({ text });
      else operands.push({ text });
      continue;
    }

    /* --------------------------- hex string --------------------------- */
    if (ch === '<' && content[i + 1] !== '<') {
      const end = content.indexOf('>', i);
      if (end === -1) break;
      const text = decodeHex(content.slice(i + 1, end));
      i = end + 1;
      if (inArray) arrayItems.push({ text });
      else operands.push({ text });
      continue;
    }

    /* -------------------------- dictionary ---------------------------- */
    if (ch === '<' && content[i + 1] === '<') {
      const end = content.indexOf('>>', i);
      i = end === -1 ? n : end + 2;
      operands = [];
      continue;
    }

    /* ----------------------------- array ------------------------------ */
    if (ch === '[') {
      inArray = true;
      arrayItems = [];
      arrayNumbers = [];
      i++;
      continue;
    }
    if (ch === ']') {
      inArray = false;
      i++;
      continue;
    }

    /* ---------------------------- number ------------------------------ */
    if (/[-+0-9.]/.test(ch)) {
      let j = i;
      while (j < n && /[-+0-9.]/.test(content[j])) j++;
      const value = parseFloat(content.slice(i, j));
      if (!Number.isNaN(value)) {
        if (inArray) arrayNumbers.push(value);
        else operands.push({ text: String(value) });
      }
      i = j;
      continue;
    }

    /* --------------------------- operator ----------------------------- */
    if (/[A-Za-z'"*]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9'"*]/.test(content[j])) j++;
      const op = content.slice(i, j);
      i = j;

      if (op === 'Tj' || op === "'" || op === '"') {
        const last = operands[operands.length - 1];
        if (last) push(last.text);
        if (op !== 'Tj') flush();
        operands = [];
        continue;
      }

      if (op === 'TJ') {
        let text = '';
        for (const item of arrayItems) {
          if (item.text !== undefined) text += item.text;
        }
        /* A large negative kerning value means a word gap. */
        const hasBigGap = arrayNumbers.some((num) => num < -100);
        if (hasBigGap) text = ` ${text}`;
        push(text.trim());
        arrayItems = [];
        arrayNumbers = [];
        operands = [];
        continue;
      }

      if (op === 'Td' || op === 'TD' || op === 'T*' || op === 'ET' || op === 'TL') {
        flush();
        operands = [];
        continue;
      }

      if (op === 'BT') {
        flush();
        operands = [];
        continue;
      }

      operands = [];
      continue;
    }

    i++;
  }

  flush();
  return lines.join('\n');
};

/**
 * Extracts plain text from a PDF file.
 * Returns an empty string when the PDF is image-only (scanned) or unreadable.
 */
export const extractTextFromPdf = async (
  input: ArrayBuffer | Uint8Array
): Promise<string> => {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const raw = latin1(bytes);

  const pieces: string[] = [];
  const streamPattern = /stream\r?\n?/g;
  let match: RegExpExecArray | null;

  while ((match = streamPattern.exec(raw)) !== null) {
    const start = match.index + match[0].length;
    const end = raw.indexOf('endstream', start);
    if (end === -1) break;

    /* The object dictionary sits right before "stream". */
    const dictStart = Math.max(0, match.index - 800);
    const dict = raw.slice(dictStart, match.index);

    let contentBytes: Uint8Array;
    if (/\/FlateDecode/.test(dict)) {
      contentBytes = await inflate(bytes.subarray(start, end));
      if (contentBytes.length === 0) {
        streamPattern.lastIndex = end;
        continue;
      }
    } else {
      contentBytes = bytes.subarray(start, end);
    }

    const content = latin1(contentBytes);
    /* Only content streams carry text operators. */
    if (!/BT|Tj|TJ/.test(content)) {
      streamPattern.lastIndex = end;
      continue;
    }

    const text = extractTextFromContentStream(content);
    if (text.trim()) pieces.push(text.trim());

    streamPattern.lastIndex = end;
  }

  return pieces.join('\n\n').replace(/\n{3,}/g, '\n\n').trim();
};

/** Decodes a base64 payload (no data-url prefix) into bytes. */
export const base64ToBytes = (base64: string): Uint8Array => {
  const clean = (base64 || '').replace(/^data:[^;]+;base64,/, '').replace(/\s+/g, '');
  if (!clean) return new Uint8Array();
  if (typeof atob === 'function') {
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  /* Node fallback. */
  const globalBuffer = (globalThis as any).Buffer;
  if (globalBuffer) {
    return new Uint8Array(globalBuffer.from(clean, 'base64'));
  }
  return new Uint8Array();
};

import { WEBUI_BASE_URL } from '@/lib/constants';
import hljs from 'highlight.js';

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const replaceTokens = (
  content: string,
  char?: string | null,
  user?: string | null
): string => {
  const processOutsideCodeBlocks = (text: string, replacementFn: (segment: string) => string) => {
    return text
      .split(/(```[\s\S]*?```|`[\s\S]*?`)/)
      .map((segment) => {
        return segment.startsWith('```') || segment.startsWith('`')
          ? segment
          : replacementFn(segment);
      })
      .join('');
  };

  content = processOutsideCodeBlocks(content, (segment) => {
    segment = segment.replace(/{{char}}/gi, char || '');
    segment = segment.replace(/{{user}}/gi, user || '');
    segment = segment.replace(
      /{{VIDEO_FILE_ID_([a-f0-9-]+)}}/gi,
      (_, fileId: string) =>
        `<video src="${WEBUI_BASE_URL}/api/v1/files/${fileId}/content" controls></video>`
    );
    segment = segment.replace(
      /{{HTML_FILE_ID_([a-f0-9-]+)}}/gi,
      (_, fileId: string) => `<file type="html" id="${fileId}" />`
    );
    return segment;
  });

  return content;
};

export const processResponseContent = (content: string): string => {
  content = processChineseContent(content);
  return content.trim();
};

function isChineseChar(char: string): boolean {
  return /\p{Script=Han}/u.test(char);
}

function processChineseContent(content: string): string {
  const lines = content.split('\n');
  const processedLines = lines.map((line) => {
    if (/[\u4e00-\u9fa5]/.test(line)) {
      if (line.includes('*')) {
        if (/（|）/.test(line)) {
          line = processChineseDelimiters(line, '**', '（', '）');
          line = processChineseDelimiters(line, '*', '（', '）');
        }
        if (/"|"/.test(line)) {
          line = processChineseDelimiters(line, '**', '"', '"');
          line = processChineseDelimiters(line, '*', '"', '"');
        }
      }
    }
    return line;
  });
  return processedLines.join('\n');
}

function processChineseDelimiters(
  line: string,
  symbol: string,
  leftSymbol: string,
  rightSymbol: string
): string {
  const escapedSymbol = escapeRegExp(symbol);
  const regex = new RegExp(
    `(.?)(?<!${escapedSymbol})(${escapedSymbol})([^${escapedSymbol}]+)(${escapedSymbol})(?!${escapedSymbol})(.)`,
    'g'
  );
  return line.replace(regex, (match, l, left, content, right, r) => {
    const result =
      (content.startsWith(leftSymbol) && l && l.length > 0 && isChineseChar(l[l.length - 1])) ||
      (content.endsWith(rightSymbol) && r && r.length > 0 && isChineseChar(r[0]));

    if (result) {
      return `${l} ${left}${content}${right} ${r}`;
    } else {
      return match;
    }
  });
}

export function unescapeHtml(html: string): string | null {
  if (typeof window === 'undefined') return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.documentElement.textContent;
}

export const copyToClipboard = async (
  text: string,
  html: string | null = null,
  formatted = false
): Promise<boolean> => {
  if (typeof window === 'undefined') return false;

  if (formatted) {
    let styledHtml = '';
    if (!html) {
      const htmlContent = text;
      styledHtml = `
        <div>
          <style>
            pre {
              background-color: #f6f8fa;
              border-radius: 6px;
              padding: 16px;
              overflow: auto;
            }
            code {
              font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
              font-size: 14px;
            }
          </style>
          ${htmlContent}
        </div>
      `;
    } else {
      styledHtml = html;
    }

    const blob = new Blob([styledHtml], { type: 'text/html' });

    try {
      const data = new ClipboardItem({
        'text/html': blob,
        'text/plain': new Blob([text], { type: 'text/plain' }),
      });
      await navigator.clipboard.write([data]);
      return true;
    } catch {
      return await copyToClipboard(text);
    }
  } else {
    if (!navigator.clipboard) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.position = 'fixed';

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        document.execCommand('copy');
        return true;
      } catch {
        return false;
      } finally {
        document.body.removeChild(textArea);
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
};

export const highlightCode = (code: string, lang?: string): string => {
  if (!lang) {
    return hljs.highlightAuto(code).value;
  }
  const language = hljs.getLanguage(lang) ? lang : 'plaintext';
  return hljs.highlight(code, { language }).value;
};

let mermaidInstance: typeof import('mermaid').default | null = null;

export const initMermaid = async () => {
  if (mermaidInstance) return mermaidInstance;

  const mermaid = (await import('mermaid')).default;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
  });
  mermaidInstance = mermaid;
  return mermaid;
};

export const renderMermaidDiagram = async (
  mermaid: typeof import('mermaid').default,
  code: string
): Promise<string> => {
  const id = `mermaid-${Date.now()}`;
  const { svg } = await mermaid.render(id, code);
  return svg;
};

export const canvasPixelTest = (): boolean => {
  if (typeof window === 'undefined') return true;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;

  canvas.height = 1;
  canvas.width = 1;
  const imageData = new ImageData(canvas.width, canvas.height);
  const pixelValues = imageData.data;

  for (let i = 0; i < imageData.data.length; i += 1) {
    if (i % 4 !== 3) {
      pixelValues[i] = Math.floor(256 * Math.random());
    } else {
      pixelValues[i] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const p = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

  for (let i = 0; i < p.length; i += 1) {
    if (p[i] !== pixelValues[i]) {
      console.log('canvasPixelTest: Canvas blocking or spoofing is likely');
      return false;
    }
  }

  return true;
};

export const generateInitialsImage = (name: string): string => {
  if (typeof window === 'undefined') return `${WEBUI_BASE_URL}/user.png`;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return `${WEBUI_BASE_URL}/user.png`;

  canvas.width = 100;
  canvas.height = 100;

  if (!canvasPixelTest()) {
    console.log('generateInitialsImage: failed pixel test, using default image.');
    return `${WEBUI_BASE_URL}/user.png`;
  }

  ctx.fillStyle = '#F39C12';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '40px Helvetica';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const sanitizedName = name.trim();
  const initials =
    sanitizedName.length > 0
      ? sanitizedName[0] +
        (sanitizedName.split(' ').length > 1
          ? sanitizedName[sanitizedName.lastIndexOf(' ') + 1]
          : '')
      : '';

  ctx.fillText(initials.toUpperCase(), canvas.width / 2, canvas.height / 2);

  return canvas.toDataURL();
};

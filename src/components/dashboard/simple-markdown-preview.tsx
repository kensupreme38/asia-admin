"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

function safeHref(raw: string): string | null {
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return t;
  if (/^mailto:[^\s]+$/i.test(t)) return t;
  return null;
}

/** Renders a subset of Markdown + common GFM-ish patterns; no external deps. */
function parseInline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  let i = 0;
  let n = 0;
  const k = () => `${keyBase}-${n++}`;

  while (i < text.length) {
    const rest = text.slice(i);

    let m = /^!\[([^\]]*)\]\(([^)]+)\)/.exec(rest);
    if (m) {
      const src = safeHref(m[2]);
      if (src) {
        out.push(
          <img
            key={k()}
            src={src}
            alt={m[1]}
            className="my-2 max-h-48 max-w-full rounded-md object-contain"
          />
        );
      } else {
        out.push(<span key={k()}>{m[0]}</span>);
      }
      i += m[0].length;
      continue;
    }

    m = /^\[([^\]]+)\]\(([^)]+)\)/.exec(rest);
    if (m) {
      const href = safeHref(m[2]);
      if (href) {
        out.push(
          <a
            key={k()}
            href={href}
            className="text-primary underline underline-offset-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            {parseInline(m[1], `${keyBase}-a`)}
          </a>
        );
      } else {
        out.push(<span key={k()}>{m[0]}</span>);
      }
      i += m[0].length;
      continue;
    }

    m = /^`([^`]+)`/.exec(rest);
    if (m) {
      out.push(
        <code key={k()} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">
          {m[1]}
        </code>
      );
      i += m[0].length;
      continue;
    }

    m = /^~~([^~]+)~~/.exec(rest);
    if (m) {
      out.push(<del key={k()}>{m[1]}</del>);
      i += m[0].length;
      continue;
    }

    m = /^\*\*([^*\n]+?)\*\*/.exec(rest);
    if (m) {
      out.push(
        <strong key={k()} className="font-semibold">
          {parseInline(m[1], `${keyBase}-b`)}
        </strong>
      );
      i += m[0].length;
      continue;
    }

    m = /^\*([^*\n]+?)\*/.exec(rest);
    if (m) {
      out.push(<em key={k()}>{parseInline(m[1], `${keyBase}-i`)}</em>);
      i += m[0].length;
      continue;
    }

    out.push(<React.Fragment key={k()}>{text[i]}</React.Fragment>);
    i++;
  }

  return out;
}

function isTableSeparator(line: string): boolean {
  const cells = line
    .split("|")
    .map((c) => c.trim())
    .filter((c) => c.length > 0);
  if (cells.length < 2) return false;
  return cells.every((c) => /^:?-{2,}:?$/.test(c));
}

function parseTableRow(line: string): string[] {
  const raw = line.trim();
  const inner = raw.startsWith("|") ? raw.slice(1) : raw;
  const parts = inner.split("|").map((c) => c.trim());
  if (parts.length && parts[parts.length - 1] === "") parts.pop();
  if (parts.length && parts[0] === "") parts.shift();
  return parts;
}

function renderTable(lines: string[], key: string): React.ReactElement {
  if (lines.length < 2) {
    return (
      <p key={key} className="mb-2 text-sm">
        {lines.join("\n")}
      </p>
    );
  }
  const header = parseTableRow(lines[0]);
  if (!isTableSeparator(lines[1])) {
    return (
      <p key={key} className="mb-2 text-sm">
        {lines.join("\n")}
      </p>
    );
  }
  const bodyRows = lines.slice(2).map(parseTableRow);
  return (
    <div key={key} className="mb-2 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {header.map((h, j) => (
              <th
                key={j}
                className="border border-border bg-muted/50 px-2 py-1 text-left font-medium"
              >
                {parseInline(h, `${key}-h-${j}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, ri) => (
            <tr key={ri}>
              {row.map((cell, ci) => (
                <td key={ci} className="border border-border px-2 py-1">
                  {parseInline(cell, `${key}-c-${ri}-${ci}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function parseBlocks(text: string): React.ReactNode[] {
  const lines = text.split(/\r?\n/);
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let bi = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") {
      i++;
      continue;
    }

    const key = `blk-${bi++}`;

    if (line.startsWith("```")) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        body.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push(
        <pre
          key={key}
          className="mb-2 overflow-x-auto rounded-md bg-muted p-3 text-xs last:mb-0 [&>code]:bg-transparent"
        >
          <code className="font-mono text-sm">{body.join("\n")}</code>
        </pre>
      );
      continue;
    }

    const hm = /^(#{1,6})\s+(.*)$/.exec(line);
    if (hm) {
      const depth = hm[1].length;
      const Tag = `h${Math.min(depth, 6)}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
      const size =
        depth === 1
          ? "mt-2 text-xl font-bold first:mt-0"
          : depth === 2
            ? "mt-2 text-lg font-semibold first:mt-0"
            : "mt-2 text-base font-semibold first:mt-0";
      blocks.push(
        <Tag key={key} className={size}>
          {parseInline(hm[2], `${key}-t`)}
        </Tag>
      );
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim())) {
      blocks.push(<hr key={key} className="my-3 border-border" />);
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push(
        <blockquote
          key={key}
          className="mb-2 border-l-2 border-muted-foreground/40 pl-3 text-sm italic last:mb-0"
        >
          {quoteLines.map((ql, qi) => (
            <p key={qi} className="mb-1 last:mb-0">
              {parseInline(ql, `${key}-q-${qi}`)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      blocks.push(renderTable(tableLines, key));
      continue;
    }

    const ul = /^(\s*)([-*+])\s+(.+)$/.exec(line);
    const ol = /^(\s*)(\d+)\.\s+(.+)$/.exec(line);
    if (ul || ol) {
      const ordered = !!ol;
      const items: string[] = [];
      while (i < lines.length) {
        const u = /^(\s*)([-*+])\s+(.+)$/.exec(lines[i]);
        const o = /^(\s*)(\d+)\.\s+(.+)$/.exec(lines[i]);
        if (ordered && o) {
          items.push(o[3]);
          i++;
        } else if (!ordered && u) {
          items.push(u[3]);
          i++;
        } else {
          break;
        }
      }
      const ListTag = ordered ? "ol" : "ul";
      const listCls = ordered
        ? "mb-2 list-decimal pl-5 text-sm last:mb-0"
        : "mb-2 list-disc pl-5 text-sm last:mb-0";
      blocks.push(
        <ListTag key={key} className={listCls}>
          {items.map((it, ii) => (
            <li key={ii} className="mb-0.5">
              {parseInline(it, `${key}-li-${ii}`)}
            </li>
          ))}
        </ListTag>
      );
      continue;
    }

    const para: string[] = [];
    while (i < lines.length && lines[i].trim() !== "") {
      para.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key} className="mb-2 text-sm leading-relaxed last:mb-0">
        {para.map((pl, pi) => (
          <React.Fragment key={pi}>
            {pi > 0 && <br />}
            {parseInline(pl, `${key}-p-${pi}`)}
          </React.Fragment>
        ))}
      </p>
    );
  }

  return blocks;
}

export function SimpleMarkdownPreview({ source, className }: { source: string; className?: string }) {
  const trimmed = source.trim();
  if (!trimmed) return null;
  return <div className={cn("text-foreground", className)}>{parseBlocks(trimmed)}</div>;
}

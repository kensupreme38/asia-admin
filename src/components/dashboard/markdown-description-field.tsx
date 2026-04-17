"use client";

import * as React from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo2,
  Redo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export type MarkdownDescriptionFieldProps = {
  value: string;
  onValueChange: (nextValue: string) => void;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  name?: string;
  placeholder?: string;
  rows?: number;
};

function escapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function markdownToHtml(md: string): string {
  const lines = md.split(/\r?\n/);
  const out: string[] = [];
  for (const raw of lines) {
    const line = escapeHtml(raw);
    if (/^\s*$/.test(line)) {
      out.push("<p><br></p>");
      continue;
    }
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = Math.min(6, h[1].length);
      out.push(`<h${lvl}>${h[2]}</h${lvl}>`);
      continue;
    }
    const ul = /^[-*+]\s+(.*)$/.exec(line);
    if (ul) {
      out.push(`<ul><li>${ul[1]}</li></ul>`);
      continue;
    }
    const ol = /^\d+\.\s+(.*)$/.exec(line);
    if (ol) {
      out.push(`<ol><li>${ol[1]}</li></ol>`);
      continue;
    }
    const quote = /^>\s+(.*)$/.exec(line);
    if (quote) {
      out.push(`<blockquote>${quote[1]}</blockquote>`);
      continue;
    }
    out.push(`<p>${line}</p>`);
  }
  return out
    .join("")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/~~(.*?)~~/g, "<del>$1</del>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2" />');
}

function elementToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
  if (!(node instanceof HTMLElement)) return "";
  const children = Array.from(node.childNodes).map(elementToMarkdown).join("");
  const tag = node.tagName.toLowerCase();
  switch (tag) {
    case "strong":
    case "b":
      return `**${children}**`;
    case "em":
    case "i":
      return `*${children}*`;
    case "del":
    case "s":
      return `~~${children}~~`;
    case "code":
      return `\`${children}\``;
    case "h1":
      return `# ${children}\n\n`;
    case "h2":
      return `## ${children}\n\n`;
    case "h3":
      return `### ${children}\n\n`;
    case "h4":
      return `#### ${children}\n\n`;
    case "h5":
      return `##### ${children}\n\n`;
    case "h6":
      return `###### ${children}\n\n`;
    case "blockquote":
      return `> ${children}\n\n`;
    case "li":
      return children;
    case "ul":
      return Array.from(node.children)
        .map((li) => `- ${elementToMarkdown(li).trim()}`)
        .join("\n")
        .concat("\n\n");
    case "ol":
      return Array.from(node.children)
        .map((li, idx) => `${idx + 1}. ${elementToMarkdown(li).trim()}`)
        .join("\n")
        .concat("\n\n");
    case "a": {
      const href = node.getAttribute("href") || "#";
      return `[${children || href}](${href})`;
    }
    case "img": {
      const src = node.getAttribute("src") || "";
      const alt = node.getAttribute("alt") || "";
      return src ? `![${alt}](${src})` : "";
    }
    case "br":
      return "\n";
    case "div":
    case "p":
      return `${children}\n\n`;
    default:
      return children;
  }
}

export const MarkdownDescriptionField = React.forwardRef<HTMLTextAreaElement, MarkdownDescriptionFieldProps>(
  function MarkdownDescriptionField({ value, onValueChange, onBlur, placeholder, rows = 5 }, ref) {
    const editorRef = React.useRef<HTMLDivElement | null>(null);
    const [localValue, setLocalValue] = React.useState<string>(value || "");
    const isFocusedRef = React.useRef(false);
    const [activeMarks, setActiveMarks] = React.useState({
      bold: false,
      italic: false,
      strike: false,
      unorderedList: false,
      orderedList: false,
      h1: false,
      h2: false,
      h3: false,
      quote: false,
      codeBlock: false,
    });

    React.useEffect(() => {
      setLocalValue(value || "");
    }, [value]);

    React.useEffect(() => {
      if (!editorRef.current || isFocusedRef.current) return;
      editorRef.current.innerHTML = markdownToHtml(localValue || "");
    }, [localValue]);

    const toMarkdownAndSync = React.useCallback(() => {
      if (!editorRef.current) return;
      const markdown = Array.from(editorRef.current.childNodes)
        .map(elementToMarkdown)
        .join("")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      setLocalValue(markdown);
      onValueChange(markdown);
    }, [onValueChange]);

    const runCommand = React.useCallback((command: string, valueArg?: string) => {
      if (!editorRef.current) return;
      editorRef.current.focus();
      document.execCommand(command, false, valueArg);
      toMarkdownAndSync();
    }, [toMarkdownAndSync]);

    const updateActiveMarks = React.useCallback(() => {
      const root = editorRef.current;
      if (!root) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const anchorNode = sel.anchorNode;
      if (!anchorNode) return;
      const el = anchorNode instanceof Element ? anchorNode : anchorNode.parentElement;
      if (!el || !root.contains(el)) return;

      const parentTag = el.closest("h1, h2, h3, blockquote, pre")?.tagName.toLowerCase() || "";

      setActiveMarks({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        strike: document.queryCommandState("strikeThrough"),
        unorderedList: document.queryCommandState("insertUnorderedList"),
        orderedList: document.queryCommandState("insertOrderedList"),
        h1: parentTag === "h1",
        h2: parentTag === "h2",
        h3: parentTag === "h3",
        quote: parentTag === "blockquote",
        codeBlock: parentTag === "pre",
      });
    }, []);

    React.useEffect(() => {
      const handleSelection = () => updateActiveMarks();
      document.addEventListener("selectionchange", handleSelection);
      return () => document.removeEventListener("selectionchange", handleSelection);
    }, [updateActiveMarks]);

    const tools = [
      { icon: Bold, label: "Bold", action: () => runCommand("bold"), active: activeMarks.bold },
      { icon: Italic, label: "Italic", action: () => runCommand("italic"), active: activeMarks.italic },
      { icon: Strikethrough, label: "Strike", action: () => runCommand("strikeThrough"), active: activeMarks.strike },
      { icon: Code, label: "Code", action: () => runCommand("formatBlock", "pre"), active: activeMarks.codeBlock },
      { icon: Heading1, label: "H1", action: () => runCommand("formatBlock", "h1"), active: activeMarks.h1 },
      { icon: Heading2, label: "H2", action: () => runCommand("formatBlock", "h2"), active: activeMarks.h2 },
      { icon: Heading3, label: "H3", action: () => runCommand("formatBlock", "h3"), active: activeMarks.h3 },
      { icon: List, label: "Bullet", action: () => runCommand("insertUnorderedList"), active: activeMarks.unorderedList },
      { icon: ListOrdered, label: "Numbered", action: () => runCommand("insertOrderedList"), active: activeMarks.orderedList },
      { icon: Quote, label: "Quote", action: () => runCommand("formatBlock", "blockquote"), active: activeMarks.quote },
      {
        icon: LinkIcon,
        label: "Link",
        active: false,
        action: () => {
          const url = window.prompt("Nhap URL", "https://");
          if (url) runCommand("createLink", url);
        },
      },
      {
        icon: ImageIcon,
        label: "Image",
        active: false,
        action: () => {
          const url = window.prompt("Nhap URL anh", "https://");
          if (url) runCommand("insertImage", url);
        },
      },
    ] as const;

    return (
      <div className="w-full overflow-hidden rounded-md border border-input">
        <div className="flex flex-wrap items-center gap-1 border-b border-input bg-background p-2">
          {tools.map((tool, idx) => (
            <React.Fragment key={tool.label}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={tool.action}
                className={`h-8 w-8 ${
                  tool.active
                    ? "bg-primary/20 text-primary hover:bg-primary/25"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
                title={tool.label}
              >
                <tool.icon className="h-4 w-4" />
              </Button>
              {idx === 3 || idx === 6 || idx === 9 ? <span className="mx-1 h-5 w-px bg-border" /> : null}
            </React.Fragment>
          ))}
          <span className="mx-1 h-5 w-px bg-border" />
          <Button type="button" variant="ghost" size="icon" onClick={() => runCommand("undo")} className="h-8 w-8" title="Undo">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => runCommand("redo")} className="h-8 w-8" title="Redo">
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onFocus={() => {
            isFocusedRef.current = true;
            updateActiveMarks();
          }}
          onBlur={(e) => {
            isFocusedRef.current = false;
            toMarkdownAndSync();
            onBlur?.(e as unknown as React.FocusEvent<HTMLTextAreaElement>);
          }}
          onInput={() => {
            toMarkdownAndSync();
            updateActiveMarks();
          }}
          onKeyUp={updateActiveMarks}
          onMouseUp={updateActiveMarks}
          data-placeholder={placeholder}
          className="min-h-[220px] border-0 bg-background px-3 py-2 text-base outline-none [&:empty:before]:text-muted-foreground [&:empty:before]:content-[attr(data-placeholder)]"
          style={{ minHeight: `${Math.max(5, rows) * 44}px` }}
        />
        <textarea
          ref={ref}
          className="hidden"
          value={localValue}
          readOnly
          aria-hidden="true"
          tabIndex={-1}
        />

        <p className="border-t border-input px-3 py-2 text-xs text-muted-foreground">
          Trinh soan thao dang Word, khong hien thi cu phap Markdown khi nhap.
        </p>
      </div>
    );
  }
);

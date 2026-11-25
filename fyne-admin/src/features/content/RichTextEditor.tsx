'use client';

import { useEffect, useRef } from 'react';
import { Bold, Heading2, Italic, List, ListOrdered, Link2 } from 'lucide-react';

const TOOLS = [
  { label: 'Bold', icon: Bold, command: 'bold' },
  { label: 'Italic', icon: Italic, command: 'italic' },
  { label: 'Heading', icon: Heading2, command: 'formatBlock', value: 'h2' },
  { label: 'Bulleted list', icon: List, command: 'insertUnorderedList' },
  { label: 'Numbered list', icon: ListOrdered, command: 'insertOrderedList' },
] as const;

export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useRef<HTMLDivElement>(null);
  useEffect(() => { if (editor.current && editor.current.innerHTML !== value) editor.current.innerHTML = value; }, [value]);
  const run = (command: string, argument?: string) => {
    editor.current?.focus();
    document.execCommand(command, false, argument);
    onChange(editor.current?.innerHTML || '');
  };
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white focus-within:border-primary focus-within:shadow-ring">
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/50 p-2">
        {TOOLS.map(({ label, icon: Icon, command, ...tool }) => <button key={label} type="button" title={label} aria-label={label} onMouseDown={(e) => e.preventDefault()} onClick={() => run(command, 'value' in tool ? tool.value : undefined)} className="rounded-md p-2 text-ink-soft hover:bg-white hover:text-primary"><Icon className="h-4 w-4" /></button>)}
        <button type="button" title="Insert link" aria-label="Insert link" onMouseDown={(e) => e.preventDefault()} onClick={() => { const href = window.prompt('Paste the link URL'); if (href && /^https?:\/\//i.test(href)) run('createLink', href); }} className="rounded-md p-2 text-ink-soft hover:bg-white hover:text-primary"><Link2 className="h-4 w-4" /></button>
      </div>
      <div ref={editor} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Blog article content" onInput={(e) => onChange(e.currentTarget.innerHTML)} className="prose prose-sm min-h-64 max-w-none p-4 outline-none" />
    </div>
  );
}

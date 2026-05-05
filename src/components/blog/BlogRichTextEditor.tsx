"use client";

import { useEffect, useMemo, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import imageCompression from "browser-image-compression";
import { getBlogs, type BlogItem } from "@/lib/api";
import { blogPublicPath } from "@/lib/blog-path";

export type BlogRichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  onUploadImage: (file: File) => Promise<{ url: string }>;
  placeholder?: string;
  className?: string;
};

export function BlogRichTextEditor({
  value,
  onChange,
  onUploadImage,
  placeholder = "Write your article…",
  className = "",
}: BlogRichTextEditorProps) {
  const [showInternalLinkPicker, setShowInternalLinkPicker] = useState(false);
  const [internalLinkQuery, setInternalLinkQuery] = useState("");
  const [blogOptions, setBlogOptions] = useState<BlogItem[]>([]);
  const [isLoadingBlogOptions, setIsLoadingBlogOptions] = useState(false);
  const [blogOptionsError, setBlogOptionsError] = useState("");
  const [activeAutocompleteIndex, setActiveAutocompleteIndex] = useState(0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg border border-gray-200 my-4",
        },
      }),
      Placeholder.configure({ placeholder }),
      CharacterCount.configure({ limit: null }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "blog-editor-prose min-h-[280px] px-3 py-3 focus:outline-none prose prose-sm max-w-none prose-headings:text-gray-900 prose-p:text-gray-800 prose-li:text-gray-800",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const cur = editor.getHTML();
    if (cur === value) return;
    editor.commands.setContent(value, false);
  }, [value, editor]);

  const filteredBlogOptions = useMemo(() => {
    const query = internalLinkQuery.trim().toLowerCase();
    const list = blogOptions
      .map((item) => {
        const title = (item.title || "").toLowerCase();
        const slug = (item.slug || "").toLowerCase();
        let score = 0;
        if (!query) {
          score = 1;
        } else {
          if (title.startsWith(query)) score += 6;
          if (slug.startsWith(query)) score += 5;
          if (title.includes(query)) score += 3;
          if (slug.includes(query)) score += 2;
        }
        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
      .slice(0, 8)
      .map((entry) => entry.item);
    return list;
  }, [blogOptions, internalLinkQuery]);

  useEffect(() => {
    setActiveAutocompleteIndex(0);
  }, [internalLinkQuery, showInternalLinkPicker]);

  const runImagePick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file || !editor) return;
      try {
        const compressed = await imageCompression(file, {
          maxSizeMB: 1.2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        });
        const { url } = await onUploadImage(compressed);
        const alt = window.prompt("Alt text (required for accessibility & SEO)", "") ?? "";
        const title = window.prompt("Image title (optional tooltip)", "") ?? "";
        editor.chain().focus().setImage({ src: url, alt: alt || "", title: title || undefined }).run();
      } catch (e) {
        console.error(e);
        window.alert(e instanceof Error ? e.message : "Image upload failed.");
      }
    };
    input.click();
  };

  const setLink = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const isSelectionEmpty = from === to;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev || "https://");
    if (url === null) return;
    const trimmed = url.trim();
    if (trimmed === "") {
      editor.chain().focus().setTextSelection({ from, to }).extendMarkRange("link").unsetLink().run();
      return;
    }
    if (isSelectionEmpty) {
      // No selected text: insert URL as clickable anchor text.
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${trimmed}" target="_blank" rel="noopener noreferrer nofollow">${trimmed}</a>`)
        .run();
      return;
    }
    editor
      .chain()
      .focus()
      .setTextSelection({ from, to })
      .extendMarkRange("link")
      .setLink({ href: trimmed })
      .run();
  };

  const openInternalLinkPicker = async () => {
    const nextOpen = !showInternalLinkPicker;
    setShowInternalLinkPicker(nextOpen);
    if (!nextOpen || blogOptions.length > 0 || isLoadingBlogOptions) return;
    setIsLoadingBlogOptions(true);
    setBlogOptionsError("");
    try {
      const blogs = await getBlogs();
      setBlogOptions(blogs);
    } catch (err: unknown) {
      setBlogOptionsError(err instanceof Error ? err.message : "Unable to load blogs.");
      setBlogOptions([]);
    } finally {
      setIsLoadingBlogOptions(false);
    }
  };

  const onAutocompleteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (filteredBlogOptions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveAutocompleteIndex((prev) => (prev + 1) % filteredBlogOptions.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveAutocompleteIndex((prev) => (prev - 1 + filteredBlogOptions.length) % filteredBlogOptions.length);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const selected = filteredBlogOptions[activeAutocompleteIndex];
      if (selected) insertInternalLink(selected);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setShowInternalLinkPicker(false);
      setInternalLinkQuery("");
    }
  };

  const insertInternalLink = (item: BlogItem) => {
    if (!editor) return;
    const href = blogPublicPath(item);
    const { from, to } = editor.state.selection;
    const isSelectionEmpty = from === to;
    if (isSelectionEmpty) {
      editor
        .chain()
        .focus()
        .insertContent({
          type: "text",
          text: item.title,
          marks: [{ type: "link", attrs: { href } }],
        })
        .run();
    } else {
      editor
        .chain()
        .focus()
        .setTextSelection({ from, to })
        .extendMarkRange("link")
        .setLink({ href })
        .run();
    }
    setShowInternalLinkPicker(false);
    setInternalLinkQuery("");
  };

  if (!editor) {
    return (
      <div className="min-h-[280px] animate-pulse rounded-lg border border-gray-200 bg-gray-50" aria-hidden />
    );
  }

  const marks = {
    bold: () => editor.chain().focus().toggleBold().run(),
    italic: () => editor.chain().focus().toggleItalic().run(),
    underline: () => editor.chain().focus().toggleUnderline().run(),
  };

  return (
    <div className={`rounded-xl border border-gray-200 bg-white shadow-inner ${className}`}>
      <div className="flex flex-wrap gap-1 border-b border-gray-100 bg-gray-50/80 px-2 py-2">
        <ToolbarBtn label="H1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
        <ToolbarBtn label="H2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
        <ToolbarBtn label="H3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} />
        <span className="mx-1 w-px self-stretch bg-gray-200" />
        <ToolbarBtn label="Bold" active={editor.isActive("bold")} onClick={marks.bold} />
        <ToolbarBtn label="Italic" active={editor.isActive("italic")} onClick={marks.italic} />
        <ToolbarBtn label="Underline" active={editor.isActive("underline")} onClick={marks.underline} />
        <span className="mx-1 w-px self-stretch bg-gray-200" />
        <ToolbarBtn label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} />
        <ToolbarBtn label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
        <span className="mx-1 w-px self-stretch bg-gray-200" />
        <ToolbarBtn label="Link" active={editor.isActive("link")} onClick={setLink} />
        <ToolbarBtn label="Link blog" active={showInternalLinkPicker} onClick={() => void openInternalLinkPicker()} />
        <ToolbarBtn label="Image" active={false} onClick={runImagePick} />
      </div>
      {showInternalLinkPicker && (
        <div className="border-b border-gray-100 bg-white px-3 py-3">
          <label className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Search existing blogs</label>
          <input
            type="text"
            value={internalLinkQuery}
            onChange={(e) => setInternalLinkQuery(e.target.value)}
            onKeyDown={onAutocompleteKeyDown}
            placeholder="Type title or slug..."
            autoFocus
            className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#0468a3]"
          />
          <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
            {isLoadingBlogOptions ? (
              <p className="text-xs font-semibold text-gray-500">Loading blogs...</p>
            ) : blogOptionsError ? (
              <p className="text-xs font-semibold text-red-600">{blogOptionsError}</p>
            ) : filteredBlogOptions.length === 0 ? (
              <p className="text-xs font-semibold text-gray-500">No matching blogs found.</p>
            ) : (
              filteredBlogOptions.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => insertInternalLink(item)}
                  className={`block w-full rounded-md border px-3 py-2 text-left ${
                    filteredBlogOptions[activeAutocompleteIndex]?.id === item.id
                      ? "border-[#0468a3] bg-[#edf6fc]"
                      : "border-gray-200 bg-white hover:bg-gray-50"
                  }`}
                >
                  <p className="line-clamp-1 text-sm font-semibold text-gray-800">{item.title || "(Untitled)"}</p>
                  <p className="line-clamp-1 text-[11px] font-medium text-gray-500">{blogPublicPath(item)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      )}
      <EditorContent editor={editor} />
      <div className="border-t border-gray-100 px-3 py-2 text-[11px] font-semibold text-gray-500">
        {typeof editor.storage.characterCount?.characters === "function"
          ? editor.storage.characterCount.characters()
          : "—"}{" "}
        characters
      </div>
    </div>
  );
}

function ToolbarBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded px-2 py-1 text-[11px] font-bold uppercase tracking-wide transition ${
        active ? "bg-[#0468a3] text-white" : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}

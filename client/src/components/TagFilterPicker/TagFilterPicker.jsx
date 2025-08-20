// TagFilterPicker.jsx (filter-only, shows tokens inline)
import { useEffect, useRef, useState } from "react";
import API from "../../utils/api";
import "./TagFilterPicker.css";

export default function TagFilterPicker({ value = [], onChange }) {
  // value: string[] (tag names)
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState([]); // [{id, name}]
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!query.trim()) { setOptions([]); setOpen(false); return; }

    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const q = query.trim();
        const res = await API.get("/tags/filter", { params: { q } }); // ← use query
        const selected = new Set(value);
        const qLower = q.toLowerCase();

        const filtered = (res.data || [])
          .filter(t => t.name.toLowerCase().startsWith(qLower)) // optional (backend already does this)
          .filter(t => !selected.has(t.name));

        if (!cancelled) {
          setOptions(filtered);
          setOpen(true);
          setHighlight(0);
        }
      } catch (e) {
        console.error("Tag search failed:", e);
      }
    }, 200);

    return () => { cancelled = true; clearTimeout(t); };
  }, [query, value]);

  



  useEffect(() => {
    const onDoc = (e) => {
      if (!wrapRef.current || wrapRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const focusInput = () => inputRef.current?.focus();

  const addName = (name) => {
    if (!value.includes(name)) onChange([...value, name]);
    setQuery(""); setOptions([]); setOpen(false); focusInput();
  };
  const removeName = (name) => {
    onChange(value.filter(n => n !== name)); focusInput();
  };

  const onKeyDown = (e) => {
    if (e.key === "Backspace" && query === "" && value.length > 0) {
      e.preventDefault();
      removeName(value[value.length - 1]);
      return;
    }
    if (!open || options.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setHighlight(h => Math.min(h + 1, options.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHighlight(h => Math.max(h - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); addName(options[highlight].name); }
    else if (e.key === "Escape") { setOpen(false); }
  };

  return (
    <div className="tfi" ref={wrapRef} onClick={focusInput}>
      <label className="tfi-label">Tags</label>

      <div className="tfi-box" role="combobox" aria-expanded={open} aria-haspopup="listbox">
        {value.map(name => (
          <span key={name} className="tfi-token">
            {name}
            <button type="button" className="tfi-x"
              onClick={(e) => { e.stopPropagation(); removeName(name); }}
              aria-label={`Remove ${name}`}>
              ×
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          className="tfi-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.replace(/\s/g, ""))}
          onKeyDown={onKeyDown}
          onFocus={() => query && setOpen(true)}
          placeholder={value.length ? "" : "Search tags…"}
          aria-autocomplete="list"
          aria-controls="tfi-listbox"
        />
      </div>

      {open && options.length > 0 && (
        <ul className="tfi-listbox" id="tfi-listbox" role="listbox">
          {options.map((opt, i) => (
            <li
              key={opt.id}
              role="option"
              aria-selected={i === highlight}
              className={`tfi-option ${i === highlight ? "is-active" : ""}`}
              onMouseDown={(e) => { e.preventDefault(); addName(opt.name); }}
              onMouseEnter={() => setHighlight(i)}
              title={opt.name}
            >
              {opt.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


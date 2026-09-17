import { useId, useRef, useState, type RefObject } from "react";
import { searchCandidates, type CandidateOption } from "../logic/candidate-search";
import styles from "./character-guessing-game.module.css";

export function CandidatePicker({ options, value, onChange, inputRef, placeholder, invalid }: {
  options: readonly CandidateOption[];
  value: string;
  onChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  placeholder: string;
  invalid: boolean;
}) {
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const matches = searchCandidates(options, value);
  const visible = matches.slice(0, 8);
  const expanded = open && value.trim().length > 0;
  const activeIndex = active < visible.length ? active : -1;

  function select(option: CandidateOption) {
    onChange(option.value);
    setOpen(false);
    setActive(-1);
    inputRef.current?.focus();
  }

  return <div className={styles.picker} onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setActive(-1); }
  }}>
    <input id="character-guess" ref={inputRef} role="combobox" aria-autocomplete="list"
      aria-expanded={expanded} aria-controls={listId}
      aria-activedescendant={expanded && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined}
      aria-describedby="guess-help guess-error" aria-invalid={invalid}
      value={value} placeholder={placeholder} autoCapitalize="off" autoCorrect="off" spellCheck={false}
      onChange={(event) => { onChange(event.target.value); setOpen(true); setActive(-1); }}
      onKeyDown={(event) => {
        if (event.nativeEvent.isComposing) return;
        if (event.key === "Escape") { event.preventDefault(); setOpen(false); setActive(-1); }
        else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          setOpen(true);
          const next = !open || activeIndex < 0
            ? event.key === "ArrowDown" ? 0 : visible.length - 1
            : (activeIndex + (event.key === "ArrowDown" ? 1 : -1) + visible.length) % visible.length;
          setActive(visible.length ? next : -1);
          listRef.current?.children[next]?.scrollIntoView({ block: "nearest" });
        } else if (event.key === "Enter" && expanded && activeIndex >= 0) {
          event.preventDefault();
          select(visible[activeIndex]);
        }
      }} />
    <ul id={listId} ref={listRef} role="listbox" aria-label="Matching candidates" className={styles.pickerOptions} hidden={!expanded || !visible.length}>
      {visible.map((option, index) => <li key={option.value} role="presentation"><button type="button" tabIndex={-1} role="option" id={`${listId}-${index}`}
        aria-selected={activeIndex === index} onMouseDown={(event) => event.preventDefault()}
        onClick={() => select(option)}>
        <span>{option.label}</span><strong>{option.detail}</strong>
      </button></li>)}
    </ul>
    {expanded && !visible.length && <p className={styles.muted}>No matching candidates.</p>}
    {expanded && matches.length > visible.length && <p className={styles.muted}>Showing 8 of {matches.length}. Keep typing to narrow the choices.</p>}
  </div>;
}

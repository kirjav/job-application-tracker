import { useEffect, useState } from "react";
import { MODE_OPTIONS as MODE_VALUES } from "../../constants/ApplicationModes";
import { STATUS_OPTIONS as STATUS_VALUES } from "../../constants/ApplicationStatuses";

export default function TableFilterForm({ value = {}, onSubmit }) {
  // local draft state
  const [draft, setDraft] = useState({
    statuses: value.statuses ?? [],
    modes: value.modes ?? [],
    dateFrom: value.dateFrom ?? "",
    dateTo: value.dateTo ?? "",
    minSalary: value.minSalary ?? "",
    maxSalary: value.maxSalary ?? "",
    tagIds: value.tagIds ?? [],
    q: value.q ?? "",
  });

  // if parent resets filters, sync draft
  useEffect(() => {
    setDraft({
      statuses: value.statuses ?? [],
      modes: value.modes ?? [],
      dateFrom: value.dateFrom ?? "",
      dateTo: value.dateTo ?? "",
      minSalary: value.minSalary ?? "",
      maxSalary: value.maxSalary ?? "",
      tagIds: value.tagIds ?? [],
      q: value.q ?? "",
    });
  }, [JSON.stringify(value)]);

  const update = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // normalize empty fields to undefined so your Zod preprocessors behave
    onSubmit?.({
      statuses: draft.statuses?.length ? draft.statuses : undefined,
      modes: draft.modes?.length ? draft.modes : undefined,
      dateFrom: draft.dateFrom || undefined,
      dateTo: draft.dateTo || undefined,
      minSalary: draft.minSalary !== "" ? Number(draft.minSalary) : undefined,
      maxSalary: draft.maxSalary !== "" ? Number(draft.maxSalary) : undefined,
      tagIds: draft.tagIds?.length ? draft.tagIds : undefined,
      q: draft.q || undefined,
    });
  };

  const handleClear = () => {
    const cleared = {
      statuses: [],
      modes: [],
      dateFrom: "",
      dateTo: "",
      minSalary: "",
      maxSalary: "",
      tagIds: [],
      q: "",
    };
    setDraft(cleared);
    onSubmit?.({}); // clears filters → table refetches
  };

  return (
    <form className="filters" onSubmit={handleSubmit}>
      <label>
        Status
        <select
          multiple
          value={draft.statuses}
          onChange={(e) => update({ statuses: [...e.target.selectedOptions].map(o => o.value) })}
        >
          {STATUS_VALUES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <label>
        Mode
        <select
          multiple
          value={draft.modes}
          onChange={(e) => update({ modes: [...e.target.selectedOptions].map(o => o.value) })}
        >
          {MODE_VALUES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>

      <label>
        From
        <input type="date" value={draft.dateFrom} onChange={(e)=>update({dateFrom:e.target.value})}/>
      </label>
      <label>
        To
        <input type="date" value={draft.dateTo} onChange={(e)=>update({dateTo:e.target.value})}/>
      </label>

      <label>
        Min $
        <input type="number" min="0" value={draft.minSalary} onChange={(e)=>update({minSalary:e.target.value})}/>
      </label>
      <label>
        Max $
        <input type="number" min="0" value={draft.maxSalary} onChange={(e)=>update({maxSalary:e.target.value})}/>
      </label>

      <label style={{flex:1}}>
        Search
        <input type="search" placeholder="Company or Position" value={draft.q} onChange={(e)=>update({q:e.target.value})}/>
      </label>

      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button type="button" onClick={handleClear}>Clear</button>
        <button type="submit">Apply</button>
      </div>
    </form>
  );
}


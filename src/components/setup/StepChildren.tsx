"use client";

import { useState } from "react";
import { removeChild, saveChild } from "@/app/app/setup/actions";
import { Avatar } from "@/components/app/Avatar";
import { formatHu } from "@/lib/phone";
import { btn, cx, Empty, inputCls, Label, useSetupAction } from "./ui";

type Kid = { id: string; name: string; phone: string };

export function StepChildren({ kids, address }: { kids: Kid[]; address: string }) {
  const { pending, run, toast } = useSetupAction();
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: "", phone: "" });
  const [form, setForm] = useState({ name: "", phone: "" });

  return (
    <div className="flex flex-col gap-5">
      {kids.length ? (
        <ul className="m-0 flex list-none flex-col p-0">
          {kids.map((k) => (
            <li key={k.id} className="border-t border-black/5 py-3 first:border-t-0">
              {editing === k.id ? (
                <form
                  className="flex flex-wrap items-end gap-3"
                  onSubmit={(e) => { e.preventDefault(); run(() => saveChild({ id: k.id, ...edit }), (r) => r.ok && setEditing(null)); }}
                >
                  <Avatar name={edit.name || k.name} />
                  <Label text="Child’s name" className="min-w-[150px] flex-1"><input className={inputCls} required value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Label>
                  <Label text="Mobile phone (optional)" className="min-w-[170px] flex-1">
                    <input className={inputCls} type="tel" placeholder="+36 70 555 0101" value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} onBlur={() => setEdit({ ...edit, phone: formatHu(edit.phone) })} />
                  </Label>
                  <div className="flex gap-2">
                    <button type="button" className={cx(btn.base, btn.ghost, btn.sm)} onClick={() => setEditing(null)}>Cancel</button>
                    <button disabled={pending} className={cx(btn.base, btn.pri, btn.sm)}>Save</button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-3">
                  <Avatar name={k.name} />
                  <div className="flex min-w-0 grow flex-col">
                    <b className="text-ink">{k.name}</b>
                    <span className="truncate text-sm text-ink-3">{k.phone || "No phone"} · {address || "Home address"}</span>
                  </div>
                  <button type="button" className={cx(btn.base, btn.ghost, btn.sm)} onClick={() => { setEditing(k.id); setEdit({ name: k.name, phone: k.phone }); }} aria-label={`Edit ${k.name}`}>
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => removeChild(k.id))}
                    aria-label={`Remove ${k.name}`}
                    className={cx(btn.base, btn.sm, "bg-transparent text-err hover:bg-err-bg")}
                  >
                    Remove
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <Empty>No children yet</Empty>
      )}
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={(e) => { e.preventDefault(); run(() => saveChild(form), (r) => r.ok && setForm({ name: "", phone: "" })); }}
      >
        <Label text="Child’s name" className="min-w-[160px] flex-[2]"><input className={inputCls} required placeholder="Bence" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Label>
        <Label text="Mobile phone (optional)" className="min-w-[160px] flex-[2]">
          <input className={inputCls} type="tel" placeholder="+36 70 555 0101" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} onBlur={() => setForm({ ...form, phone: formatHu(form.phone) })} />
        </Label>
        <button disabled={pending} className={cx(btn.base, btn.sec, "min-h-12")}>+ Add child</button>
      </form>
      <p className="m-0 text-xs text-ink-3">Children never get their own SharePa account. Only you and the parents you ride with see their names.</p>
      {toast}
    </div>
  );
}

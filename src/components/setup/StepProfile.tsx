"use client";

import { useActionState, useState } from "react";
import { saveProfile } from "@/app/app/setup/actions";
import type { SetupData, PickupPoint } from "@/lib/data/setup";
import { formatHu } from "@/lib/phone";
import { FormMessage } from "@/components/ui/form";
import { btn, cx, inputCls, Label } from "./ui";
import { AddressField, type PlaceValue } from "@/components/map/MapPicker";

/** Step 4. The footer's Continue button submits this form (id "step-form"). */
export function StepProfile({ me, next }: { me: SetupData["me"]; next?: string }) {
  const [state, action] = useActionState(saveProfile, undefined);
  const [home, setHome] = useState<PlaceValue>({ address: me.address, lat: me.homeLat, lng: me.homeLng });
  const address = home.address;
  const [points, setPoints] = useState<PickupPoint[]>(me.pickupPoints);
  const [pick, setPick] = useState(me.defaultPickup);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{ name: string } & PlaceValue>({ name: "", address: "" });
  const phoneBlur = (e: React.FocusEvent<HTMLInputElement>) => (e.target.value = formatHu(e.target.value));

  const addPoint = () => {
    if (!draft.name.trim() || !draft.address.trim()) return;
    const p: PickupPoint = { id: `p-${Date.now().toString(36)}`, name: draft.name.trim(), address: draft.address.trim(), lat: draft.lat ?? null, lng: draft.lng ?? null };
    setPoints([...points, p]);
    setPick(p.id);
    setDraft({ name: "", address: "" });
    setAdding(false);
  };

  return (
    <form id="step-form" action={action} className="flex flex-col gap-5">
      {next && <input type="hidden" name="next" value={next} />}
      <FormMessage error={state?.error} />
      <input type="hidden" name="pickupPoints" value={JSON.stringify(points)} />
      <input type="hidden" name="defaultPickup" value={pick} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Label text="Full name"><input className={inputCls} name="name" defaultValue={me.name} autoComplete="name" required /></Label>
        <Label text="Email">
          <input className={cx(inputCls, "cursor-not-allowed text-ink-3")} value={me.email} readOnly aria-describedby="email-hint" />
          <span id="email-hint" className="text-xs font-normal text-ink-3">Your login email. Changing it comes with the Profile page.</span>
        </Label>
        <Label text="Phone number"><input className={inputCls} name="phone" type="tel" placeholder="+36 30 123 4567" defaultValue={me.phone} autoComplete="tel" onBlur={phoneBlur} /></Label>
        <AddressField label="Home address" name="address" value={home} onChange={setHome} placeholder="Fehérvári út 41, 1117 Budapest" title="Find your home address" inputClassName={inputCls} />
        <Label text="Emergency contact name"><input className={inputCls} name="emergencyName" placeholder="Gergő Molnár" defaultValue={me.emergencyName} autoComplete="off" /></Label>
        <Label text="Emergency contact phone"><input className={inputCls} name="emergencyPhone" type="tel" placeholder="+36 20 987 6543" defaultValue={me.emergencyPhone} autoComplete="off" onBlur={phoneBlur} /></Label>
        <div className="flex flex-col gap-3 sm:col-span-2">
          <Label text="Default pick-up point">
            <select
              className={inputCls}
              value={adding ? "__add" : pick}
              onChange={(e) => (e.target.value === "__add" ? setAdding(true) : (setAdding(false), setPick(e.target.value)))}
            >
              <option value="home">Home — {address || "your home address"}</option>
              {points.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.address}</option>)}
              <option value="__add">+ Add new pick-up point</option>
            </select>
          </Label>
          {adding && (
            <div className="grid items-end gap-3 rounded-[20px] bg-canvas p-4 sm:grid-cols-[1fr_1.4fr_auto]">
              <Label text="Name"><input className={cx(inputCls, "bg-white")} placeholder="Bikás park" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Label>
              <AddressField
                label="Address"
                value={draft}
                onChange={(v) => setDraft({ ...draft, ...v })}
                placeholder="Bartók Béla út 152, Budapest"
                title="Choose the pick-up point"
                inputClassName={cx(inputCls, "bg-white")}
              />
              <div className="flex gap-2">
                <button type="button" className={cx(btn.base, btn.ghost)} onClick={() => setAdding(false)}>Cancel</button>
                <button type="button" className={cx(btn.base, btn.pri)} disabled={!draft.name.trim() || !draft.address.trim()} onClick={addPoint}>Save</button>
              </div>
            </div>
          )}
          {points.length > 0 && (
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {points.map((p) => (
                <li key={p.id} className="flex items-center gap-1 rounded-full bg-p100 py-1 pr-1 pl-3 text-xs font-semibold text-p600">
                  {p.name}
                  <button
                    type="button"
                    aria-label={`Remove ${p.name}`}
                    onClick={() => { setPoints(points.filter((x) => x.id !== p.id)); if (pick === p.id) setPick("home"); }}
                    className="grid h-6 w-6 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-p600 hover:bg-white"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <p className="m-0 text-sm text-ink-3">The default pick-up point is pre-filled whenever you offer a ride. You can change it per ride.</p>
    </form>
  );
}

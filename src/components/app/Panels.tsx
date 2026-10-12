import type { HomeData } from "@/lib/data/home";
import { categoryStyle } from "@/lib/categories";
import { Avatar, Card, CardTitle, Icons } from "./ui";

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className="mt-4 mb-0 rounded-2xl bg-canvas px-4 py-6 text-center text-sm text-ink-3">{children}</p>
);

export function Panels({ data }: { data: HomeData }) {
  return (
    <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,320px),1fr))]">
      <Card label="Friends">
        <CardTitle icon={Icons.group} aside={<span className="text-sm text-ink-3">{data.friends.length}</span>}>Friends</CardTitle>
        {data.friends.length ? (
          <ul className="m-0 mt-3 list-none p-0">
            {data.friends.map((f) => (
              <li key={f.id} className="flex items-center gap-3 border-t border-black/5 py-3 first:border-t-0">
                <Avatar name={f.name} />
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="font-semibold text-ink">{f.name}</span>
                  <div className="flex flex-wrap gap-1">
                    {f.labels.length ? (
                      f.labels.map((l) => (
                        <span key={l} className="rounded-full bg-p100 px-2.5 py-0.5 text-xs font-semibold text-p600">{l}</span>
                      ))
                    ) : (
                      <span className="text-xs text-ink-3">no label</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No friends yet. Add parents from your kids&apos; class or club to share rides.</Empty>
        )}
      </Card>

      <Card label="Children">
        <CardTitle icon={Icons.child}>Children</CardTitle>
        {data.children.length ? (
          <ul className="m-0 mt-3 list-none p-0">
            {data.children.map((c) => {
              const n = data.ridesPerChild[c.id] ?? 0;
              return (
                <li key={c.id} className="flex items-center gap-3 border-t border-black/5 py-3 first:border-t-0">
                  <Avatar name={c.name} />
                  <span className="grow font-semibold text-ink">{c.name}</span>
                  <span className="text-sm text-ink-3">{n} upcoming ride{n === 1 ? "" : "s"}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>No children yet. Add the kids you organise rides for.</Empty>
        )}
      </Card>

      <Card label="Activities">
        <CardTitle icon={Icons.tag}>Activities</CardTitle>
        {data.activities.length ? (
          <ul className="m-0 mt-3 list-none p-0">
            {data.activities.map((a) => {
              const s = categoryStyle(a.category);
              return (
                <li key={a.label} className="flex items-center gap-3 border-t border-black/5 py-3 first:border-t-0">
                  <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold" style={{ background: s.bg, color: s.fg }}>
                    {(a.category ?? "?")[0]}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-semibold text-ink">{a.label}</span>
                    <span className="text-sm text-ink-3">{a.perWeek} event{a.perWeek === 1 ? "" : "s"} a week</span>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <Empty>No activities yet. Activities are the categories you put on calendar events, like Sport or Music.</Empty>
        )}
      </Card>
    </div>
  );
}

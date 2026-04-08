interface DeviceStatusBadgeProps {
  state: string;
  domain: string;
}

export function DeviceStatusBadge({ state, domain }: DeviceStatusBadgeProps) {
  const isOn = state === "on" || state === "unlocked" || state === "playing" || state === "open";
  const isOff = state === "off" || state === "locked" || state === "idle" || state === "closed";
  const isUnavailable = state === "unavailable" || state === "unknown";

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
        isUnavailable
          ? "bg-slate-700 text-slate-500"
          : isOn
          ? "bg-emerald-500/20 text-emerald-400"
          : isOff
          ? "bg-slate-700 text-slate-400"
          : "bg-amber-500/20 text-amber-400"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isUnavailable ? "bg-slate-500" : isOn ? "bg-emerald-400" : "bg-slate-500"
        }`}
      />
      {state}
    </span>
  );
}

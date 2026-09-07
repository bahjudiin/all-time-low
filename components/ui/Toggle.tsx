"use client";

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      aria-label={typeof label === "string" && label ? undefined : "Toggle"}
      className={`inline-flex items-center gap-2 text-[11px] ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      <span
        className={`relative inline-flex w-8 h-[18px] rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-surface-raised"
        }`}
      >
        <span
          className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white dark:bg-surface-base shadow transition-transform ${
            checked ? "translate-x-[16px]" : "translate-x-[2px]"
          }`}
        />
      </span>
      {label}
    </button>
  );
}
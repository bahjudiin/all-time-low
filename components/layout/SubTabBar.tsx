"use client";

interface SubTabBarProps<T extends string> {
  tabs: { id: T; label: string; onClick?: () => void }[];
  active: T;
  onChange: (id: T) => void;
}

export function SubTabBar<T extends string>({
  tabs,
  active,
  onChange,
}: SubTabBarProps<T>) {
  return (
    <div className="px-4 md:px-6 py-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
      <div className="flex items-center gap-1.5 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              onChange(tab.id);
              tab.onClick?.();
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors whitespace-nowrap ${
              active === tab.id
                ? "bg-blue-600 text-white"
                : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
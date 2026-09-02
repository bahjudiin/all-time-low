import type { CoinMarket } from "@/types/coin";

interface CoinCellProps {
  coin: CoinMarket;
}

export function CoinCell({ coin }: CoinCellProps) {
  return (
    <div className="flex items-center gap-3 min-w-[180px]">
      <img
        src={coin.image}
        alt={coin.name}
        className="w-6 h-6 rounded-full flex-shrink-0"
        loading="lazy"
      />
      <div className="flex flex-col">
        <span className="font-medium text-sm leading-tight text-zinc-900 dark:text-zinc-100">
          {coin.name}
        </span>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 uppercase">
          {coin.symbol}
        </span>
      </div>
    </div>
  );
}

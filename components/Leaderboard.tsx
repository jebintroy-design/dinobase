'use client';

import { useReadContract } from 'wagmi';
import { base } from 'wagmi/chains';
import { LEADERBOARD_ADDRESS, leaderboardAbi } from '@/config/leaderboard';

const ZERO = '0x0000000000000000000000000000000000000000';

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function Leaderboard() {
  const { data, error, isLoading } = useReadContract({
    address: LEADERBOARD_ADDRESS,
    abi: leaderboardAbi,
    functionName: 'getLeaderboard',
    chainId: base.id,
  });
  const { data: total } = useReadContract({
    address: LEADERBOARD_ADDRESS,
    abi: leaderboardAbi,
    functionName: 'totalSubmissions',
    chainId: base.id,
  });

  if (data === undefined && isLoading) {
    return (
      <section className="w-full font-mono text-black">
        <h2 className="text-sm font-bold tracking-widest mb-3">LEADERBOARD</h2>
        <p className="text-xs text-black/60">LOADING…</p>
      </section>
    );
  }

  if (data === undefined && error) {
    return (
      <section className="w-full font-mono text-black">
        <h2 className="text-sm font-bold tracking-widest mb-3">LEADERBOARD</h2>
        <p className="text-xs text-black/60">Could not load leaderboard.</p>
      </section>
    );
  }

  if (!data) return null;

  const ranked = data.map((e, i) => ({
    player: e.player,
    score: e.score,
    rank: i + 1,
  }));
  const entries = ranked.filter((e) => e.player.toLowerCase() !== ZERO);

  return (
    <section className="w-full font-mono text-black">
      <h2 className="text-sm font-bold tracking-widest mb-3">LEADERBOARD</h2>
      {entries.length === 0 ? (
        <p className="text-xs text-black/60">No scores yet. Be the first onchain.</p>
      ) : (
        <ol className="flex flex-col">
          {entries.map((e) => (
            <li
              key={e.rank}
              className="flex items-center gap-4 border-b border-black/10 py-2"
            >
              <span className="text-xs text-black/50 w-8 tabular-nums">
                #{e.rank.toString().padStart(2, '0')}
              </span>
              <span className="text-xs flex-1 truncate">{truncate(e.player)}</span>
              <span className="text-sm font-bold tabular-nums">
                {e.score.toString()}
              </span>
            </li>
          ))}
        </ol>
      )}
      {total !== undefined && (
        <p className="text-[10px] tracking-widest text-black/50 mt-3">
          {total.toString()} SCORES SUBMITTED ONCHAIN
        </p>
      )}
    </section>
  );
}

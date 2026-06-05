'use client';

import { useEffect } from 'react';
import { base } from 'wagmi/chains';
import {
  useChainId,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { LEADERBOARD_ADDRESS, leaderboardAbi } from '@/config/leaderboard';

export default function SubmitScore({ score }: { score: number }) {
  const chainId = useChainId();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const {
    writeContract,
    data: hash,
    isPending: isSigning,
    error: writeError,
  } = useWriteContract();
  const {
    isLoading: isMining,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isSuccess) return;
    queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey;
        if (!Array.isArray(key) || key[0] !== 'readContract') return false;
        const params = key[1] as
          | { address?: string; functionName?: string }
          | undefined;
        if (!params) return false;
        const addr = typeof params.address === 'string' ? params.address.toLowerCase() : '';
        return (
          addr === LEADERBOARD_ADDRESS.toLowerCase() &&
          (params.functionName === 'getLeaderboard' ||
            params.functionName === 'bestScore' ||
            params.functionName === 'totalSubmissions')
        );
      },
    });
  }, [isSuccess, queryClient]);

  if (chainId !== base.id) {
    return (
      <button
        type="button"
        onClick={() => switchChain({ chainId: base.id })}
        disabled={isSwitching}
        className="font-mono text-sm tracking-wider px-5 py-3 bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50"
      >
        {isSwitching ? 'SWITCHING…' : 'SWITCH TO BASE'}
      </button>
    );
  }

  if (isSuccess && hash) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm font-bold tracking-wider text-black">
          SAVED ONCHAIN!
        </span>
        <a
          href={`https://basescan.org/tx/${hash}`}
          target="_blank"
          rel="noreferrer"
          className="font-mono text-xs tracking-wider underline text-black/70 hover:text-black"
        >
          VIEW TX →
        </a>
      </div>
    );
  }

  const label = isSigning
    ? 'CONFIRM IN WALLET…'
    : isMining
    ? 'CONFIRMING…'
    : `SUBMIT SCORE ${score}`;

  const err = writeError ?? receiptError;

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={() =>
          writeContract({
            address: LEADERBOARD_ADDRESS,
            abi: leaderboardAbi,
            functionName: 'submitScore',
            args: [BigInt(score)],
          })
        }
        disabled={isSigning || isMining}
        className="font-mono text-sm tracking-wider px-5 py-3 bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-white"
      >
        {label}
      </button>
      {err && (
        <p className="font-mono text-xs text-black/70 max-w-md break-words leading-snug">
          {err.message}
        </p>
      )}
    </div>
  );
}

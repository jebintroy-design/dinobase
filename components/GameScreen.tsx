'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAccount,
  useChainId,
  useReadContract,
  useSwitchChain,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi';
import { base } from 'wagmi/chains';
import { zeroAddress } from 'viem';
import { useQueryClient } from '@tanstack/react-query';
import DinoGame from './DinoGame';
import Leaderboard from './Leaderboard';
import ConnectWallet from './ConnectWallet';
import SubmitScore from './SubmitScore';
import {
  DEFAULT_CHARACTER_ID,
  isCharacterId,
  type CharacterId,
} from './characters';
import CharacterCycleButton from './CharacterCycleButton';
import { isUserRejection, shortErrorMessage } from './errors';
import { LEADERBOARD_ADDRESS, leaderboardAbi } from '@/config/leaderboard';
import { BUILDER_CODE_DATA_SUFFIX } from '@/config/wagmi';

type GameState = 'idle' | 'running' | 'gameOver';

const STORAGE_KEY = 'dinobase:character';

export default function GameScreen() {
  const [lastScore, setLastScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [startToken, setStartToken] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [character, setCharacter] = useState<CharacterId>(DEFAULT_CHARACTER_ID);

  // Read persisted character only after mount → no SSR hydration mismatch.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isCharacterId(saved)) setCharacter(saved);
    } catch {
      // localStorage unavailable; keep default
    }
  }, []);

  const handleSelectCharacter = useCallback(
    (id: CharacterId) => {
      if (gameState === 'running' || isStarting) return;
      setCharacter(id);
      try {
        window.localStorage.setItem(STORAGE_KEY, id);
      } catch {
        // ignore
      }
    },
    [gameState, isStarting],
  );

  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const onBase = chainId === base.id;
  const { switchChain, isPending: isSwitching } = useSwitchChain();

  const {
    writeContractAsync,
    data: startHash,
    error: startError,
    reset: resetStart,
  } = useWriteContract();

  const queryClient = useQueryClient();
  const { isSuccess: startConfirmed } = useWaitForTransactionReceipt({ hash: startHash });

  // Background: when the start tx mines, refresh the games-played counters.
  useEffect(() => {
    if (!startConfirmed) return;
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
          (params.functionName === 'gamesStarted' ||
            params.functionName === 'totalGamesStarted')
        );
      },
    });
  }, [startConfirmed, queryClient]);

  const onStartRequest = useCallback(async () => {
    if (!isConnected || !onBase || isStarting) return;
    setIsStarting(true);
    resetStart();
    try {
      await writeContractAsync({
        address: LEADERBOARD_ADDRESS,
        abi: leaderboardAbi,
        functionName: 'startGame',
        dataSuffix: BUILDER_CODE_DATA_SUFFIX,
      });
      // Broadcast succeeded — the tx hash is in `startHash` via wagmi state.
      // Start the run immediately; don't wait for onchain confirmation.
      setStartToken((t) => t + 1);
      setGameState('running');
    } catch {
      // Error surfaced via the hook's `error` state; stay in idle/gameOver.
    } finally {
      setIsStarting(false);
    }
  }, [isConnected, onBase, isStarting, resetStart, writeContractAsync]);

  // Remember most recent broadcast hash so we don't re-trigger on re-renders.
  const lastSeenHashRef = useRef<typeof startHash>(undefined);
  useEffect(() => {
    if (!startHash) return;
    lastSeenHashRef.current = startHash;
  }, [startHash]);

  const handleGameOver = useCallback((s: number) => {
    setLastScore(s);
    setGameState('gameOver');
  }, []);

  const { data: best } = useReadContract({
    address: LEADERBOARD_ADDRESS,
    abi: leaderboardAbi,
    functionName: 'bestScore',
    args: [address ?? zeroAddress],
    chainId: base.id,
    query: { enabled: !!address },
  });

  const { data: gamesPlayed } = useReadContract({
    address: LEADERBOARD_ADDRESS,
    abi: leaderboardAbi,
    functionName: 'gamesStarted',
    args: [address ?? zeroAddress],
    chainId: base.id,
    query: { enabled: !!address },
  });

  const canStart = isConnected && onBase && !isStarting;

  // A user-rejected signature isn't an error condition — they cancelled
  // intentionally. Hide it from the UI and let them retry naturally.
  const startRejected = isUserRejection(startError);
  const realStartError = startError && !startRejected ? startError : null;

  // Compute canvas overlay prompts based on gating state.
  let idlePrompt = 'PRESS SPACE OR TAP TO START';
  let gameOverPrompt = 'PRESS SPACE OR TAP TO RESTART';
  if (!isConnected) {
    idlePrompt = 'CONNECT WALLET TO PLAY';
    gameOverPrompt = 'CONNECT WALLET TO PLAY';
  } else if (!onBase) {
    idlePrompt = 'SWITCH TO BASE TO PLAY';
    gameOverPrompt = 'SWITCH TO BASE TO PLAY';
  } else if (isStarting) {
    idlePrompt = 'STARTING…';
    gameOverPrompt = 'STARTING…';
  } else if (realStartError) {
    idlePrompt = 'START FAILED — TAP TO RETRY';
    gameOverPrompt = 'START FAILED — TAP TO RETRY';
  }

  const selectionLocked = gameState === 'running' || isStarting;

  return (
    <div className="w-full max-w-[800px] mx-auto flex flex-col gap-6 sm:gap-8">
      <DinoGame
        characterId={character}
        startToken={startToken}
        canStart={canStart}
        idlePrompt={idlePrompt}
        gameOverPrompt={gameOverPrompt}
        onStartRequest={onStartRequest}
        onGameOver={handleGameOver}
      />

      <CharacterCycleButton
        current={character}
        disabled={selectionLocked}
        onCycle={handleSelectCharacter}
      />

      <section className="flex flex-col gap-3">
        <ConnectWallet />
        {isConnected && !onBase && (
          <button
            type="button"
            onClick={() => switchChain({ chainId: base.id })}
            disabled={isSwitching}
            className="self-start font-mono text-[11px] sm:text-base tracking-widest py-2 px-3 sm:py-4 sm:px-5 bg-black text-white border-2 border-black active:bg-white active:text-black transition-colors disabled:opacity-50"
          >
            {isSwitching ? 'SWITCHING…' : 'SWITCH TO BASE'}
          </button>
        )}
        {isConnected && onBase && (best !== undefined || gamesPlayed !== undefined) && (
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-baseline gap-y-1 sm:gap-x-8 font-mono text-sm text-black">
            {best !== undefined && (
              <span>
                YOUR ONCHAIN BEST:{' '}
                <span className="font-bold text-base">{best.toString()}</span>
              </span>
            )}
            {gamesPlayed !== undefined && (
              <span>
                GAMES PLAYED:{' '}
                <span className="font-bold text-base">{gamesPlayed.toString()}</span>
              </span>
            )}
          </div>
        )}
        {realStartError && (
          <p className="font-mono text-xs text-black/70 break-words leading-snug">
            START FAILED — {shortErrorMessage(realStartError)}
          </p>
        )}
      </section>

      {lastScore > 0 && gameState !== 'running' && (
        <section className="flex flex-col gap-4 border-2 border-black p-4 sm:p-5">
          <h3 className="font-mono text-xs font-bold tracking-widest text-black">
            LAST RUN — {lastScore}
          </h3>
          <SubmitScore key={lastScore} score={lastScore} />
        </section>
      )}

      <Leaderboard />
    </div>
  );
}

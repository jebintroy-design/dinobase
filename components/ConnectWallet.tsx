'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function ConnectWallet() {
  const { address, isConnected, isConnecting, isReconnecting, isDisconnected } = useAccount();
  const { connectors, connect, isPending, variables } = useConnect();
  const { disconnect } = useDisconnect();

  if (isReconnecting) {
    return (
      <div className="font-mono text-xs tracking-wider text-black/60">
        RECONNECTING WALLET…
      </div>
    );
  }

  if (isConnecting) {
    return (
      <div className="font-mono text-xs tracking-wider text-black/60">
        CONNECTING WALLET…
      </div>
    );
  }

  if (isConnected && address) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm font-bold tracking-wider text-black">
          {truncate(address)}
        </span>
        <button
          type="button"
          onClick={() => disconnect()}
          className="font-mono text-xs tracking-wider px-3 py-1.5 border-2 border-black text-black hover:bg-black hover:text-white transition-colors"
        >
          DISCONNECT
        </button>
      </div>
    );
  }

  // isDisconnected (or initial)
  return (
    <div className="flex flex-wrap gap-2">
      {!isDisconnected && (
        <span className="sr-only">Disconnected</span>
      )}
      {connectors.map((c) => {
        const pendingThis = isPending && variables?.connector === c;
        return (
          <button
            key={c.uid}
            type="button"
            onClick={() => connect({ connector: c })}
            disabled={isPending}
            className="font-mono text-xs tracking-wider px-4 py-2 bg-black text-white border-2 border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 disabled:hover:bg-black disabled:hover:text-white"
          >
            {pendingThis ? 'CONNECTING…' : `CONNECT ${c.name.toUpperCase()}`}
          </button>
        );
      })}
    </div>
  );
}

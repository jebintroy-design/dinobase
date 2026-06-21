import { http, createConfig, createStorage, cookieStorage } from 'wagmi';
import { base } from 'wagmi/chains';
import { baseAccount, injected } from 'wagmi/connectors';

// ERC-8021 Schema 0 attribution suffix for Base Build builder code "bc_5f8e5q5h".
// Layout: utf8(codes) | len(0x0b=11) | schema(0x00) | 16-byte magic (0x8021 x8).
export const BUILDER_CODE_DATA_SUFFIX =
  '0x62635f35663865357135680b0080218021802180218021802180218021' as const;

export const wagmiConfig = createConfig({
  chains: [base],
  connectors: [
    injected(),
    baseAccount({
      appName: 'Dino Base',
      preference: { attribution: { dataSuffix: BUILDER_CODE_DATA_SUFFIX } },
    }),
  ],
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  transports: {
    [base.id]: http('https://base-rpc.publicnode.com'),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig;
  }
}

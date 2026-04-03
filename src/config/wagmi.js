import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { http, fallback } from 'wagmi';
import { mainnet, sepolia, polygon, arbitrum, optimism, base } from 'wagmi/chains';

// Custom Hedera chain configuration
const hederaTestnet = {
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: { http: ['https://testnet.hashio.io/api'] },
    public: { http: ['https://testnet.hashio.io/api'] },
  },
  blockExplorers: {
    default: { name: 'HashScan', url: 'https://hashscan.io/testnet' },
  },
  testnet: true,
};

const hederaMainnet = {
  id: 295,
  name: 'Hedera Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: { http: ['https://mainnet.hashio.io/api'] },
    public: { http: ['https://mainnet.hashio.io/api'] },
  },
  blockExplorers: {
    default: { name: 'HashScan', url: 'https://hashscan.io/mainnet' },
  },
};

export const config = getDefaultConfig({
  appName: 'AGFoods',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  // Sepolia first as it's where the traceability contract is deployed
  chains: [sepolia, hederaTestnet, hederaMainnet, mainnet, polygon, arbitrum, optimism, base],
  ssr: false,
  transports: {
    // Use CORS-friendly public RPCs for Sepolia (primary chain for traceability contract)
    [sepolia.id]: fallback([
      http('https://rpc.ankr.com/eth_sepolia'),
      http('https://ethereum-sepolia-rpc.publicnode.com'),
      http('https://eth-sepolia.public.blastapi.io'),
      http('https://sepolia.drpc.org'),
    ]),
    // Hedera chains
    [hederaTestnet.id]: http('https://testnet.hashio.io/api'),
    [hederaMainnet.id]: http('https://mainnet.hashio.io/api'),
    // Other chains use defaults (handled by RainbowKit/WalletConnect)
    [mainnet.id]: fallback([
      http('https://rpc.ankr.com/eth'),
      http('https://ethereum-rpc.publicnode.com'),
    ]),
    [polygon.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
  },
});

export { hederaTestnet, hederaMainnet };

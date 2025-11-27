import { useAccount, useBalance, useWalletClient, usePublicClient, useDisconnect, useChainId } from 'wagmi';
import { useMemo } from 'react';
import SmartContractUtils from '../components/smartContractUtils';

export const useWallet = () => {
  const { address, isConnected, isConnecting, isDisconnected, chain } = useAccount();
  const { data: balance, isLoading: isBalanceLoading } = useBalance({ address });
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  // Create contract utils instance
  const contractUtils = useMemo(() => {
    if (walletClient && publicClient && address) {
      return new SmartContractUtils(walletClient, publicClient, address);
    }
    return null;
  }, [walletClient, publicClient, address]);

  // Helper functions
  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatBalance = () => {
    if (!balance) return '0';
    return `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}`;
  };

  return {
    // Connection state
    address,
    isConnected,
    isConnecting,
    isDisconnected,
    
    // Chain info
    chain,
    chainId,
    chainName: chain?.name || 'Unknown',
    
    // Balance
    balance: balance?.formatted || '0',
    balanceSymbol: balance?.symbol || '',
    isBalanceLoading,
    formattedBalance: formatBalance(),
    
    // Clients
    walletClient,
    publicClient,
    contractUtils,
    
    // Actions
    disconnect,
    
    // Helpers
    formatAddress,
    shortAddress: formatAddress(address),
  };
};

export default useWallet;

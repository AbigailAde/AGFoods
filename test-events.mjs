const { ethers } = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('https://rpc.ankr.com/eth_sepolia');
  const contractAddress = '0x5647b12581b4e717a2781aeb3627a8c191ed40cd';
  const abi = [
    "event BatchCreated(bytes32 indexed batchId, address indexed farmer, uint256 timestamp)"
  ];
  
  const contract = new ethers.Contract(contractAddress, abi, provider);
  
  // Get events from the last 1000 blocks
  const currentBlock = await provider.getBlockNumber();
  const events = await contract.queryFilter('BatchCreated', currentBlock - 50000, currentBlock);
  
  for (const event of events) {
    console.log('BatchCreated:', event.args.batchId, event.args.farmer);
  }
}

main().catch(console.error);

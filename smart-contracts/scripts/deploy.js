const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Starting deployment of PlantainTraceability contract...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📍 Deploying with account:", deployer.address);
  
  // Get balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy the contract
  console.log("📦 Deploying PlantainTraceability...");
  const PlantainTraceability = await hre.ethers.getContractFactory("PlantainTraceability");
  const contract = await PlantainTraceability.deploy();

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("\n✅ PlantainTraceability deployed successfully!");
  console.log("📍 Contract Address:", contractAddress);
  
  // Get deployment transaction
  const deployTx = contract.deploymentTransaction();
  console.log("🔗 Transaction Hash:", deployTx.hash);
  
  // Get network info
  const network = await hre.ethers.provider.getNetwork();
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId.toString(), ")");

  // Generate explorer links
  let explorerUrl = "";
  if (network.chainId === 11155111n) {
    explorerUrl = `https://sepolia.etherscan.io/address/${contractAddress}`;
    console.log("\n🔍 View on Etherscan:", explorerUrl);
    console.log("🔍 Transaction:", `https://sepolia.etherscan.io/tx/${deployTx.hash}`);
  } else if (network.chainId === 296n) {
    explorerUrl = `https://hashscan.io/testnet/contract/${contractAddress}`;
    console.log("\n🔍 View on HashScan:", explorerUrl);
  }

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.chainId.toString(),
    contractAddress: contractAddress,
    transactionHash: deployTx.hash,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    explorerUrl: explorerUrl
  };

  // Save to deployments folder
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `${network.name}-${network.chainId}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n📁 Deployment info saved to:", deploymentFile);

  // Copy ABI to frontend
  const artifactPath = path.join(__dirname, "../artifacts/contracts/PlantainTraceability.sol/PlantainTraceability.json");
  const frontendAbiPath = path.join(__dirname, "../../src/contracts/PlantainTraceabilityABI.json");
  
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    const abiData = {
      abi: artifact.abi,
      address: contractAddress,
      network: network.name,
      chainId: network.chainId.toString(),
      deployedAt: deploymentInfo.deployedAt
    };
    
    // Ensure directory exists
    const frontendDir = path.dirname(frontendAbiPath);
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }
    
    fs.writeFileSync(frontendAbiPath, JSON.stringify(abiData, null, 2));
    console.log("📁 ABI copied to frontend:", frontendAbiPath);
  }

  // Verification instructions
  console.log("\n" + "=".repeat(60));
  console.log("📋 NEXT STEPS:");
  console.log("=".repeat(60));
  console.log("\n1. Verify the contract on Etherscan:");
  console.log(`   npx hardhat verify --network ${network.name} ${contractAddress}`);
  console.log("\n2. Update your frontend .env with:");
  console.log(`   VITE_TRACEABILITY_CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\n3. The ABI has been automatically copied to src/contracts/");
  console.log("=".repeat(60));

  return {
    address: contractAddress,
    transactionHash: deployTx.hash,
    explorerUrl: explorerUrl
  };
}

main()
  .then((result) => {
    console.log("\n🎉 Deployment completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Deployment failed:", error);
    process.exit(1);
  });

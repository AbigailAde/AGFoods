import React, { useState } from "react";
import { ChevronRight, Leaf, Factory, Truck, ShoppingCart, QrCode, Shield, Users, TrendingUp } from 'lucide-react';
import MyGroup from "./components/MyGroup.jsx";
import walletConnectFcn from "./components/hedera/walletConnect.js";
import tokenCreateFcn from "./components/hedera/tokenCreate.js";
import tokenMintFcn from "./components/hedera/tokenMint";
import contractDeployFcn from "./components/hedera/contractDeploy.js";
import contractExecuteFcn from "./components/hedera/contractExecute.js";

function App() {
	const [walletData, setWalletData] = useState();
	const [accountId, setAccountId] = useState();
	const [tokenId, setTokenId] = useState();
	const [tokenSupply, setTokenSupply] = useState();
	const [contractId, setContractId] = useState();

	const [connectTextSt, setConnectTextSt] = useState("🔌 Connect here...");
	const [createTextSt, setCreateTextSt] = useState("");
	const [mintTextSt, setMintTextSt] = useState("");
	const [contractTextSt, setContractTextSt] = useState();
	const [trasnferTextSt, setTransferTextSt] = useState();

	const [connectLinkSt, setConnectLinkSt] = useState("");
	const [createLinkSt, setCreateLinkSt] = useState("");
	const [mintLinkSt, setMintLinkSt] = useState("");
	const [contractLinkSt, setContractLinkSt] = useState();
	const [trasnferLinkSt, setTransferLinkSt] = useState();

	const [selectedUserType, setSelectedUserType] = useState(null);

  const userTypes = [
    {
      id: 'farmer',
      title: 'Farmer',
      description: 'Register your farm, create product batches, and track your plantain from harvest',
      icon: <Leaf className="w-8 h-8 text-green-600" />,
      color: 'from-green-500 to-emerald-600',
      features: ['Register harvest batches', 'Upload farm certifications', 'Track product journey']
    },
    {
      id: 'processor',
      title: 'Processor',
      description: 'Convert plantain to flour, add quality checks, and maintain processing records',
      icon: <Factory className="w-8 h-8 text-blue-600" />,
      color: 'from-blue-500 to-indigo-600',
      features: ['Quality control tracking', 'Processing documentation', 'Batch management']
    },
    {
      id: 'distributor',
      title: 'Distributor',
      description: 'Manage logistics, update delivery status, and handle wholesale/retail operations',
      icon: <Truck className="w-8 h-8 text-purple-600" />,
      color: 'from-purple-500 to-violet-600',
      features: ['Logistics tracking', 'Inventory management', 'Supply chain updates']
    },
    {
      id: 'consumer',
      title: 'Consumer',
      description: 'Scan QR codes to verify product authenticity and trace your plantain flour back to the farm',
      icon: <QrCode className="w-8 h-8 text-orange-600" />,
      color: 'from-orange-500 to-red-600',
      features: ['QR code scanning', 'Product verification', 'Farm-to-table journey']
    }
  ];

  const handleUserTypeSelect = (userType) => {
    setSelectedUserType(userType);
    // In a real app, this would navigate to the specific dashboard
    console.log(`Navigating to ${userType} dashboard...`);
  };

  const features = [
    {
      icon: <Shield className="w-6 h-6 text-green-600" />,
      title: 'Blockchain Security',
      description: 'Immutable records ensure product authenticity and prevent fraud'
    },
    {
      icon: <Users className="w-6 h-6 text-blue-600" />,
      title: 'Complete Traceability',
      description: 'Track every step from farm to consumer with transparent supply chain'
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-purple-600" />,
      title: 'Quality Assurance',
      description: 'Real-time quality checks and certifications at every stage'
    }
  ];

	async function connectWallet() {
		if (accountId !== undefined) {
			setConnectTextSt(`🔌 Account ${accountId} already connected ⚡ ✅`);
		} else {
			const wData = await walletConnectFcn();
			wData[0].pairingEvent.once((pairingData) => {
				pairingData.accountIds.forEach((id) => {
					setAccountId(id);
					console.log(`- Paired account id: ${id}`);
					setConnectTextSt(`🔌 Account ${id} connected ⚡ ✅`);
					setConnectLinkSt(`https://hashscan.io/testnet/account/${id}`);
				});
			});
			setWalletData(wData);
			setCreateTextSt();
		}
	}

	async function tokenCreate() {
		if (tokenId !== undefined) {
			setCreateTextSt(`You already have token ${tokenId} ✅`);
		} else if (accountId === undefined) {
			setCreateTextSt(`🛑 Connect a wallet first! 🛑`);
		} else {
			const [tId, supply, txIdRaw] = await tokenCreateFcn(walletData, accountId);
			setTokenId(tId);
			setTokenSupply(supply);
			setCreateTextSt(`Successfully created token with ID: ${tId} ✅`);
			setMintTextSt();
			setContractTextSt();
			setTransferTextSt();
			const txId = prettify(txIdRaw);
			setCreateLinkSt(`https://hashscan.io/testnet/transaction/${txId}`);
		}
	}

	async function tokenMint() {
		if (tokenId === undefined) {
			setMintTextSt("🛑 Create a token first! 🛑");
		} else {
			const [supply, txIdRaw] = await tokenMintFcn(walletData, accountId, tokenId);
			setTokenSupply(supply);
			setMintTextSt(`Supply of token ${tokenId} is ${supply}! ✅`);
			const txId = prettify(txIdRaw);
			setMintLinkSt(`https://hashscan.io/testnet/transaction/${txId}`);
		}
	}

	async function contractDeploy() {
		if (tokenId === undefined) {
			setContractTextSt("🛑 Create a token first! 🛑");
		} else if (contractId !== undefined) {
			setContractTextSt(`You already have contract ${contractId} ✅`);
		} else {
			const [cId, txIdRaw] = await contractDeployFcn(walletData, accountId, tokenId);
			setContractId(cId);
			setContractTextSt(`Successfully deployed smart contract with ID: ${cId} ✅`);
			setTransferTextSt();
			const txId = prettify(txIdRaw);
			setContractLinkSt(`https://hashscan.io/testnet/transaction/${txId}`);
		}
	}

	async function contractExecute() {
		if (tokenId === undefined || contractId === undefined) {
			setTransferTextSt("🛑 Create a token AND deploy a contract first! 🛑");
		} else {
			const txIdRaw = await contractExecuteFcn(walletData, accountId, tokenId, contractId);
			setTransferTextSt(`🎉🎉🎉 Great job! You completed the demo 🎉🎉🎉`);
			const txId = prettify(txIdRaw);
			setTransferLinkSt(`https://hashscan.io/testnet/transaction/${txId}`);
		}
	}

	function prettify(txIdRaw) {
		const a = txIdRaw.split("@");
		const b = a[1].split(".");
		return `${a[0]}-${b[0]}-${b[1]}`;
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-yellow-50">
			<h1 className="header bg-white">Let's build a dapp on Hedera!</h1>
			<MyGroup
				fcn={connectWallet}
				buttonLabel={"Connect Wallet"}
				text={connectTextSt}
				link={connectLinkSt}
			/>
			<h2 className="sub-header">AGFoods Demo</h2>

			<MyGroup
				fcn={tokenCreate}
				buttonLabel={"Create New Token"}
				text={createTextSt}
				link={createLinkSt}
			/>

			<MyGroup
				fcn={tokenMint}
				buttonLabel={"Mint 100 New Tokens"}
				text={mintTextSt}
				link={mintLinkSt}
			/>

			<MyGroup
				fcn={contractDeploy}
				buttonLabel={"Deploy Contract"}
				text={contractTextSt}
				link={contractLinkSt}
			/>

			<MyGroup
				fcn={contractExecute}
				buttonLabel={"Transfer Tokens"}
				text={trasnferTextSt}
				link={trasnferLinkSt}
			/>
			<div className="logo">
				<div className="symbol">
					<svg
						id="Layer_1"
						data-name="Layer 1"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 40 40"
					>
						<path d="M20 0a20 20 0 1 0 20 20A20 20 0 0 0 20 0" className="circle"></path>
						<path
							d="M28.13 28.65h-2.54v-5.4H14.41v5.4h-2.54V11.14h2.54v5.27h11.18v-5.27h2.54zm-13.6-7.42h11.18v-2.79H14.53z"
							className="h"
						></path>
					</svg>
				</div>
				<span>Hedera</span>
			</div>

			<div className="">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-yellow-500 rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AGFoods</h1>
                <p className="text-sm text-gray-600">Farm to Table Verification</p>
              </div>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
              About
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Trace Your Plantain Flour
            <span className="bg-gradient-to-r from-green-600 to-yellow-600 bg-clip-text text-transparent block">
              From Farm to Table
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
            Ensuring quality, authenticity, and transparency in the plantain flour supply chain through blockchain technology.
          </p>
          
          {/* Simplified User Type Selection */}
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-gray-900 mb-8">Select Your Role</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userTypes.map((type) => (
                <a
                  key={type.id}
                  href={`/${type.id}/dashboard`}
                  className="group block bg-white rounded-xl p-6 text-center border border-gray-200 hover:border-green-300 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="mb-3">
                    {type.icon}
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    {type.title}
                  </h4>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">Why Choose AGFoods?</h3>
            <p className="text-lg text-gray-600">
              Blockchain-powered transparency for your plantain flour supply chain
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  {feature.icon}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h4>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Removed to reduce busy-ness */}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-yellow-500 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold">AGFoods</span>
            </div>
            <p className="text-gray-400 text-sm">© 2025 AGFoods. Powered by blockchain technology.</p>
          </div>
        </div>
      </footer>
    </div>
		</div>
	);
}
export default App;


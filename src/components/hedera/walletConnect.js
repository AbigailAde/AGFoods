import { HashConnect } from "hashconnect";

const { REACT_APP_MY_ACCOUNT_ID, REACT_APP_MY_PRIVATE_KEY } = process.env;

async function walletConnectFcn() {
    console.log(`\n=======================================`);
    console.log("- Connecting wallet...");

    let saveData = {
        topic: "",
        pairingString: "",
        privateKey: REACT_APP_MY_PRIVATE_KEY || "",
        pairedWalletData: null,
        pairedAccounts: [],
    };

    let appMetadata = {
        name: "AGFoods DApp",
        description: "Blockchain-powered plantain flour traceability",
        icon: "https://raw.githubusercontent.com/ed-marquez/hedera-dapp-days/testing/src/assets/hederaLogo.png",
    };

    let hashconnect = new HashConnect();
	console.log(`- HashConnect initialized with app metadata: ${JSON.stringify(appMetadata)}`);

    try {
        // Initialize HashConnect (generates a pairing private key)
        const initData = await hashconnect.init(appMetadata, saveData.privateKey, false);
        console.log(`- Init data: ${JSON.stringify(initData)}`);
        saveData.privateKey = initData.privKey;

        // Connect to get the pairing topic
        const state = await hashconnect.connect();
        saveData.topic = state.topic;
        console.log(`- Pairing topic is: ${saveData.topic}`);

        // Generate the pairing string (for QR code)
        saveData.pairingString = hashconnect.generatePairingString(state, "testnet", false);

        // Check for local wallets
        const availableWallets = await hashconnect.findLocalWallets();
        console.log("Available wallets:", availableWallets);

        if (availableWallets && availableWallets.length > 0) {
            console.log("- Local wallet found, connecting...");
            hashconnect.connectToLocalWallet(saveData.pairingString);
        } else {
            console.warn("- No local wallet found. Display QR pairing string to user.");
            console.log("Scan this QR code with HashPack mobile:\n", saveData.pairingString);
        }

        return [hashconnect, saveData];

    } catch (err) {
        console.error("Wallet connection failed:", err.message);
        throw err;
    }
}

export default walletConnectFcn;

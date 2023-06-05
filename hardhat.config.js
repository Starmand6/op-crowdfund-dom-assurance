require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("hardhat-deploy");

const OPTIMISM_GOERLI_RPC_URL = process.env.OPTIMISM_GOERLI_RPC_URL;
const OPTIMISM_MAINNET_RPC_URL = process.env.OPTIMISM_MAINNET_RPC_URL;
const XDC_APOTHEM_RPC_URL = process.env.XDC_APOTHEM_RPC_URL;
const XDC_RPC_URL = process.env.XDC_RPC_URL;
const POLYGON_MAINNET_RPC_URL = process.env.POLYGON_MAINNET_RPC_URL;
const POLYGON_MUMBAI_RPC_URL = process.env.POLYGON_MUMBAI_RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
// const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const OPTIMISM_ETHERSCAN_API_KEY = process.env.OPTIMISM_ETHERSCAN_API_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || "";
const MAINNET_RPC_URL =
    process.env.MAINNET_RPC_URL || process.env.ALCHEMY_MAINNET_RPC_URL;
const mnemonic = process.env.mnemonic;

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            // forking: {
            //     url: XDC_APOTHEM_RPC_URL,
            //     blockNumber: 49758646,
            // },
        },
        localhost: {
            chainId: 31337,
        },
        optimismGoerli: {
            url: OPTIMISM_GOERLI_RPC_URL,
            accounts: { mnemonic: mnemonic },
            chainId: 420,
            blockConfirmations: 3,
        },
        optimismMainnet: {
            url: OPTIMISM_MAINNET_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 10,
            blockConfirmations: 3,
        },
        xdcApothem: {
            url: XDC_APOTHEM_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 51,
            blockConfirmations: 3,
        },
        xdc: {
            url: XDC_RPC_URL,
            accounts: { mnemonic: mnemonic },
            chainId: 50,
            blockConfirmations: 3,
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.8.18",
            },
            {
                version: "0.8.19",
            },
            {
                version: "0.6.12",
            },
        ],
    },
    etherscan: {
        apiKey: OPTIMISM_ETHERSCAN_API_KEY,
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0,
            1: 0,
        },
        earlyPledger: {
            default: 1,
            1: 1,
        },
        pledger: {
            default: 2,
            1: 2,
        },
        rando: {
            default: 3,
            1: 3,
        },
        beneficiary: {
            default: 4,
            1: 4,
        },
    },
    paths: {
        artifacts: "./app/src/artifacts",
    },
};

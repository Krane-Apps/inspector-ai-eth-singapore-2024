import { wagmiConnectors } from "./wagmiConnectors";
import { Chain, createClient, http } from "viem";
import { hardhat, mainnet, sepolia } from "viem/chains";
import { createConfig } from "wagmi";
import scaffoldConfig from "~~/scaffold.config";
import { getAlchemyHttpUrl } from "~~/utils/scaffold-eth";

const { targetNetworks } = scaffoldConfig;

// define custom chains
const rootstockTestnet: Chain = {
  id: 31,
  name: "Rootstock Testnet",
  nativeCurrency: { name: "Rootstock BTC", symbol: "tRBTC", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://public-node.testnet.rsk.co"] },
    public: { http: ["https://public-node.testnet.rsk.co"] },
  },
  blockExplorers: {
    default: { name: "RSK Explorer", url: "https://explorer.testnet.rsk.co" },
  },
};

const morphTestnet: Chain = {
  id: 1131,
  name: "Morph Testnet",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc-testnet.morphl2.io"] },
    public: { http: ["https://rpc-testnet.morphl2.io"] },
  },
  blockExplorers: {
    default: { name: "Morph Explorer", url: "https://explorer-holesky.morphl2.io" },
  },
};

const lineaTestnet: Chain = {
  id: 59140,
  name: "Linea Testnet",
  nativeCurrency: { name: "Linea Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.goerli.linea.build"] },
    public: { http: ["https://rpc.goerli.linea.build"] },
  },
  blockExplorers: {
    default: { name: "Linea Explorer", url: "https://goerli.lineascan.build" },
  },
};

const hederaTestnet: Chain = {
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 8 },
  rpcUrls: {
    default: { http: ["https://testnet.hashio.io/api"] },
    public: { http: ["https://testnet.hashio.io/api"] },
  },
  blockExplorers: {
    default: { name: "HashScan", url: "https://hashscan.io/testnet" },
  },
};

// Add custom chains to the targetNetworks
const updatedTargetNetworks = [
  ...targetNetworks,
  sepolia,
  rootstockTestnet,
  morphTestnet,
  lineaTestnet,
  hederaTestnet,
] as const;

// We always want to have mainnet enabled (ENS resolution, ETH price, etc). But only once.
export const enabledChains = updatedTargetNetworks.find((network: Chain) => network.id === 1)
  ? updatedTargetNetworks
  : ([...targetNetworks, mainnet] as const);

export const wagmiConfig = createConfig({
  chains: enabledChains,
  connectors: wagmiConnectors,
  ssr: true,
  client({ chain }) {
    return createClient({
      chain,
      transport: http(getAlchemyHttpUrl(chain.id)),
      ...(chain.id !== (hardhat as Chain).id
        ? {
            pollingInterval: scaffoldConfig.pollingInterval,
          }
        : {}),
    });
  },
});

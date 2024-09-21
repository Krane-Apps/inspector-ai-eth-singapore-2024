# <img src="packages/chrome-extension/images/logo.gif" alt="InspectorAI Logo" width="30" height="30" style="vertical-align: middle;"> InspectorAI: Smart Contract Analysis Tool

InspectorAI is a powerful tool designed to analyze and provide insights into smart contracts across multiple blockchain networks. It combines the capabilities of AI with blockchain technology to offer developers and users a comprehensive understanding of contract functionality and potential issues.

## Contract Addresses

| Chain     | Contract Type | Address                                                                                                                                            |
| --------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sepolia   | Chainlink     | [0x5aFCB399ef40DB5b77DC09AA02C53f5aee5744a5](https://sepolia.etherscan.io/address/0x5aFCB399ef40DB5b77DC09AA02C53f5aee5744a5)                      |
| Sepolia   | Basic         | [0x1c0042641A974a4411234DD68dfF22e9765e416F](https://sepolia.etherscan.io/address/0x1c0042641A974a4411234DD68dfF22e9765e416F)                      |
| Rootstock | Basic         | [0x78858Ab1Ad13C0a5829e06f89A9706a9Ba9A6791](https://explorer.testnet.rootstock.io/address/0x78858ab1ad13c0a5829e06f89a9706a9ba9a6791?__ctab=Code) |
| Morph     | Basic         | [0x6dc71cf8907E9BA2C268615a80300AD6d3622fD7](https://explorer-holesky.morphl2.io/address/0x6dc71cf8907E9BA2C268615a80300AD6d3622fD7?tab=contract)  |

## The Problem

Smart contracts are becoming increasingly complex and critical in the blockchain ecosystem. However, understanding their functionality, identifying potential vulnerabilities, and ensuring their reliability can be challenging. InspectorAI addresses these issues by providing:

-   Automated analysis of smart contract code
-   Detection of common vulnerabilities and security risks
-   Insights into contract functionality and behavior
-   Cross-chain compatibility checks
-   AI-powered suggestions for code improvements

## Getting Started

To start using InspectorAI:

1. Visit our web application at [https://inspector-ai-wine.vercel.app/?address=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&chain=ethereum](https://inspector-ai-wine.vercel.app/?address=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&chain=ethereum)
2. Connect your wallet and select the network you want to analyze
3. Input the smart contract address or code you wish to inspect
4. Review the AI-generated analysis and recommendations

For developers looking to contribute or run the project locally, please refer to the "Deployment and Verification" section above.

## How It's Made

InspectorAI leverages cutting-edge technologies and methodologies:

1. **Chrome Extension**: The primary point of contact for users, providing easy access to InspectorAI's features directly from their browser.

2. **AI Integration**: Utilizes advanced machine learning models like Claude 3 to analyze smart contract code and provide intelligent insights.

3. **Multi-Chain Support**: Built to work across various blockchain networks, including Ethereum, Rootstock, and Morph.

4. **React & Next.js Frontend**: A user-friendly interface built with React and Next.js for seamless interaction with the tool.

5. **Solidity Smart Contracts**: Custom smart contracts deployed on multiple chains to facilitate the analysis process.

6. **Chainlink Integration**: Incorporates Chainlink CCIP for cross-chain communication users can add a review on a different chain while they are on a different chain.

7. **Scaffold-ETH 2**: Built on top of the Scaffold-ETH 2 framework, providing a robust foundation for rapid development and deployment.

## Deployment and Verification

The InspectorAI contracts have been deployed and verified on multiple networks:

1. Clone the repository and install dependencies:

    ```
    git clone https://github.com/Krane-Apps/inspector-ai-eth-singapore-2024
    cd inspector-ai
    yarn install
    ```

2. Deploy to a local network for testing:

    ```
    yarn chain
    yarn deploy
    ```

3. To deploy to a public testnet or mainnet, update the `hardhat.config.ts` with the appropriate network settings and run:

    ```
    yarn deploy --network <network-name>
    ```

4. Verify the contracts on block explorers using the provided script:
    ```
    yarn verify --network <network-name>
    ```

For more detailed instructions on deployment and verification, please refer to our documentation.

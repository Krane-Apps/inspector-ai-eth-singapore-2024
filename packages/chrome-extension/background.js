chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'analyzeContract') {
    analyzeContract(request.address)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('Error analyzing contract:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; 
  }
});

async function analyzeContract(address) {
  try {
    console.log('background.js: analyzing contract:', address);

    const allData = await fetchAllTokenData(address);
    if (!allData) {
      throw new Error('failed to fetch token data');
    }

    // New: Fetch 1inch data
    const oneInchData = await fetch1inchData(address);

    const aiReview = await getAIReview({
      contractAddress: address,
      sourceCode: allData.sourceCode,
      oneInchData: oneInchData,
    });

    const summary = generateSummary(aiReview);

    chrome.storage.local.set({
      contractAddress: address,
      tokenSummary: summary,
      fullTokenData: JSON.stringify(allData),
      oneInchData: JSON.stringify(oneInchData),
      aiReview: aiReview,
    });

    console.log('background.js: contract analysis completed');
  } catch (error) {
    console.error('background.js: error in analyzeContract:', error);
    throw error;
  }
}

async function fetch1inchData(address) {
  const baseUrl = 'https://inspector-proxy.replit.app/';
  const oneInchData = {};

  try {
    // fetch token info
    const tokenInfoUrl = `${baseUrl}?url=https://api.1inch.dev/swap/v5.2/1/tokens`;
    const tokenInfoResponse = await fetch(tokenInfoUrl);
    const tokenInfoData = await tokenInfoResponse.json();
    oneInchData.tokenInfo = tokenInfoData.tokens[address];

    // fetch token balance
    const balanceUrl = `${baseUrl}?url=https://api.1inch.dev/balance/v1.2/1/balances/${address}`;
    const balanceResponse = await fetch(balanceUrl);
    oneInchData.balance = await balanceResponse.json();

    // fetch liquidity sources
    const liquiditySourcesUrl = `${baseUrl}?url=https://api.1inch.dev/swap/v5.2/1/liquidity-sources`;
    const liquiditySourcesResponse = await fetch(liquiditySourcesUrl);
    oneInchData.liquiditySources = await liquiditySourcesResponse.json();

    console.log('1inch data:', oneInchData);
    return oneInchData;
  } catch (error) {
    console.error('Error fetching 1inch data:', error);
    return null;
  }
}

async function fetchAllTokenData(address) {
  const apiKey = 'YTUI3CYCZCUNYG93VC223F4Q9HC4ZFIBBI';
  console.log('fetching data for address:', address);

  try {
    console.log('fetching contract source code...');
    const sourceCodeResponse = await fetch(
      `https://api.etherscan.io/api?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`
    );
    const sourceCodeData = await sourceCodeResponse.json();
    console.log('source code data:', sourceCodeData);

    console.log('fetching contract abi...');
    const abiResponse = await fetch(
      `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${apiKey}`
    );
    const abiData = await abiResponse.json();
    console.log('abi data:', abiData);

    console.log('fetching transactions...');
    const txListResponse = await fetch(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=desc&apikey=${apiKey}`
    );
    const txListData = await txListResponse.json();
    console.log('transaction list data:', txListData);

    const allData = {
      sourceCode: sourceCodeData.status === '1' ? sourceCodeData.result[0] : null,
      abi: abiData.status === '1' ? JSON.parse(abiData.result) : null,
      transactions: txListData.status === '1' ? txListData.result.slice(0, 10) : [],
    };

    console.log('all token data:', allData);
    return allData;
  } catch (error) {
    console.error('error fetching token data from etherscan:', error);
    return null;
  }
}

async function getAIReview(contractData) {
  const apiKey = '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';
  const url = 'https://api.anthropic.com/v1/messages';

  const prompt = `Analyze the following smart contract:
    Contract Address: ${contractData.contractAddress}
    Contract Name: ${contractData.sourceCode?.ContractName || 'N/A'}
    Compiler Version: ${contractData.sourceCode?.CompilerVersion || 'N/A'}
    Source Code: ${contractData.sourceCode?.SourceCode || 'N/A'}
    
    1inch Data:
    Token Info: ${JSON.stringify(contractData.oneInchData?.tokenInfo || {})}
    Balance: ${JSON.stringify(contractData.oneInchData?.balance || {})}
    Liquidity Sources: ${JSON.stringify(contractData.oneInchData?.liquiditySources || {})}
    
    Provide a comprehensive analysis of the contract's functionality, potential vulnerabilities, and overall assessment. Focus on the following points:

    1. Contract purpose and main features
    2. Token economics (if applicable)
    3. Security measures implemented
    4. Potential vulnerabilities or red flags
    5. Unusual or noteworthy functions
    6. Compliance with standard practices
    7. Analysis of 1inch data (token info, balance, and liquidity sources)

    Based on your analysis, categorize the contract's risk level as one of the following:
    - "High Risk": If the contract has significant vulnerabilities or suspicious features
    - "Moderate Risk": If the contract has some potential issues that require caution
    - "Low Risk": If the contract appears to be relatively safe but still requires careful consideration
    
    Include the exact risk level phrase in your response.
    
    Conclude with a summary of the contract's strengths and weaknesses, and any recommendations for users interacting with this contract.

    Limit your response to 250 tokens.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': true
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 250,
        messages: [
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    console.log('Claude API Response:', data);

    if (data.content && data.content.length > 0) {
      return data.content[0].text;
    } else {
      console.error('Unexpected Claude API response structure:', data);
      return 'Error: Unexpected API response structure.';
    }
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return 'Error generating AI review: ' + error.message;
  }
}

function generateSummary(aiReview) {
  if (aiReview.includes('High Risk')) {
    return 'High Risk: The contract has significant vulnerabilities or suspicious features.';
  } else if (aiReview.includes('Moderate Risk')) {
    return 'Moderate Risk: The contract has some potential issues that require caution.';
  } else if (aiReview.includes('Low Risk')) {
    return 'Low Risk: The contract appears to be relatively safe, but always exercise caution.';
  }
  return 'Neutral: Unable to determine risk level. Please review the full AI analysis.';
}

console.log('InspectorAI background script loaded');
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

    const oneInchData = await fetch1inchData(address);

    const aiReview = await getAIReview({
      contractAddress: address,
      sourceCode: allData.sourceCode,
      oneInchData: oneInchData,
    });

    const summary = generateSummary(aiReview);

    // Call getGaiaAnalysis with the source code
    const gaiaAnalysis = await getGaiaAnalysis(allData.sourceCode);

    chrome.storage.local.set({
      contractAddress: address,
      tokenSummary: summary,
      fullTokenData: JSON.stringify(allData),
      oneInchData: JSON.stringify(oneInchData),
      aiReview: aiReview,
      gaiaAnalysis: gaiaAnalysis,
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
    if (!tokenInfoResponse.ok) {
      throw new Error(`HTTP error! status: ${tokenInfoResponse.status}`);
    }
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
    console.error('Error fetching 1inch and Etherscan data:', error);
    return {
      error: error.message,
      tokenInfo: null,
      liquiditySources: null,
      transactions: []
    };
  }
}

async function fetchTokenTransactions(address) {
  const apiKey = 'YTUI3CYCZCUNYG93VC223F4Q9HC4ZFIBBI'; // Your Etherscan API key
  const url = `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${address}&page=1&offset=100&sort=desc&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === '1') {
      return data.result;
    } else {
      console.error('Error fetching token transactions:', data.message);
      return [];
    }
  } catch (error) {
    console.error('Error fetching token transactions:', error);
    return [];
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

  const prompt = `Analyze the following smart contract briefly:
    Contract Address: ${contractData.contractAddress}
    Contract Name: ${contractData.sourceCode?.ContractName || 'N/A'}
    Compiler Version: ${contractData.sourceCode?.CompilerVersion || 'N/A'}
    Source Code: ${contractData.sourceCode?.SourceCode || 'N/A'}
    
    1inch Data:
    Token Info: ${JSON.stringify(contractData.oneInchData?.tokenInfo || {})}
    Balance: ${JSON.stringify(contractData.oneInchData?.balance || {})}
    Liquidity Sources: ${JSON.stringify(contractData.oneInchData?.liquiditySources || {})}
    Token Transactions (last 100):
    ${JSON.stringify(contractData.oneInchData?.transactions || [])}
    
    Provide a concise analysis of the contract's functionality and potential risks. Focus on:

    1. Contract purpose and main features (go into depth on each feature)
    2. Token economics (if applicable, provide a detailed breakdown)
    3. Security measures implemented (analyze each measure thoroughly)
    4. Potential vulnerabilities or red flags (discuss each one in detail)
    5. Unusual or noteworthy functions (explain their purpose and potential implications)
    6. Compliance with standard practices (compare with industry standards)
    7. Detailed analysis of 1inch data (token info, liquidity sources, allowance, and swap quote)
    8. In-depth analysis of token transactions (patterns, large transfers, suspicious activities)
    9. Any suspicious patterns or concerns based on the provided data (elaborate on each concern)
    10. Potential impact on users and the broader ecosystem
    11. Comparison with similar contracts or tokens in the market
    12. Recommendations for improvements or further security measures

    Based on your thorough analysis, categorize the contract's risk level as one of the following:
    - "High Risk": If the contract has significant vulnerabilities or suspicious features
    - "Moderate Risk": If the contract has some potential issues that require caution
    - "Low Risk": If the contract appears to be relatively safe but still requires careful consideration
    
    Include the exact risk level phrase in your response.
    
    Keep your response under 150 words, using simple language.`;

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
        max_tokens: 4000,  
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
  const riskLevel = aiReview.match(/(High|Moderate|Low) Risk/);
  if (riskLevel) {
    return `${riskLevel[0]}: ${aiReview.split(riskLevel[0])[1].trim().split('.')[0]}.`;
  }
  return 'Unable to determine risk level. Please review the full AI analysis.';
}

async function getGaiaAnalysis(sourceCode) {
  const url = 'https://0x63d19362cd5caf0f482662dafd51835053ca360c.us.gaianet.network/v1/chat/completions';
  const prompt = `Analyze this ERC20 contract for top 3 potential vulnerabilities:

${sourceCode.SourceCode || 'N/A'}

Provide a brief analysis of risks and security recommendations.`;

  try {
    console.log('background.js: Calling Gaia API');
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are an ERC20 security expert. Be concise." },
          { role: "user", content: prompt }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('background.js: Gaia API Response:', data);

    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      console.error('background.js: Unexpected Gaia API response structure:', data);
      return 'Error: Unexpected API response structure.';
    }
  } catch (error) {
    console.error('background.js: Error calling Gaia API:', error);
    return 'Error generating Gaia analysis: ' + error.message;
  }
}

console.log('InspectorAI background script loaded');
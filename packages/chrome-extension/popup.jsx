import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';

function Popup() {
  const [inputAddress, setInputAddress] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [tokenSummary, setTokenSummary] = useState('');
  const [fullTokenData, setFullTokenData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [aiReview, setAiReview] = useState('');
  const [oneInchData, setOneInchData] = useState(null);

  useEffect(() => {
    // get storage data
    chrome.storage.local.get(
      ['contractAddress', 'tokenSummary', 'fullTokenData', 'aiReview', 'oneInchData'],
      (result) => {
        setContractAddress(result.contractAddress || '');
        setTokenSummary(result.tokenSummary || '');
        setFullTokenData(result.fullTokenData ? JSON.parse(result.fullTokenData) : null);
        setAiReview(result.aiReview || '');
        setOneInchData(result.oneInchData ? JSON.parse(result.oneInchData) : null);
      }
    );
  }, []);

  // handle analysis
  const handleAnalyze = () => {
    if (inputAddress.trim() !== '') {
      setIsLoading(true);
      // clear results
      setContractAddress('');
      setTokenSummary('');
      setFullTokenData(null);
      setAiReview('');
      
      // send to background
      chrome.runtime.sendMessage(
        {
          action: 'analyzeContract',
          address: inputAddress.trim(),
        },
        (response) => {
          if (response.success) {
            // check results
            setTimeout(checkForResults, 1000);
          } else {
            setIsLoading(false);
            // show error
            alert(`Error analyzing contract: ${response.error}`);
          }
        }
      );
    }
  };

  // check results
  const checkForResults = () => {
    chrome.storage.local.get(
      ['contractAddress', 'tokenSummary', 'fullTokenData'],
      (result) => {
        if (result.contractAddress === inputAddress.trim()) {
          setContractAddress(result.contractAddress);
          setTokenSummary(result.tokenSummary);
          setFullTokenData(result.fullTokenData ? JSON.parse(result.fullTokenData) : null);
          setIsLoading(false);
        } else {
          // retry
          setTimeout(checkForResults, 1000);
        }
      }
    );
  };

  return (
    <div className="container">
      <h1 className="title">InspectorAI</h1>

      {/* search bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Enter contract address"
          value={inputAddress}
          onChange={(e) => setInputAddress(e.target.value)}
          className="input-field"
        />
        <button
          onClick={handleAnalyze}
          className="analyze-button"
          disabled={isLoading}
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>

      {/* loading */}
      {isLoading && (
        <div className="loading">
          <p>Please wait, this can take up to 2 minutes.</p>
        </div>
      )}

      {/* results */}
      {!isLoading && contractAddress && (
        <div className="results">
          {fullTokenData && (
            <>
              <h3>Contract Details</h3>
              <p>
              <strong>Contract Address:</strong>  {contractAddress || 'N/A'}
              </p>
              <p>
                <strong>Contract Name:</strong> {fullTokenData.sourceCode?.ContractName || 'N/A'}
              </p>
              <p>
                <strong>Compiler Version:</strong> {fullTokenData.sourceCode?.CompilerVersion || 'N/A'}
              </p>
              {fullTokenData.sourceCode?.SourceCode && (
                <p>
                  <a
                    href={`https://etherscan.io/address/${contractAddress}#code`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-code-link"
                  >
                    View Contract Code
                  </a>
                </p>
              )}
              {fullTokenData.abi && (
                <p>
                  <a
                    href={`https://etherscan.io/address/${contractAddress}#code`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-code-link"
                  >
                    View Contract ABI
                  </a>
                </p>
              )}
            </>
          )}
          
          <h3>Summary</h3>
          <div className="summary-container">
            <pre className="summary-text">{tokenSummary}</pre>
          </div>
          
          {aiReview && (
            <>
              <h3>OpenAI Analysis</h3>
              <div className="ai-review">
                <p>{aiReview}</p>
              </div>
            </>
          )}
          
          {oneInchData && (
            <>
              <h3>1inch Data</h3>
              {oneInchData.tokenInfo && (
                <div>
                  <h4>Token Info</h4>
                  <p><strong>Symbol:</strong> {oneInchData.tokenInfo.symbol}</p>
                  <p><strong>Name:</strong> {oneInchData.tokenInfo.name}</p>
                  <p><strong>Decimals:</strong> {oneInchData.tokenInfo.decimals}</p>
                </div>
              )}
              {oneInchData.balance && (
                <div>
                  <h4>Balance</h4>
                  <p><strong>Balance:</strong> {oneInchData.balance[contractAddress]}</p>
                </div>
              )}
              {oneInchData.liquiditySources && (
                <div>
                  <h4>Liquidity Sources</h4>
                  <ul>
                    {Object.entries(oneInchData.liquiditySources.protocols).map(([key, value]) => (
                      <li key={key}>{value.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<Popup />, document.getElementById('root'));
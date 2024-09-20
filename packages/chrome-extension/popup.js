document.addEventListener('DOMContentLoaded', function() {
  const inputAddressElement = document.getElementById('contractAddress');
  const analyzeButtonElement = document.getElementById('analyzeButton');
  const loadingElement = document.getElementById('loadingIndicator');
  const resultsElement = document.getElementById('results');

  let inputAddress = '';
  let contractAddress = '';
  let tokenSummary = '';
  let fullTokenData = null;
  let isLoading = false;
  let aiReview = '';

  // get initial data from storage
  chrome.storage.local.get(
    ['contractAddress', 'tokenSummary', 'fullTokenData', 'aiReview'],
    (result) => {
      contractAddress = result.contractAddress || '';
      tokenSummary = result.tokenSummary || '';
      fullTokenData = result.fullTokenData ? JSON.parse(result.fullTokenData) : null;
      aiReview = result.aiReview || '';
      updateUI();
    }
  );

  // handle analysis
  function handleAnalyze() {
    if (inputAddress.trim() !== '') {
      isLoading = true;
      // clear results
      contractAddress = '';
      tokenSummary = '';
      fullTokenData = null;
      aiReview = '';
      
      // send to background
      chrome.runtime.sendMessage(
        {
          action: 'analyzeContract',
          address: inputAddress.trim(),
        },
        (response) => {
          if (response.success) {
            // Check results
            setTimeout(checkForResults, 1000);
          } else {
            isLoading = false;
            // Show error
            alert(`Error analyzing contract: ${response.error}`);
          }
          updateUI();
        }
      );
    }
  }

  // check results
  function checkForResults() {
    chrome.storage.local.get(
      ['contractAddress', 'tokenSummary', 'fullTokenData', 'aiReview'],
      (result) => {
        if (result.contractAddress === inputAddress.trim()) {
          contractAddress = result.contractAddress;
          tokenSummary = result.tokenSummary;
          fullTokenData = result.fullTokenData ? JSON.parse(result.fullTokenData) : null;
          aiReview = result.aiReview;
          isLoading = false;
        } else {
          // Retry
          setTimeout(checkForResults, 1000);
        }
        updateUI();
      }
    );
  }

  // Update UI
  function updateUI() {
    inputAddressElement.value = inputAddress;
    analyzeButtonElement.disabled = isLoading;
    analyzeButtonElement.textContent = isLoading ? 'Analyzing...' : 'Analyze';
    
    loadingElement.style.display = isLoading ? 'block' : 'none';
    resultsElement.style.display = !isLoading && contractAddress ? 'block' : 'none';

    if (!isLoading && contractAddress) {
      let resultsHTML = '';
      
      if (fullTokenData) {
        resultsHTML += `
          <h3>Contract Details</h3>
          <p><strong>Contract Address:</strong> ${contractAddress || 'N/A'}</p>
          <p><strong>Contract Name:</strong> ${fullTokenData.sourceCode?.ContractName || 'N/A'}</p>
          <p><strong>Compiler Version:</strong> ${fullTokenData.sourceCode?.CompilerVersion || 'N/A'}</p>
        `;
        
        if (fullTokenData.sourceCode?.SourceCode) {
          resultsHTML += `
            <p>
              <a href="https://etherscan.io/address/${contractAddress}#code" target="_blank" rel="noopener noreferrer" class="view-code-link">
                View Contract Code
              </a>
            </p>
          `;
        }
        
        if (fullTokenData.abi) {
          resultsHTML += `
            <p>
              <a href="https://etherscan.io/address/${contractAddress}#code" target="_blank" rel="noopener noreferrer" class="view-code-link">
                View Contract ABI
              </a>
            </p>
          `;
        }
      }
      
      resultsHTML += `
        <h3>Summary</h3>
        <div class="summary-container">
          <pre class="summary-text">${tokenSummary}</pre>
        </div>
      `;
      
      if (aiReview) {
        resultsHTML += `
          <h3>OpenAI Analysis</h3>
          <div class="ai-review">
            <p>${aiReview}</p>
          </div>
        `;
      }
      
      resultsElement.innerHTML = resultsHTML;
    }
  }

  // event listeners
  inputAddressElement.addEventListener('input', function(e) {
    inputAddress = e.target.value;
    analyzeButtonElement.disabled = inputAddress.trim() === '';
  });

  analyzeButtonElement.addEventListener('click', handleAnalyze);

  // initial UI update
  updateUI();
});
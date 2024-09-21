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
  let oneInchData = null;

  // get initial data from storage
  chrome.storage.local.get(
    ['contractAddress', 'tokenSummary', 'fullTokenData', 'aiReview', 'oneInchData'],
    (result) => {
      contractAddress = result.contractAddress || '';
      tokenSummary = result.tokenSummary || '';
      fullTokenData = result.fullTokenData ? JSON.parse(result.fullTokenData) : null;
      aiReview = result.aiReview || '';
      oneInchData = result.oneInchData ? JSON.parse(result.oneInchData) : null;
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
      oneInchData = null;
      
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
      ['contractAddress', 'tokenSummary', 'fullTokenData', 'aiReview', 'oneInchData'],
      (result) => {
        if (result.contractAddress === inputAddress.trim()) {
          contractAddress = result.contractAddress;
          tokenSummary = result.tokenSummary;
          fullTokenData = result.fullTokenData ? JSON.parse(result.fullTokenData) : null;
          aiReview = result.aiReview;
          oneInchData = result.oneInchData ? JSON.parse(result.oneInchData) : null;
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
        const previewLength = 100;
        const previewText = aiReview.slice(0, previewLength) + (aiReview.length > previewLength ? '...' : '');
        let riskLevel = 'neutral';
        if (aiReview.includes('Low Risk')) riskLevel = 'low-risk';
        else if (aiReview.includes('Moderate Risk')) riskLevel = 'moderate-risk';
        else if (aiReview.includes('High Risk')) riskLevel = 'high-risk';

        resultsHTML += `
          <h3>AI Analysis</h3>
          <div class="ai-review ${riskLevel}">
            <p class="preview">${previewText}</p>
            <p class="full-text" style="display: none;">${aiReview}</p>
            <a href="#" class="toggle-view" data-target="ai-review">See More</a>
          </div>
        `;
      }
      
      // Add 1inch Data section with toggle
      if (oneInchData) {
        resultsHTML += `
          <h3>1inch Data</h3>
          <div class="one-inch-data">
            <div class="preview">
              <p><strong>Token Symbol:</strong> ${oneInchData.tokenInfo?.symbol || 'N/A'}</p>
            </div>
            <div class="full-text" style="display: none;">
              ${generateOneInchDataHTML(oneInchData, contractAddress)}
            </div>
            <a href="#" class="toggle-view" data-target="one-inch-data">See More</a>
          </div>
        `;
      }
      
      resultsElement.innerHTML = resultsHTML;
      
      // Add event listeners for toggle links
      document.querySelectorAll('.toggle-view').forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const target = this.getAttribute('data-target');
          const container = this.closest(`.${target}`);
          const preview = container.querySelector('.preview');
          const fullText = container.querySelector('.full-text');
          
          if (preview.style.display !== 'none') {
            preview.style.display = 'none';
            fullText.style.display = 'block';
            this.textContent = 'See Less';
          } else {
            preview.style.display = 'block';
            fullText.style.display = 'none';
            this.textContent = 'See More';
          }
        });
      });
    }
  }

  function generateOneInchDataHTML(oneInchData, contractAddress) {
    let html = '';
    
    if (oneInchData.tokenInfo) {
      html += `
        <h4>Token Info</h4>
        <p><strong>Symbol:</strong> ${oneInchData.tokenInfo.symbol}</p>
        <p><strong>Name:</strong> ${oneInchData.tokenInfo.name}</p>
        <p><strong>Decimals:</strong> ${oneInchData.tokenInfo.decimals}</p>
      `;
    }
    
    if (oneInchData.balance) {
      html += `
        <h4>Balance</h4>
        <p><strong>Balance:</strong> ${oneInchData.balance[contractAddress]}</p>
      `;
    }
    
    if (oneInchData.liquiditySources) {
      html += `
        <h4>Liquidity Sources</h4>
        <div class="liquidity-sources">
          ${Object.entries(oneInchData.liquiditySources.protocols).map(([key, value]) => `
            <div class="liquidity-source">
              <div class="image-container">
                <img src="${value.img || 'images/default-logo.png'}" alt="${value.title}" title="${value.title}" onerror="this.onerror=null; this.src='images/default-logo.png';">
              </div>
              <span>${value.title}</span>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    return html;
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
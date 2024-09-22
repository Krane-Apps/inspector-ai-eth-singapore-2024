document.addEventListener('DOMContentLoaded', function() {
  const inputAddressElement = document.getElementById('contractAddress');
  const analyzeButtonElement = document.getElementById('analyzeButton');
  const loadingElement = document.getElementById('loadingIndicator');
  const resultsElement = document.getElementById('results');
  const searchBarElement = document.getElementById('searchBar');
  const backButtonElement = document.createElement('a');
  const reviewButtonContainer = document.getElementById('reviewButtonContainer');
  const writeReviewButton = document.getElementById('writeReviewButton');

  backButtonElement.textContent = '← back';
  backButtonElement.className = 'back-link';
  backButtonElement.href = '#';
  backButtonElement.style.display = 'none';

  let inputAddress = '';
  let contractAddress = '';
  let tokenSummary = '';
  let fullTokenData = null;
  let isLoading = false;
  let aiReview = '';
  let oneInchData = null;
  let currentContractAddress = '';
  let currentChain = 'sepolia'; // Default chain
  let gaiaAnalysis = '';

  // get initial data from storage
  chrome.storage.local.get(
    ['contractAddress', 'tokenSummary', 'fullTokenData', 'aiReview', 'oneInchData', 'gaiaAnalysis'],
    (result) => {
      contractAddress = result.contractAddress || '';
      tokenSummary = result.tokenSummary || '';
      fullTokenData = result.fullTokenData ? JSON.parse(result.fullTokenData) : null;
      aiReview = result.aiReview || '';
      oneInchData = result.oneInchData ? JSON.parse(result.oneInchData) : null;
      gaiaAnalysis = result.gaiaAnalysis || '';
      updateUI();
    }
  );

  // handle analysis
  function handleAnalyze() {
    if (inputAddress.trim() !== '') {
      isLoading = true;
      updateUI(); 
      // clear results
      contractAddress = '';
      tokenSummary = '';
      fullTokenData = null;
      aiReview = '';
      oneInchData = null;
      gaiaAnalysis = '';
      
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
            updateUI();
          }
        }
      );
    }
  }

  // check results
  function checkForResults() {
    chrome.storage.local.get(
      ['contractAddress', 'tokenSummary', 'fullTokenData', 'aiReview', 'oneInchData', 'gaiaAnalysis'],
      (result) => {
        if (result.contractAddress === inputAddress.trim()) {
          contractAddress = result.contractAddress;
          tokenSummary = result.tokenSummary;
          fullTokenData = result.fullTokenData ? JSON.parse(result.fullTokenData) : null;
          aiReview = result.aiReview;
          oneInchData = result.oneInchData ? JSON.parse(result.oneInchData) : null;
          gaiaAnalysis = result.gaiaAnalysis; // Make sure this line is present
          isLoading = false;
          updateUI();
        } else {
          // Retry
          setTimeout(checkForResults, 1000);
        }
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
    searchBarElement.style.display = !isLoading && !contractAddress ? 'block' : 'none';
    backButtonElement.style.display = !isLoading && contractAddress ? 'inline-block' : 'none';

    if (!isLoading && contractAddress) {
      let resultsHTML = '';
      
      resultsHTML += `<div class="back-link-container">${backButtonElement.outerHTML}</div>`;

      if (fullTokenData) {
        resultsHTML += `
          <div class="contract-info-card">
            <h3>Contract Details</h3>
            <p><strong>Contract Address:</strong> ${contractAddress || 'N/A'}</p>
            <p><strong>Contract Name:</strong> ${fullTokenData.sourceCode?.ContractName || 'N/A'}</p>
            <p><strong>Compiler Version:</strong> ${fullTokenData.sourceCode?.CompilerVersion || 'N/A'}</p>
            <div class="contract-links">
              ${fullTokenData.sourceCode?.SourceCode ? `
                <a href="https://etherscan.io/address/${contractAddress}#code" target="_blank" rel="noopener noreferrer" class="view-link">
                  View Contract Code
                </a>
              ` : ''}
              ${fullTokenData.abi ? `
                <a href="https://etherscan.io/address/${contractAddress}#code" target="_blank" rel="noopener noreferrer" class="view-link">
                  View Contract ABI
                </a>
              ` : ''}
            </div>
          </div>
       
          `;
      }
      
      if (aiReview) {
        const previewLength = 300;
        const previewText = aiReview.slice(0, previewLength) + (aiReview.length > previewLength ? '...' : '');
        let riskLevel = 'neutral';
        if (aiReview.includes('Low Risk')) riskLevel = 'low-risk';
        else if (aiReview.includes('Moderate Risk')) riskLevel = 'moderate-risk';
        else if (aiReview.includes('High Risk')) riskLevel = 'high-risk';

        resultsHTML += `
          <h3>AI Analysis</h3>
          <div class="ai-review ${riskLevel}">
            <pre class="summary-text">${tokenSummary}</pre>
            <p class="preview">${previewText}</p>
            <div class="full-text" style="display: none;">
              ${aiReview.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
            </div>
            <a href="#" class="toggle-view" data-target="ai-review">See More</a>
          </div>
        `;
      }
      
      // add Gaia Analysis section
      if (gaiaAnalysis) {
        const previewLength = 300;
        const previewText = gaiaAnalysis.slice(0, previewLength) + (gaiaAnalysis.length > previewLength ? '...' : '');

        resultsHTML += `
          <h3>Gaia Analysis</h3>
          <div class="gaia-analysis">
            <p class="preview">${previewText}</p>
            <div class="full-text" style="display: none;">
              ${gaiaAnalysis.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
            </div>
            <a href="#" class="toggle-view" data-target="gaia-analysis">See More</a>
          </div>
        `;
      }
      
      // add the "Write a Review" button
      resultsHTML += `
        <div id="reviewButtonContainer" class="review-button-container">
          <button id="writeReviewButton" class="write-review-btn">Write a Review</button>
        </div>
      `;
      
      // Add 1inch Data section with toggle
      if (oneInchData) {
        resultsHTML += generateOneInchDataHTML(oneInchData, contractAddress);
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

      // Add event listener for back link
      document.querySelector('.back-link').addEventListener('click', handleBack);

      // Add event listener for the "Write a Review" button
      const writeReviewButton = document.getElementById('writeReviewButton');
      if (writeReviewButton) {
        writeReviewButton.addEventListener('click', function() {
          const reviewUrl = `https://inspector-ai-wine.vercel.app/?address=${contractAddress}&chain=${currentChain}`;
          chrome.tabs.create({ url: reviewUrl });
        });
      }
    }
  }

  function handleBack(e) {
    e.preventDefault();
    contractAddress = '';
    tokenSummary = '';
    fullTokenData = null;
    aiReview = '';
    oneInchData = null;
    gaiaAnalysis = '';
    inputAddress = '';
    updateUI();
  }

  function generateOneInchDataHTML(oneInchData, contractAddress) {
    let html = '';
    
    if (oneInchData.error) {
      html += `<p class="error">Error fetching 1inch data: ${oneInchData.error}</p>`;
    }

    html += `
      <div class="one-inch-card">
        <div class="one-inch-header">
          <img src="images/1inch_without_text_white.png" alt="1inch Logo" class="one-inch-logo">
          <h3>1inch Data</h3>
        </div>
    `;

    if (oneInchData.tokenInfo) {
      html += `
        <div class="token-info">
          <h4>Token Info</h4>
          <p><strong>Symbol:</strong> ${oneInchData.tokenInfo.symbol}, <strong>Name:</strong> ${oneInchData.tokenInfo.name}, <strong>Decimals:</strong> ${oneInchData.tokenInfo.decimals}</p>
        </div>
      `;
    }
    
    if (oneInchData.balance) {
      html += `
        <div class="token-balance">
          <p><strong>Balance:</strong> ${oneInchData.balance[contractAddress]}</p>
        </div>
      `;
    }
    
    if (oneInchData.liquiditySources) {
      html += `
        <div class="liquidity-sources">
          <h4>Liquidity Sources</h4>
          <div class="liquidity-sources-grid">
            ${Object.entries(oneInchData.liquiditySources.protocols).map(([key, value]) => `
              <div class="liquidity-source">
                <div class="image-container">
                  <img src="${value.img || 'images/default-logo.png'}" alt="${value.title}" title="${value.title}" onerror="this.onerror=null; this.src='images/default-logo.png';">
                </div>
                <span>${value.title}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    html += `</div>`; 

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
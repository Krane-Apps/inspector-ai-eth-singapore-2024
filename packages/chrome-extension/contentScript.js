console.log('InspectorAI: Content script loaded');

function injectAnalyzeButton() {
  const addressElement = document.querySelector('a[href^="https://etherscan.io/address/"]');
  if (!addressElement) return;

  const contractAddress = addressElement.href.split('/').pop();

  const analyzeButton = document.createElement('button');
  analyzeButton.textContent = 'Analyze with InspectorAI';
  analyzeButton.style.cssText = `
    background-color: #4CAF50;
    border: none;
    color: white;
    padding: 10px 20px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
    margin: 4px 2px;
    cursor: pointer;
    border-radius: 4px;
  `;

  analyzeButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'analyzeContract',
      address: contractAddress
    }, (response) => {
      if (response.success) {
        alert('Contract analysis started. Please check the InspectorAI extension popup for results.');
      } else {
        alert('Error starting contract analysis: ' + response.error);
      }
    });
  });

  addressElement.parentNode.insertBefore(analyzeButton, addressElement.nextSibling);
}

injectAnalyzeButton();

const observer = new MutationObserver(injectAnalyzeButton);
observer.observe(document.body, { childList: true, subtree: true });
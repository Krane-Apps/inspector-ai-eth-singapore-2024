console.log('InspectorAI content script loaded');

function injectAiAuditButton() {
  // find all span elements with a 'title' attribute that looks like an Ethereum address
  const addressElements = document.querySelectorAll('span[title^="0x"]');

  addressElements.forEach((addressElement) => {
    const contractAddress = addressElement.getAttribute('title');

    // validate if the contractAddress is a valid Ethereum address
    if (/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      // check if we've already added the button to prevent duplicates
      if (
        addressElement.nextSibling &&
        addressElement.nextSibling.classList &&
        addressElement.nextSibling.classList.contains('ai-audit-button')
      ) {
        return; // skip if button already exists
      }

      // create the "AI Audit" button
      const aiAuditButton = document.createElement('button');
      aiAuditButton.textContent = '✨ AI Audit';
      aiAuditButton.style.cssText = `
        background-color: #334155;
        border: none;
        color: #F8FAFC;
        padding: 5px 10px;
        font-size: 12px;
        margin-left: 10px;
        cursor: pointer;
        border-radius: 3px;
      `;
      aiAuditButton.classList.add('ai-audit-button');

      // add click event listener to the button
      aiAuditButton.addEventListener('click', () => {
        chrome.runtime.sendMessage(
          {
            action: 'analyzeContract',
            address: contractAddress,
          },
          (response) => {
            if (response.success) {
              alert('Contract analysis started. Check the InspectorAI extension for a brief summary.');
            } else {
              alert('Error starting contract analysis: ' + response.error);
            }
          }
        );
      });

      // insert the button next to the contract address element
      addressElement.parentNode.insertBefore(aiAuditButton, addressElement.nextSibling);
    }
  });
}

// initial injection of the AI Audit button
injectAiAuditButton();

// observe for dynamic content changes 
const observer = new MutationObserver(() => {
  injectAiAuditButton();
});
observer.observe(document.body, { childList: true, subtree: true });

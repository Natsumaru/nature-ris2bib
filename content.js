chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "displayBibtex") {
    // Display a prompt or create a custom modal to facilitate copying to clipboard
    // Here is an example of injecting a modal with a textarea into the DOM
    
    const modalId = "nature-bibtex-modal";
    if (document.getElementById(modalId)) {
        document.getElementById(modalId).remove();
    }

    const modal = document.createElement("div");
    modal.id = modalId;
    modal.style.cssText = `
      position: fixed; top: 20%; left: 50%; transform: translateX(-50%);
      width: 500px; padding: 20px; background: white; 
      border: 1px solid #ccc; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000; font-family: monospace;
    `;

    const textarea = document.createElement("textarea");
    textarea.value = request.data;
    textarea.style.cssText = "width: 100%; height: 200px; margin-bottom: 10px;";

    const copyBtn = document.createElement("button");
    copyBtn.innerText = "Copy & Close";
    copyBtn.style.cssText = "padding: 8px 16px; cursor: pointer; background: #000; color: #fff; border: none;";
    
    copyBtn.onclick = () => {
      textarea.select();
      document.execCommand("copy"); // Or navigator.clipboard.writeText
      modal.remove();
    };

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "Close";
    closeBtn.style.cssText = "padding: 8px 16px; margin-left: 10px; cursor: pointer;";
    closeBtn.onclick = () => modal.remove();

    modal.appendChild(document.createElement("h3")).innerText = "BibTeX Citation";
    modal.appendChild(textarea);
    modal.appendChild(copyBtn);
    modal.appendChild(closeBtn);

    document.body.appendChild(modal);
  }
});

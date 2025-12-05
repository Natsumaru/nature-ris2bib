/*
 * Portions of this code are based on logic from a Go implementation.
 * * Original Go Code: https://github.com/harrisonlabollita/ris-2-bib
 * Copyright (c) 2023 Harrison LaBollita
 * * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


// Helper to parse each line of RIS and separate key and value
// Equivalent to Go code: strings.SplitN(line, " - ", 2)
function parseRisLine(line) {
  const separator = " - ";
  const index = line.indexOf(separator);
  
  if (index === -1) return null;

  const key = line.substring(0, index).trim();
  const value = line.substring(index + separator.length).trim();
  
  return { key, value };
}

// Helper to extract a significant word (3+ chars) from the title for the ID
// Equivalent to Go code: TitleWords loop logic
function getSignificantTitleWord(title) {
  if (!title) return "";
  // Remove symbols and split into words
  const words = title.replace(/[^\w\s]/g, '').split(/\s+/);
  for (const word of words) {
    if (word.length >= 3) {
      return word; // Return the first word with 3 or more characters
    }
  }
  return ""; // Return empty string if not found
}

function convertRisToBibtex(risData) {
  const lines = risData.split('\n');
  
  // Object to temporarily store data
  let bibData = {
    authors: [],
    title: "",
    journal: "",
    year: "",
    volume: "",
    issue: "",
    startpg: "",
    endpg: "",
    doi: "",
    url: "" // Newly added
  };

  lines.forEach(line => {
    const parsed = parseRisLine(line);
    if (!parsed) return;

    const { key, value } = parsed;

    switch (key) {
      case 'TI': case 'T1':
        bibData.title = value;
        break;
      case 'AU': case 'A1':
        bibData.authors.push(value);
        break;
      case 'JO': case 'JF': case 'JA':
        bibData.journal = value;
        break;
      case 'PY': case 'Y1':
        // Nature RIS often has format "2024/05/15/", so extract only the year
        bibData.year = value.substring(0, 4);
        break;
      case 'VL':
        bibData.volume = value;
        break;
      case 'IS':
        bibData.issue = value;
        break;
      case 'SP':
        bibData.startpg = value;
        break;
      case 'EP':
        bibData.endpg = value;
        break;
      case 'DO':
        bibData.doi = value;
        break;
      case 'UR': // Add URL, similar to Go code
        bibData.url = value;
        break;
    }
  });

  // --- ID Generation Logic (Reproducing Go code's ConvertWithoutId) ---
  
  // 1. Author: Remove spaces from the first author's last name
  // Go: strings.Replace(strings.Split(bib.authors[0], ",")[0], " ", "", -1)
  let authorKey = "Nature";
  if (bibData.authors.length > 0) {
    const firstAuthor = bibData.authors[0].split(',')[0]; // Get last name only
    authorKey = firstAuthor.replace(/\s/g, '');
  }

  // 2. Year
  const yearKey = bibData.year || "xxxx";

  // 3. Title word
  const titleKey = getSignificantTitleWord(bibData.title);

  // Combine to create ID
  const citeKey = `${authorKey}${yearKey}${titleKey}`;


  // --- Generate BibTeX string (Reproducing Go code's WriteToFile) ---
  
  // Combine page range (Use LaTeX standard double hyphen "--")
  let pages = bibData.startpg;
  if (bibData.endpg && bibData.endpg !== bibData.startpg) {
    pages += "--" + bibData.endpg;
  }

  const authorStr = bibData.authors.join(' and ');

  let bibtex = `@article{${citeKey},\n`;
  if (bibData.authors.length) bibtex += `  author = {${authorStr}},\n`;
  if (bibData.title)   bibtex += `  title = {${bibData.title}},\n`;
  if (bibData.journal) bibtex += `  journal = {${bibData.journal}},\n`;
  if (bibData.year)    bibtex += `  year = {${bibData.year}},\n`;
  if (bibData.volume)  bibtex += `  volume = {${bibData.volume}},\n`;
  if (bibData.issue)   bibtex += `  number = {${bibData.issue}},\n`; // 'number' is more common than 'issue' in BibTeX
  if (pages)           bibtex += `  pages = {${pages}},\n`;
  if (bibData.doi)     bibtex += `  doi = {${bibData.doi}},\n`;
  if (bibData.url)     bibtex += `  url = {${bibData.url}},\n`;
  bibtex += `}`;

  return bibtex;
}

chrome.downloads.onCreated.addListener((downloadItem) => {
  // Enhanced detection logic
  // Target RIS files from Nature or Springer domains
  const isTargetDomain = 
    downloadItem.url.includes("nature.com") || 
    downloadItem.url.includes("springer.com") || 
    downloadItem.referrer.includes("nature.com");

  const isRis = 
    downloadItem.filename.endsWith(".ris") || 
    downloadItem.mime === "application/x-research-info-systems" ||
    downloadItem.url.includes("format=refman"); // Add check for URL parameters

  if (isTargetDomain && isRis) {
    
    // 1. Cancel download immediately
    chrome.downloads.cancel(downloadItem.id);

    // 2. Fetch data
    fetch(downloadItem.url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        return response.text();
      })
      .then(text => {
        // Check if HTML is returned (e.g., login screen)
        if (text.trim().startsWith("<!DOCTYPE") || text.includes("<html")) {
            return;
        }

        const bibtex = convertRisToBibtex(text);

        // 3. Send to view
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: "displayBibtex",
              data: bibtex
            });
          }
        });
      })
      .catch(err => {});
  }
});

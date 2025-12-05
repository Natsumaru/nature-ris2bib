# Nature RIS to BibTeX

A Chrome extension that automatically intercepts RIS file downloads from Nature and Springer websites, converts them to BibTeX format, and displays the result in a popup modal for easy copying.

**Why does nature not provide bibtex citation download???**

## Features

- **Automatic Interception**: Detects `.ris` downloads from `nature.com` and `springer.com`.
- **Instant Conversion**: Converts RIS data to BibTeX format on the fly.
- **Smart ID Generation**: Generates BibTeX citation keys based on the first author, year, and a significant word from the title (e.g., `Author2024Title`).
- **Clean Interface**: Displays the generated BibTeX in a clean modal overlay on the current page.

## Installation

1. Clone or download this repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable **Developer mode** in the top right corner.
4. Click **Load unpacked** and select the directory containing this extension.

## Usage

1. Visit an article on [Nature](https://www.nature.com) or [Springer](https://link.springer.com).
2. Look for the "Cite this article" or "Download citation" link.
3. Choose the **RIS** format.
4. Instead of downloading a file, a modal will appear with the BibTeX citation ready to be copied.

## Credits

This extension's logic is partially based on the Go implementation [ris-2-bib](https://github.com/harrisonlabollita/ris-2-bib) by Harrison LaBollita.

## License

MIT License

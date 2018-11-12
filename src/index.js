const fs = require('fs');
const PDFParser = require('pdf2json');

const pdfParser = new PDFParser();
const keyMap = {
  [1.625]: 'name',
  [22.063]: 'city',
  [29.703]: 'county',
  [36.125]: 'tier',
  [42.5]: 'subTier'
};

function convert(source) {
  return new Promise((resolve, reject) => {
    pdfParser.on('pdfParser_dataError', ({ parserError }) => reject(parserError));
    pdfParser.on('pdfParser_dataReady', data => resolve(data));

    pdfParser.loadPDF(`./src/${source}.pdf`);
  });
}

function groupBy(target, start, end, fn) {
  return target
    .filter(({ y }) => y >= start && y < end)
    .reduce((line, { x, R }) => {
      const key = keyMap[x];

      if (key) {
        const text = unescape(R[0].T);

        if (key === 'tier' || key === 'subTier') {
          line[key] = (line[key] || []).concat(text);
        } else {
          line[key] = text;
        }
      }

      return line;
    }, {});
}

function processPage({ HLines, Texts }) {
  const lines = [0, ...HLines.map(({ y }) => y), 99];

  return lines
    .reduce((result, line, index) => {
      if (index < lines.length - 1) {
        return result.concat(groupBy(Texts, line, lines[index + 1]));
      }
      return result;
    }, [])
    .filter(line => Object.keys(line).length > 0);
}

function processFile({ formImage: { Pages: pages } }) {
  let previousPage = [];

  return pages.reduce((result, data) => {
    const page = processPage(data);

    if (!page[0].name) {
      page[0] = {
        ...previousPage[previousPage.length - 1],
        ...page[0]
      };
    }
    previousPage = page;

    return result.concat(page[page.length - 1].tier ? page : page.slice(0, -1));
  }, []);
}

convert('test2')
  .then(file => console.log(processFile(file)))
  .catch(err => console.error(err));

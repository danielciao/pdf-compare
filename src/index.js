const fs = require('fs');
const PDFParser = require('pdf2json');

const PARTIAL = '$partial';
const pdfParser = new PDFParser();
const keyMap = {
  [1.625]: 'name',
  [22.063]: 'city',
  [29.703]: 'county',
  [36.125]: 'tier',
  [42.5]: 'subTier'
};

function empty(object) {
  return Object.keys(object).length === 0;
}

function convert(source) {
  return new Promise((resolve, reject) => {
    pdfParser.on('pdfParser_dataError', ({ parserError }) => reject(parserError));
    pdfParser.on('pdfParser_dataReady', data => resolve(data));

    pdfParser.loadPDF(`./data/${source}.pdf`);
  });
}

function writeToFile(fileName) {
  return data => {
    console.log(Object.keys(data).length);
    fs.writeFileSync(`./${fileName}.json`, JSON.stringify(data, null, 2));
  };
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

  return lines.reduce((result, line, index) => {
    if (index < lines.length - 1) {
      const { name, ...rest } = groupBy(Texts, line, lines[index + 1]);

      if (!empty(rest)) {
        result[name || PARTIAL] = { ...rest };
      }
    }
    return result;
  }, {});
}

function processData({ formImage: { Pages: pages } }) {
  let processedPage;

  return {
    ...pages.reduce((result, data) => {
      if (!processedPage) {
        processedPage = processPage(data);
      } else {
        const { [PARTIAL]: partial, ...rest } = processPage(data);

        if (partial) {
          const [lastKey] = Object.keys(processedPage).slice(-1);

          processedPage[lastKey] = {
            ...processedPage[lastKey],
            ...partial
          };
        }

        result = {
          ...result,
          ...processedPage
        };

        processedPage = rest;
      }

      return result;
    }, {}),
    ...processedPage
  };
}

convert('2018-11-12_Tier_2_5_Register_of_Sponsors')
  .then(processData)
  .then(writeToFile('2018-11-12'))
  .catch(err => console.error(err));

// Promise.all([
//   convert('2018-10-24-Tier-2_5-Register-of-Sponsors').then(processData),
//   convert('2018-11-12_Tier_2_5_Register_of_Sponsors').then(processData)
// ])
//   .then(([oldCompanies, newCompanies]) => {
//     console.log(Object.keys(oldCompanies).length, Object.keys(newCompanies).length);

//     return Object.keys(oldCompanies).reduce((result, name) => {
//       if (!newCompanies[name]) {
//         result[name] = oldCompanies[name];
//         console.log(result);
//       }
//     }, {});
//   })
//   .then(data => console.log(data))
//   .catch(err => console.error(err));

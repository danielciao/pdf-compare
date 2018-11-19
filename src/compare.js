const oldCompanies = require('../2018-10-24.json');
const newCompanies = require('../2018-11-12.json');

function writeToFile(fileName) {
  return data => {
    console.log(Object.keys(data).length);
    fs.writeFileSync(`./${fileName}.json`, JSON.stringify(data, null, 2));
  };
}

Object.keys(newCompanies).reduce((result, name) => {
  if (!oldCompanies[name]) {
    const { city, county, tier, subTier } = newCompanies[name];
    if (tier.length > 1) {
      console.log(`${name.replace(',', ' ')},${city||''},${county||''},${tier[0]},${subTier[0]},${tier[1]},${subTier[1]}`);
    } else {
      console.log(`${name.replace(',', ' ')},${city||''},${county||''},${tier[0]},${subTier[0]}`);
    }
  }
}, {});

// Promise.resolve(
//   Object.keys(oldCompanies).reduce((result, name) => {
//     if (!newCompanies[name]) {
//       // result.test = 3;
//       console.log(result);
//     }
//   }, {})
// ).then(writeToFile('revoked'));

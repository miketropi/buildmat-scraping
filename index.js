const puppeteer = require('puppeteer');
const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
app.options('*', cors());

const port = 3000

app.get('/', async (req, res) => {
  console.log(`Hit /:`)
  res.send('Hello...!') 
})

app.get('/:handle', async (req, res) => {
  console.log(`Hit /:handle: ${ req.params?.handle }`)
  const filterData = await crapingCollectionFilter(req.params?.handle);
  res.json(filterData)
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

const crapingCollectionFilter = async (handle) => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  // Navigate the page to a URL
  await page.goto(`https://www.buildmat.com.au/collections/${ handle }`);

  // Set screen size
  // await page.setViewport({width: 1080, height: 1024});
  const filterSelector = '.boost-pfs-filter-options-wrapper';  
  const containerHandle = await page.$(filterSelector);    
  try {
    const filterSelectorHtml = await page.evaluate(filterSelector => [...filterSelector.querySelectorAll('.boost-pfs-filter-option')].map(elem => {
      let prefix = [
        { name: 'Brand', prefix: '' },
        { name: 'Product Type', prefix: 'Sub Category_' },
        { name: 'Colour', prefix: 'Colour_' },
        { name: 'Range', prefix: 'range_' },
        { name: 'Features', prefix: 'features_' }, 
        { name: 'WELS Rating', prefix: 'WELS Rating_' }, 
        { name: 'Shape', prefix: 'shape_' }, 
      ];

      let filterLabel = elem.querySelector('.boost-pfs-filter-option-title-text').textContent.trim();
      return {
        label: filterLabel,
        options: ((eOpts) => {
          return eOpts.map(item => {
            let optName = item.textContent;
            let findPrefix = prefix.find(_p => _p.name == filterLabel);
            let _prefix = (findPrefix?.prefix ? findPrefix.prefix : '');
            return {
              value: `${ _prefix }${ optName }`,
              label: optName
            };
          })
        })([...elem.querySelectorAll('.boost-pfs-filter-option-value')])
      }
    }), containerHandle);  
    
    await browser.close();
    return filterSelectorHtml;
  } catch (e) {
    console.log(e.message)
    return false;
  }
}
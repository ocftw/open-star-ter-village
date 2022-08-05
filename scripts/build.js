const fs = require('fs/promises')
const path = require('path')

require('@babel/register') // to compile React

const templateFile = path.resolve(__dirname, '..', 'public', 'index.html')
const outputFolder = path.resolve(__dirname, '..', 'dist')

// build function writes the static html to a file in the dist directory
exports.buildPage = async function (page, content, options) {
  const pagename = `${page}.html`
  const outputFile = path.join(outputFolder, pagename)
  try {
    const lang = 'zh'
    const head = ''
    const title = options?.title || ''
    const description = options?.description || ''
    const templateData = await fs.readFile(templateFile, 'utf-8')

    const outputData = templateData
      .replace('{{lang}}', lang)
      .replace('{{head}}', head)
      .replace('{{title}}', title)
      .replace('{{description}}', description)
      .replace('{{content}}', content)

    await fs.writeFile(outputFile, outputData)

    console.log('Build of ' + pagename + ' successful')
  } catch (err) {
    if (err) {
      console.error(err)
    }
  }
}

require('./pages.js')

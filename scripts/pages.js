import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { buildPage } from './build'

// get the component
import Home from '../src/pages/index'

const pages = [
  ['index', Home]
]

// build the page
pages.forEach(([page, Component]) => {
  buildPage(page, ReactDOMServer.renderToStaticMarkup(React.createElement(Component)), Component.__staticPageOptions)
})

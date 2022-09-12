import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { buildPage } from './build'

// get the component
import Home from '../src/pages/index'
import RedirectManual from '../src/pages/s/manual'
import NotFoundPage from '../src/pages/404'

const pages = [
  ['index', Home],
  ['s/manual', RedirectManual],
  ['404', NotFoundPage],
]

// build the page
pages.forEach(([page, Component]) => {
  buildPage(page, ReactDOMServer.renderToStaticMarkup(React.createElement(Component)), Component.__staticPageOptions)
})

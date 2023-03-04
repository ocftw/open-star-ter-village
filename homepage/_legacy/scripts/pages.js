import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { buildPage } from './build'

// get the component
import Home from '../src/pages/index'
import RedirectManual from '../src/pages/s/manual'
import NotFoundPage from '../src/pages/404'
import Campaign from '../src/pages/campaign'
import { siteData } from '../src/constants'

const pages = [
  ['index', Home],
  ['campaign', Campaign],
  ['s/manual', RedirectManual],
  ['404', NotFoundPage],
]

// build the page
pages.forEach(([page, Component]) => {
  const mergedStaticPageOptions = {
    ...siteData,
    ...Component.__staticPageOptions,
  }
  buildPage(page, ReactDOMServer.renderToStaticMarkup(React.createElement(Component)), mergedStaticPageOptions)
})

import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { buildPage } from './build'

// get the component
import Home from '../src/pages/index'

const pages = [
  ['index', <Home />, { title: "My Website", description: "Welcome to my website, it's static and splendid!" }]
]

// build the page
pages.forEach(([page, Component, options]) => {
  buildPage(page, ReactDOMServer.renderToStaticMarkup(Component), options)
})

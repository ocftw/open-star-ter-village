import React, { Component } from "react";
import { GatsbyImage, getImage } from "gatsby-plugin-image";
import { graphql } from "gatsby";

import Layout from "../components/layout";
import SEO from "../components/seo";

export default class PhotosPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activePopup: false,
      selectedItem: 0
    };
  }

  render() {
    const { data } = this.props;
    const { activePopup, selectedItem } = this.state;

    return (
      <Layout>
        <SEO
          title="Photos"
          keywords={[`Rohit Gupta`, `Frontend Developer`, `Developer`, `Photo`]}
        />
        <div className="site-container blogs-page" id="Blogs">
          <div className="container">
            <div className="section-head">
              <h1 className="line-heading h2">Photos</h1>
            </div>
            <ul className="photos-page-list">
              {data.contentfulPhotos.photos.map((item, index) => {
                return (
                  <li key={index} className="item">
                    <div
                      className="inner"
                      onClick={() => {
                        this.setState({
                          activePopup: true,
                          selectedItem: index
                        });
                      }}
                    >
                      <GatsbyImage
                        image={getImage(item.gatsbyImageData)}
                        objectFit="cover"
                        objectPosition="50% 50%"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            {activePopup ? (
              <div className="rg-popup">
                <span
                  className="popup-layer"
                  onClick={() => {
                    this.setState({
                      activePopup: false
                    });
                  }}
                ></span>

                <div className="popup-inner">
                  <i
                    className="fas fa-times"
                    onClick={() => {
                      this.setState({
                        activePopup: false
                      });
                    }}
                  ></i>
                  <GatsbyImage
                    image={getImage(data.contentfulPhotos.photos[selectedItem].gatsbyImageData)}
                    objectFit="cover"
                    objectPosition="50% 50%"
                    alt="popup-img"
                  />
                </div>
              </div>
            ) : (
              ""
            )}
          </div>
        </div>
      </Layout>
    );
  }
}
export const pageQuery = graphql`
  query PhotosPageQuery {
    contentfulPhotos(node_locale: { eq: "zh-Hant-TW" }) {
      photos {
        gatsbyImageData(width: 600)
      }
    }
  }
`;

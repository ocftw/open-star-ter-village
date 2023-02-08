import React from "react";
import { graphql } from "gatsby";
import { GatsbyImage, getImage } from "gatsby-plugin-image";
import { Link } from "gatsby";
import moment from "moment";

import Layout from "../components/layout";
import SEO from "../components/seo";

const BlogsPage = ({ data }) => {
  return (
    <Layout>
      <SEO
        title="Blogs"
        keywords={[`Rohit Gupta`, `Frontend Developer`, `Developer`, `Blogs`]}
      />
      <div className="site-container blogs-page" id="Blogs">
        <div className="container">
          <div className="section-head">
            <h1 className="line-heading h2">Blogs</h1>
          </div>
          <ul
            className={`blogs-list ${data.allContentfulBlogs.edges.length < 5 ? "few-blogs" : ""
              }`}
          >
            {data.allContentfulBlogs.edges.map((item, index) => {
              return (
                <li key={index} className="item">
                  <div className="inner">
                    <Link className="link" to={`/${item.node.slug}`} />
                    {item.node.featureImage ? (
                      <GatsbyImage
                        image={getImage(item.node.featureImage.gatsbyImageData)}
                        objectFit="cover"
                        objectPosition="50% 50%"
                      />
                    ) : (
                      <div className="no-image"></div>
                    )}
                    <div className="details">
                      <h3 className="title">{item.node.title}</h3>
                      <span className="date">
                        <i className="fas fa-calendar-alt"></i>{" "}
                        {moment(item.node.createdAt).format("LL")}
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query BlogsQuery {
    allContentfulBlogs(filter: { node_locale: { eq: "zh-Hant-TW" } }, sort: { fields: createdAt, order: DESC }) {
      edges {
        node {
          title
          slug
          featureImage {
            gatsbyImageData(width: 1500, aspectRatio: 1.78)
          }
          createdAt
        }
      }
    }
  }
`;

export default BlogsPage;

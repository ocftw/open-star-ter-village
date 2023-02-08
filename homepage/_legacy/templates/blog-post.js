import React from "react";
import { graphql } from "gatsby";
import { GatsbyImage, getImage } from "gatsby-plugin-image";
import moment from "moment";

import Layout from "../components/layout";
import SEO from "../components/seo";
import Share from "../components/share";

const BlogPost = ({ data }) => {
  const blog = data.contentfulBlogs;

  const siteurl = data.contentfulSiteInformation.siteUrl + "/";
  const socialConfigss = {
    site: {
      siteMetadata: { siteurl }
    },
    title: blog.title,
    slug: blog.slug
  };

  return (
    <Layout>
      <SEO
        title={blog.title}
        keywords={[
          `Rohit Gupta`,
          `Frontend Developer`,
          `Developer`,
          `${blog.title}`
        ]}
      />
      <div className="site-container blog-post">
        <div className="container">
          {blog.featureImage ? (
            <GatsbyImage
              className="feature-img"
              image={getImage(blog.featureImage.gatsbyImageData)}
              objectFit="cover"
              objectPosition="50% 50%"
            />
          ) : (
            <div className="no-image"></div>
          )}

          <div className="details">
            <h1 className="title">{blog.title}</h1>
            <span className="date">
              <i className="fas fa-calendar-alt"></i>{" "}
              {moment(blog.createdAt).format("LL")}
            </span>
            <div
              dangerouslySetInnerHTML={{
                __html: blog.description.childMarkdownRemark.html
              }}
            />
          </div>
          <Share
            socialConfig={{
              config: {
                url: `${siteurl}${socialConfigss.slug}`,
                title: `${socialConfigss.title}`
              }
            }}
          />
        </div>
      </div>
    </Layout>
  );
}

export const pageQuery = graphql`
  query SinglePostQuery($slug: String!) {
    contentfulBlogs(node_locale: { eq: "zh-Hant-TW" }, slug: { eq: $slug }) {
      id
      title
      slug
      featureImage {
        gatsbyImageData(width: 1500, aspectRatio: 1.78)
      }
      description {
        childMarkdownRemark {
          html
        }
      }
      createdAt
    }
    contentfulSiteInformation(node_locale: { eq: "zh-Hant-TW" }) {
      siteUrl
    }
  }
`;

export default BlogPost;

import React from "react";
import { graphql } from "gatsby";

import Layout from "../components/layout";
import SEO from "../components/seo";

import Banner from "../components/banner";
import About from "../components/about";
import Service from "../components/service";
import Work from "../components/work";
import Blogs from "../components/blogs";
import Testimonial from "../components/testimonial";
import Contact from "../components/contact";
import Photos from "../components/photos";

const IndexPage = ({ data }) => (
  <Layout header="home">
    <SEO
      title={data.contentfulSiteInformation.name}
      keywords={[`Rohit Gupta`, `Frontend Developer`, `Developer`]}
    />
    <Banner data={data.contentfulSiteInformation}></Banner>

    {data.contentfulSiteInformation.menus
      .filter(item => item === "About")
      .map(t => {
        return <About key="About" data={data.allContentfulAbout}></About>;
      })}

    {data.contentfulSiteInformation.menus
      .filter(item => item === "Service")
      .map(t => {
        return (
          <Service key="Service" data={data.allContentfulService}></Service>
        );
      })}

    {data.contentfulSiteInformation.menus
      .filter(item => item === "Blogs")
      .map(t => {
        return <Blogs key="Blogs" data={data.allContentfulBlogs}></Blogs>;
      })}

    {data.contentfulSiteInformation.menus
      .filter(item => item === "Work")
      .map(t => {
        return <Work key="Work" data={data.allContentfulWorks}></Work>;
      })}

    {data.contentfulSiteInformation.menus
      .filter(item => item === "Testimonials")
      .map(t => {
        return (
          <Testimonial
            key="Testimonial"
            data={data.allContentfulTestimonials}
          ></Testimonial>
        );
      })}

    {data.contentfulSiteInformation.menus
      .filter(item => item === "Photos")
      .map(t => {
        return <Photos key="Photos" data={data.contentfulPhotos}></Photos>;
      })}

    {data.contentfulSiteInformation.menus
      .filter(item => item === "Contact")
      .map(t => {
        return (
          <Contact key="Contact" data={data.contentfulSiteInformation.siteName}></Contact>
        );
      })}
  </Layout>
);

export default IndexPage;

export const pageQuery = graphql`
  query AboutQuery {
    allContentfulAbout(filter: { node_locale: { eq: "zh-Hant-TW" } }) {
      edges {
        node {
          name
          photo {
            gatsbyImageData
          }
          designation
          # age
          id
          # location
          # description {
          #   childMarkdownRemark {
          #     html
          #   }
          # }
          # bannerList
        }
      }
    }
    allContentfulService(filter: { node_locale: { eq: "zh-Hant-TW" } }) {
      edges {
        node {
          title
          description {
            childMarkdownRemark {
              html
            }
          }
        }
      }
    }
    allContentfulBlogs(filter: { node_locale: { eq: "zh-Hant-TW" } }, limit: 5, sort: { fields: createdAt, order: DESC }) {
      edges {
        node {
          title
          slug
          featureImage {
            gatsbyImageData(width: 600, aspectRatio: 1.78)
          }
          createdAt
        }
      }
    }
    allContentfulTestimonials(filter: { node_locale: { eq: "zh-Hant-TW" } }) {
      edges {
        node {
          name
          subTitle
          description {
            childMarkdownRemark {
              html
            }
          }
          avatarImage {
            gatsbyImageData(width: 200, aspectRatio: 1)
          }
        }
      }
    }
    allContentfulWorks(filter: { node_locale: { eq: "zh-Hant-TW" } }) {
      edges {
        node {
          siteName
          url
          image {
            gatsbyImageData(width: 600, aspectRatio: 1.78)
          }
        }
      }
    }
    contentfulPhotos(node_locale: { eq: "zh-Hant-TW" }) {
      photos {
        gatsbyImageData(width: 600, aspectRatio: 1.78)
      }
    }
    contentfulSiteInformation(node_locale: { eq: "zh-Hant-TW" }) {
      siteName
      heroImage {
        gatsbyImageData(layout: FULL_WIDTH, aspectRatio: 1.78)
      }
      menus
    }
  }
`;

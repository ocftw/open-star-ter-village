import React from "react";
import { GatsbyImage, getImage } from "gatsby-plugin-image";

const About = ({ data }) => (
  <div className="about section" id="About">
    <div className="container">
      {
        data.edges.map((item, index) => {
          return (
            <div className="about-main row" key={`about-${index}`}>
              <div className="left col-md-5 col-lg-4 mb-3">
                {
                  item.node.photo &&
                  <GatsbyImage
                    image={getImage(item.node.photo.gatsbyImageData)}
                    objectFit="cover"
                    objectPosition="top center"
                  />
                }
              </div>
              <div className="left col-md-7 col-lg-8">
                <div className="about-details">
                  <span className="name">{item.node.name}</span>
                  <h2 className="sub-position">{item.node.designation}</h2>
                  {item.node.description && (
                    <div
                      dangerouslySetInnerHTML={{
                        __html: item.node.description.childMarkdownRemark.html
                      }}
                    />
                  )}
                  <ul className="details">
                    <li>
                      <strong>Full Name</strong>
                      <p>{item.node.name}</p>
                    </li>
                    <li>
                      <strong>Age</strong>
                      <p>{item.node.age} Years</p>
                    </li>
                    <li>
                      <strong>Location</strong>
                      <p>{item.node.location}</p>
                    </li>
                    <li>
                      <strong>Email</strong>
                      <p>
                        <a href={`mailto:${item.node.gmail}`}>{item.node.gmail}</a>
                      </p>
                    </li>
                  </ul>
                  <div className="socials">
                    <ul>
                      <li>
                        <a
                          className="fab fa-facebook-f"
                          href={item.node.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                        ></a>
                      </li>
                      <li>
                        <a
                          className="fab fa-twitter"
                          href={item.node.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                        ></a>
                      </li>
                      <li>
                        <a
                          className="fab fa-instagram"
                          href={item.node.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                        ></a>
                      </li>
                      <li>
                        <a
                          className="fab fa-linkedin-in"
                          href={item.node.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                        ></a>
                      </li>
                      <li>
                        <a
                          className="fab fa-github"
                          href={item.node.github}
                          target="_blank"
                          rel="noopener noreferrer"
                        ></a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>)
        })
      }
    </div>
  </div>
);

export default About;

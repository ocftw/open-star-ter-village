import React from "react";
import { GatsbyImage, getImage } from "gatsby-plugin-image";

const Banner = ({ data }) => {
  return (
    <div className="banner">
      {
        data.heroImage &&
        <GatsbyImage
          image={getImage(data.heroImage.gatsbyImageData)}
          objectFit="cover"
          objectPosition="50% 50%"
        />
      }
      <div className="container">
        <div className="banner-details">
          <h1>{data.siteName}</h1>
          <span>{data.designation}</span>
          {data.bannerList && (
            <ul className="sub-data">
              {data.bannerList.map((item, index) => {
                return <li key={index}>{item}</li>;
              })}
            </ul>
          )}
          <ul className="social">
            {data.facebook && (
              <li>
                <a
                  className="fab fa-facebook-f"
                  href={data.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                ></a>
              </li>
            )}
            {data.twitter && (
              <li>
                <a
                  className="fab fa-twitter"
                  href={data.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                ></a>
              </li>
            )}
            {data.instagram && (
              <li>
                <a
                  className="fab fa-instagram"
                  href={data.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                ></a>
              </li>
            )}
            {data.linkedin && (
              <li>
                <a
                  className="fab fa-linkedin-in"
                  href={data.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                ></a>
              </li>
            )}
            {data.github && (
              <li>
                <a
                  className="fab fa-github"
                  href={data.github}
                  target="_blank"
                  rel="noopener noreferrer"
                ></a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Banner;

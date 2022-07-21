import React from "react";
import { GatsbyImage, getImage } from "gatsby-plugin-image";

const Work = ({ data }) => {
  return (
    <div className="work section" id="Work">
      <div className="container">
        <div className="section-head">
          <h2 className="text-center">Work</h2>
        </div>
        <ul className="work-list">
          {data.edges.map((item, index) => {
            return (
              <li key={index} className="item">
                <div className="inner">
                  <a href={item.node.url}>
                    <GatsbyImage
                      image={getImage(item.node.image)}
                      objectFit="cover"
                      objectPosition="50% 50%"
                    />
                    <span className="name">{item.node.siteName}</span>
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default Work;

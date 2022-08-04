import React from "react";
import { GatsbyImage, getImage } from "gatsby-plugin-image";

const Section = ({ data }) => {
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
          <h1>{data.title}</h1>
          <span>{data.subtitle}</span>
          <div dangerouslySetInnerHTML={{
            __html: data.content
          }} />
          {data.video &&
            <div class="video-responsive">
              <iframe
                width="560"
                height="315"
                src={`https://www.youtube.com/embed/${data.video}`}
                title="YouTube video player"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
          }
        </div>
      </div>
    </div>
  );
}

export default Section;

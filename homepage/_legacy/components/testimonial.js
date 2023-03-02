import React from "react";
import Slider from "react-slick";
import { GatsbyImage, getImage } from "gatsby-plugin-image";

const settings = {
  dots: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  pauseOnHover: true,
  autoplaySpeed: 6000
};

const Testimonial = ({ data }) => {
  return (
    <div className="slider-section section testimonials" id="Testimonials">
      <div className="container">
        <div className="section-head text-center">
          <h2>Testimonials</h2>
          <p>People I've worked with have said some nice things...</p>
        </div>
        <Slider {...settings}>
          {data.edges.map((item, index) => {
            return (
              <div key={index} className="testimonials-item">
                <div className="testi-inner">
                  {
                    item.node.avatarImage &&
                    <GatsbyImage
                      image={getImage(item.node.avatarImage.gatsbyImageData)}
                      className="avatar"
                      objectFit="cover"
                      objectPosition="50% 50%"
                    />
                  }
                  <div
                    dangerouslySetInnerHTML={{
                      __html: item.node.description.childMarkdownRemark.html
                    }}
                  />
                  <h3 className="name">{item.node.name}</h3>
                  <span className="sub-name">{item.node.subTitle}</span>
                </div>
              </div>
            );
          })}
        </Slider>
      </div>
    </div>
  );
}

export default Testimonial;

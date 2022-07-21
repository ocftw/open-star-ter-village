import React from "react";

const Footer = ({ siteName }) => {
  return (
    <div className="site-footer" id="footer">
      <div className="container">
        <span>{siteName}</span>
      </div>
    </div>
  );
}

export default Footer;

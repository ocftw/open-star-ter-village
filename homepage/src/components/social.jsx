const Social = ({
  facebook,
  twitter,
  instagram,
  linkedin,
  discord,
  github,
}) => (
  <ul className="social">
    {facebook && (
      <li>
        <a
          className="fab fa-facebook-f"
          href={facebook}
          target="_blank"
          rel="noopener noreferrer"
        ></a>
      </li>
    )}
    {twitter && (
      <li>
        <a
          className="fab fa-twitter"
          href={twitter}
          target="_blank"
          rel="noopener noreferrer"
        ></a>
      </li>
    )}
    {instagram && (
      <li>
        <a
          className="fab fa-instagram"
          href={instagram}
          target="_blank"
          rel="noopener noreferrer"
        ></a>
      </li>
    )}
    {linkedin && (
      <li>
        <a
          className="fab fa-linkedin-in"
          href={linkedin}
          target="_blank"
          rel="noopener noreferrer"
        ></a>
      </li>
    )}
    {discord && (
      <li>
        <a
          className="fab fa-discord"
          href={discord}
          target="_blank"
          rel="noopener noreferrer"
        ></a>
      </li>
    )}
    {github && (
      <li>
        <a
          className="fab fa-github"
          href={github}
          target="_blank"
          rel="noopener noreferrer"
        ></a>
      </li>
    )}
  </ul>
);

Social.defaultProps = {
  instagram: `https://instagram.com/openstartervillage/`,
  discord: `https://discord.gg/JnTHGnxwYS`,
  github: `https://github.com/ocftw/open-star-ter-village`,
};

export default Social;

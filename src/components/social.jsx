const Social = ({ data }) => (
  <ul className="social">
    {data.facebook && (
      <li>
        <a
          className="fab fa-facebook-f"
          href={data.facebook}
          target="_blank"
          rel="noopener noreferrer"
        >
        </a>
      </li>
    )}
    {data.twitter && (
      <li>
        <a
          className="fab fa-twitter"
          href={data.twitter}
          target="_blank"
          rel="noopener noreferrer"
        >
        </a>
      </li>
    )}
    {data.instagram && (
      <li>
        <a
          className="fab fa-instagram"
          href={data.instagram}
          target="_blank"
          rel="noopener noreferrer"
        >
        </a>
      </li>
    )}
    {data.linkedin && (
      <li>
        <a
          className="fab fa-linkedin-in"
          href={data.linkedin}
          target="_blank"
          rel="noopener noreferrer"
        >
        </a>
      </li>
    )}
    {data.discord && (
      <li>
        <a
          className="fab fa-discord"
          href={data.discord}
          target="_blank"
          rel="noopener noreferrer"
        >
        </a>
      </li>
    )}
    {data.github && (
      <li>
        <a
          className="fab fa-github"
          href={data.github}
          target="_blank"
          rel="noopener noreferrer"
        >
        </a>
      </li>
    )}
  </ul>
)

export default Social
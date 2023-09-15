import Link from 'next/link';
import socialMedia from '../../_data/social_media.json';

const SocialMedia = ({ links = null }) => {
  const socialMediaList = links || socialMedia.links || [];

  const socialMediaLinks = socialMediaList.map((link) => {
    const { type, url } = link;
    switch (type) {
      case 'facebook':
        return (
          <li key="social_media__facebook">
            <Link
              className="fab fa-facebook-f"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            />
          </li>
        );
      case 'twitter':
        return (
          <li key="social_media__twitter">
            <Link
              className="fab fa-twitter"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            />
          </li>
        );
      case 'instagram':
        return (
          <li key="social_media__instagram">
            <Link
              className="fab fa-instagram"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            />
          </li>
        );
      case 'linkedin':
        return (
          <li key="social_media__linkedin">
            <Link
              className="fab fa-linkedin-in"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            />
          </li>
        );
      case 'discord':
        return (
          <li key="social_media__discord">
            <Link
              className="fab fa-discord"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            />
          </li>
        );
      case 'github':
        return (
          <li key="social_media__github">
            <Link
              className="fab fa-github"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            />
          </li>
        );
    }
  });

  return <ul className="social">{socialMediaLinks}</ul>;
};

export default SocialMedia;

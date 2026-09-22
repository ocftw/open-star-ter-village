import { ParseMarkdownAndHtml } from './parseMarkdownAndHtml';
import TrackedPromotionLink from './trackedPromotionLink';

const CtaBanner = ({
  id,
  title,
  content,
  ctaLabel,
  ctaUrl,
  analyticsId,
  openInNewTab = false,
}) => (
  <section className="cta-banner section" id={id}>
    <div className="container">
      <div className="cta-banner-content">
        <div>
          <h2>{title}</h2>
          <ParseMarkdownAndHtml markdown={true}>{content}</ParseMarkdownAndHtml>
        </div>
        <TrackedPromotionLink
          analyticsId={analyticsId}
          creativeName="Resource online game banner"
          creativeSlot="resource_online_game_banner"
          href={ctaUrl}
          className="cta-banner-link"
          target={openInNewTab ? '_blank' : undefined}
          rel={openInNewTab ? 'noopener noreferrer' : undefined}
          locale={false}
        >
          {ctaLabel}
        </TrackedPromotionLink>
      </div>
    </div>
  </section>
);

export default CtaBanner;

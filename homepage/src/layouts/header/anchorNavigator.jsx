import Link from "next/link";

const AnchorNavigator = ({ anchors = [] }) => (
    <div id="anchor-nav" className="sticky-top list-group list-group-horizontal">
      {anchors.map(anchor => (
        <Link key={anchor.id} className="list-group-item list-group-item-action" href={`#${anchor.id}`}>{anchor.title}</Link>
      ))}
    </div>
  );

export default AnchorNavigator;

const Logo = ({ text, src }) => (
  <div className="flex flex-row flex-align-center">
    <span className="logo-title">{text}</span>
    <img className="logo-image" src={src} />
  </div>
)

export default Logo

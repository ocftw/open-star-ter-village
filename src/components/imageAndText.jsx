const ImageAndText = () => (
  <div className="section" id={"game-intro"}>
    <div className="container">
      <div className="image-and-text-main row">
        <div className="left col-md-5 col-lg-4 mb-3">
          <img src="image/boardgame.png" alt="boardgame-image" />
        </div>
        <div className="left col-md-7 col-lg-8">
          <div className="image-and-text-details">
            <span className="name">{`基本遊戲介紹`}</span>
            <h2 className="sub-position">{`?????`}</h2>
            <div
              dangerouslySetInnerHTML={{
                __html: `tags <br /> and content`
              }}
            />
            <ul className="details">
              <li>
                <strong>Full Name</strong>
                <p>{`full name`}</p>
              </li>
              <li>
                <strong>Age</strong>
                <p>{`age`} Years</p>
              </li>
              <li>
                <strong>Location</strong>
                <p>{`what location`}</p>
              </li>
              <li>
                <strong>Email</strong>
                <p>
                  <a href={`mailto:${`mail`}`}>{`mail`}</a>
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default ImageAndText

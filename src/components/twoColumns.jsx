const TwoColumns = () => (
  <div className="section" id="project-intro">
    <div className="container">
      <div className="section-head">
        <h2>{`專案介紹`}</h2>
      </div>
      <div className="row">
        <div key={`intro 1`} className="col-md-6 mb-3">
          <div className="section-main">
            <h3>{`what is the problem`}</h3>
            <div
              dangerouslySetInnerHTML={{
                __html: `開源生態圈內最常遇到的職業是工程師和UIUX相關工作者，有時讓人誤以為工程與軟體相關人士才能貢獻專案，但其實越多不同行業的人加入，就能讓生態圈有機會用不同角度的思考並解決更多面向的問題！`
              }}
            />
          </div>
        </div>
        <div key={`intro 2`} className="col-md-6 mb-3">
          <div className="section-main">
            <h3>{`why this is the solution`}</h3>
            <div
              dangerouslySetInnerHTML={{
                __html: `我們希望能透過有趣的遊戲引發大眾對開源文化的興趣，並透過好玩的方式更了解開源專案，因此彙集了開源人們實際參與的經驗，並參考海內外實際執行過的專案內容與人力配置方式，讓參與者成為一日開源人。`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  </div>
)

export default TwoColumns

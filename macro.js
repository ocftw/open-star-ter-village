/** @OnlyCurrentDoc */
var spreadsheet = SpreadsheetApp.getActive();
var deck = spreadsheet.getSheetByName('牌庫');
var deckList = spreadsheet.getSheetByName('各牌庫備考');
var playerHand = spreadsheet.getSheetByName('玩家手牌');
//build custom menu
function onOpen(){
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('開源星手村')
    .addItem('開場洗牌', 'initialShuffle')
    .addItem('翻事件卡', 'drawEventCard')
    .addSeparator()
    .addItem('重設表單', 'resetSpreadsheet')
    .addToUi();
}
//shuffle before game start
function initialShuffle() {
  deck.getRange('A2:A31').randomize();
  deck.getRange('C2:C73').randomize();
  deck.getRange('E2:E19').randomize();
};
//draw a new event card
function drawEventCard(){
  //get current size of event card deck
  var eventCardNum = deck.getRange('E2').getDataRegion(SpreadsheetApp.Dimension.ROWS).getNumRows()-1
  if (eventCardNum<18){ 
    //prevent overwrite of event card discard pile title
    //discard current event card
    deck.getRange('F2').moveTo(deck.getRange('G2').offset(17-eventCardNum,0,1,1));
  }
  //draw a new event card and organize event card deck
  deck.getRange('E2').moveTo(deck.getRange('F2'));
  deck.getRange('E3').offset(0,0,eventCardNum,1).moveTo(deck.getRange('E2').offset(0,0,eventCardNum,1));
}
//reset whole spreadsheet
function resetSpreadsheet(){
  //reset all three decks
  deck.getRange('A2:A31').setValues(deckList.getRange('A2:A31').getValues());
  deck.getRange('C2:C73').setValues(deckList.getRange('B2:B73').getValues());
  deck.getRange('E2:E19').setValues(deckList.getRange('C2:C19').getValues());
  //clear discard pile and current event card
  deck.getRangeList(['B2:B31','D2:D73','F2','G2:G19']).clear();
  //clear player hands
  playerHand.getRangeList(['A3:F5','A7:F14']).clear();
}
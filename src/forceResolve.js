//@ts-check

/*
Force card: Project subsidy(專案補助)
            put this card under a project card, that project gain +5 owner score
*/
/** @type {(project: string) => void} */
function projectOwnerScoreBonus(project) {
  //TODO: find the corresponding project on project board
  //TODO: add the +5 owner score bonus to the project
  //TODO: change the project UI to show the force effect is active
}

/*
Force card: Cloud storage(雲端硬碟)
            put this card under a project card, that project cannot lose contribution
*/
/** @type {(project: string) => void} */
function projectContributionProtection(project) {
  //TODO: find the corresponding project on project board
  //TODO: change the project state to prevent contribution lost
  //TODO: change the project UI to show the force effect is active
}

/*
Force card: Open definition/Open-source license/Opening of open era(開放定義/開源授權/開放元年)
            play two project of corresponding type (job card is still required to play)
*/
/** @type {(project: string) => void} */
function playTwoSameTypeProject(project) {
  //TODO: finish the card effect
}

/*
Force card: Teach me opensource senpai(開源教教我)
            play two job cards immediately(need to match job requirement of project on board)
*/
/** @type {(job1: string, job2?: string) => void} */
function playTwoJobCards(job1, job2) {
  //TODO: finish the card effect
}

/*
Force card: Power squat(累積深蹲之力)
            put this card in front of you(current player), gain +1 action point on your next turn
            discard this card after your next turn ends
*/
function gainOneAPNextRound() {
  //TODO: finish the card effect
}

/*
Force card: Help my project senpai(開坑救救我)
            gain contribution according to number of project you owned on board
            (you can distribute freely)
*/
function gainContributionByOwnedProject() {
  //TODO: check how many project on table was owned by current player
  //TODO: switch to contribution dialog and finish contribute
}

/*
Force card: Work with me senpai(入坑揪揪我)
            gain contribution according to number of project you joined on board
            (you can distribute freely)
*/
function gainContributionByJoinedProject() {
  //TODO: check how many project on table was joined by current player
  //TODO: switch to contribution dialog and finish contribute
}

/*
Force card: Zero transfer(零的轉移)
            choose two slots on one project, reduce contribution of these slot to 1
            choose another project to gain those contribution
*/
/** @type {(donorProject: string, recipientProject: string) => void} */
function contributionTransferBetweenProject(donorProject, recipientProject) {
  //TODO: finish card effect
}

/*
Force card: Personnel change(人事異動)
            trade all resource cards with another player
*/
/** @type {(playerId: string) => void} */
function tradeResourceCards(playerId) {
  //TODO: trade all cards with respective player according to playerId
}

/*
Force card: Pincer movement(鉗形攻勢)
            inspect the next two event cards and put them back in any order
*/
function peekNextTwoEventCardAndChange() {
  //TODO: peek next two event card
  //TODO: ask player whether they want to change the event order
}
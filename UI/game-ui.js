import { getPreFlopAutoFold, playerLeave, shufflingVerificationReport, updatePlayerSetting } from "../socket-client";
import { modes, Table } from "./table-ui";
import { getPlayerSeat, myTotalMoneyInGame } from '../services/table-server';
import { tableSubscribe } from '../services/table-server';
import { BuyInUI } from "./buyin-ui";
import { MainUI } from "./main-ui";
import { ActionUI } from "./action-ui";
import { tableSettings, myInfo, myMoneyInGame } from "../services/table-server";
import { Sound } from "./audio";
import { toggleCheckbox } from "./checkbox";
import { updatCurrency } from "./money-display";
import { verifySeed } from '../services/utils-server';
import { initializeDeck, CardShuffler } from './card-ui';
import { getMessage } from "./language-ui";

let previousMainPlayerIndex = -1;
let lastTurnSeat = -1;
let prevRoundState = "None";
let prevRound;

const mainPlayerIndex = 5;
const table = new Table();
const buyInUI = new BuyInUI();
const mainUI = new MainUI(buyInUI);
export const actionUI = new ActionUI();
const sound = new Sound();
const cardShuffler = new CardShuffler();

const showBBCheckbox = $("#showAsBBCheckbox")[0];
const showSUDCheckbox = $("#showAsSUDCheckbox")[0];
const shuffleVerificationButtonCheckboxe = $("#shuffleVerificationButton")[0];
const DisplayCards = $("#DisplayCards")[0];

showBBCheckbox.addEventListener('change', () => {
    if (showBBCheckbox.checked)
        toggleCheckbox(showSUDCheckbox, false);

    setShowInBB(showBBCheckbox.checked);
    updatePlayerSetting('showBB', showBBCheckbox.checked);
});

showSUDCheckbox.addEventListener('change', () => {
    if (showSUDCheckbox.checked)
        toggleCheckbox(showBBCheckbox, false);

    setShowInUSD(showSUDCheckbox.checked);
    updatePlayerSetting('showSUD', showSUDCheckbox.checked);
});

shuffleVerificationButtonCheckboxe.addEventListener('change', () => {
    updatePlayerSetting('shuffleVerification', shuffleVerificationButtonCheckboxe.checked);
});
DisplayCards.addEventListener('change', () => {
    updatePlayerSetting('DisplayCards', DisplayCards.checked);
});

const preFlopAutoFoldCheckboxes = $(".preFlopAutoFold .checkbox")[0];
preFlopAutoFoldCheckboxes.addEventListener('change', setPreFlopAutoFoldData);

let showInBB = false;
showBBCheckbox.checked = false;

let showInUSD = false;
showSUDCheckbox.checked = false;

const autoMuckCheckbox = $("#autoMuckCheckbox")[0];
autoMuckCheckbox.addEventListener('click', () => {
    setAutoMuck(!autoMuckCheckbox.checked);
    updatePlayerSetting('autoMuck', autoMuckCheckbox.checked);
});
let autoMuckCard = false;

function setAutoMuck(value) {
    autoMuckCard = value;
}

function setShowInBB(value) {
    showInBB = value;
    actionUI.setShowInBB(value);
    table.setShowInBB(value);
}

function setShowInUSD(value) {
    showInUSD = value;
    actionUI.setShowInUSD(value);
    table.setShowInUSD(value);
}


function setPreFlopAutoFoldData() {
    if (preFlopAutoFoldCheckboxes.checked && tableSettings.gameType == "nlh") {
        getPreFlopAutoFold(preFlopAutoFoldCheckboxes.checked, (data) => {
            data = JSON.parse(data);

            if (data.status == true) {
                mainUI.setPlayerAutoFoldCards(data.AutoFoldCards);
                const playerCards = table.getTurnPlayerCards(getPlayerSeat());
                const activeSeats = table.getActiveSeats();
                mainUI.doPreFlopAutoFold(preFlopAutoFoldCheckboxes, playerCards, activeSeats);
                return true;
            }
        });
    } else {
        mainUI.setPlayerAutoFoldCards([]);
    }
}

function onInsurance(data) {
    mainUI.showInsurance(data);
}

function onLeaveClick() {
    playerLeave();
}

function onPlayerLeave(res) {
    table.setMode(modes.None);
    actionUI.showActionUI(false);

    if (res.type === 'tournament_leave') {
        mainUI.showTournamentResult(res.hasWin, res.prize, res.rank, res.isRegister, res.register_amount, res.id, res.tournament_id);
    } else if (res.type === 'double_browser_leave') {
        mainUI.showDoubleLoginMsg(res.msg);
    }
}

function onPlayerInfo(playerInfo) {
    $(".progress").css('width', '100%');
    $(".progress-number").text('100%');
    $(".target_label").show();
    mainUI.setPlayerName(playerInfo);

    setInterval(() => {
        $(".loader").hide();
        $(".progressBarLoader").hide();
    }, 300);
}

/* function onSideBet(res) {
    mainUI.updateSideBetOptions(res.street, res.streetText, res.options);
}

function onSideBetHistory(res) {
    mainUI.updateSideBetHistory(res);
}

function onTableFreeBalance(balance) {
    mainUI.updateFreeBalance(balance);
} */

function onTableSettings(settings) {
    var usdRate = parseFloat(settings.usdRate).toFixed(2);
    mainUI.setTableName(settings.name);
    mainUI.setSmallBlind(settings.smallBlind);
    mainUI.setAnte(settings.ante);
    mainUI.setBigBlind(settings.bigBlind);
    actionUI.setBigBlind(settings.bigBlind);
    actionUI.setUsdRate(usdRate);
    table.setBigBlind(settings.bigBlind);
    table.setUsdRate(usdRate);
    table.setCloseTable(settings.closeTable);
    table.setNumberOfSeats(settings.numberOfSeats);
    mainUI.showShuffleVerification(settings.isEncryptedShuffling);
    let name = settings.mode == 'tournament' ? settings.tournamentName : settings.name;
    // settings.mode = settings.mode.charAt(0).toUpperCase() + settings.mode.slice(1);
    mainUI.setLogHead(settings.mode, settings.bigBlind, settings.smallBlind, settings.handId, name);

    if (settings.mode == "tournament") {
        mainUI.showLevel(true);
        mainUI.showTournamentTime(settings.timeDuration);
        mainUI.setLevelInfo(settings.level, settings.duration, settings.nextSB, settings.nextBB, settings.displayAnte, settings.displaySB, settings.displayBB);
        mainUI.showTrophyInfo(true);
        table.setSitVisible(false);
        // setShowDollarSign(false);
    } else {
        mainUI.showLevel(false);
        table.setSitVisible(true);
        showSUDCheckbox.parentElement.style.display = "flex";
        // setShowDollarSign(true);
    }
}

function onPlayerState(state) {
    switch (state) {
        case "Observing":
            table.setMode(modes.Observing);
            break;
        case "Joining":
            table.setMode(modes.Joining);
            break;
        case "Waiting":
        case "Playing":
        case "SitOut":
            table.setMode(modes.Playing);
            break;
    }

    table.clearTurn();
    actionUI.showActionUI(false);
    mainUI.showFoldToAnyBetCheckbox(state == "Playing");
    mainUI.showFoldToAnyBetOption(state == "Playing");

    if (tableSettings.mode == "cash") {

        mainUI.showSitIn(state == "SitOut");
        mainUI.showWaitForBB(state == "Waiting");
        // mainUI.setWaitForBB(true);
        mainUI.showPreFlopAutoFold(tableSettings.gameType == "nlh");
        mainUI.showSitOutNextHand(state == "Playing");
        mainUI.setSitOutNextHand(false);
        mainUI.showTipDealer(state == "Playing");
        // mainUI.showSidebetUI(false);

        if (getPlayerSeat() >= 0 && (state == "Playing" || state == "Waiting") && buyInUI.visible) {} else if (getPlayerSeat() >= 0 && state == "Joining") {
            showBuyIn();
        } else {
            hideBuyIn();
        }

        // actionUi.setShowDollarSign(true);
        // tableUi.setShowDollarSign(true);
    } else {
        mainUI.showPreFlopAutoFold(false);
        mainUI.showWaitForBB(false);
        mainUI.showTipDealer(false);
        // mainUI.setWaitForBB(false);
        mainUI.showSitOutNextHand(false);
        mainUI.setSitOutNextHand(false);
        //  mainUI.showSidebetUI(false);
        //     actionUi.setShowDollarSign(false);
        //     tableUi.setShowDollarSign(false);
    }
}

export function showBuyIn() {
    buyInUI.showBuyIn(true);
    buyInUI.setBuyInPanelInfo(tableSettings.minBuyIn);
}

function hideBuyIn() {
    buyInUI.showBuyIn(false);
}
export function removeMuckedFlag() {
    table.removeMuckedFlag();
}

function onTableStatus(status) {
    document.hasFocus();
    let mainPlayerSeat = getPlayerSeat();
    if(mainPlayerSeat != -1){

        let isBet = false;
        let isCallButton = false;
        let lastBet = 0;
        for (let index = 0; index < status.seats.length; index++) {
            const currentValue = status.seats[index];
            if(mainPlayerSeat !== index && currentValue.lastBet > 0){
                if (status.state == 'PreFlop' && !['sb', 'bb'].includes(currentValue.lastAction)) {
                    isBet = true;
                } else {
                    isBet = false;
                }

                if(status.seats[mainPlayerSeat].lastBet < currentValue.lastBet  && status.seats[mainPlayerSeat].lastAction !== 'fold' && ['call', 'raise'].includes(currentValue.lastAction))
                {
                    console.log(currentValue);
                    isCallButton = true;
                    lastBet = Math.max(currentValue.lastBet,lastBet);
                }
                   
                
            }
        }

        mainUI.setCallButton((isCallButton) ? lastBet :  isCallButton, status.seats[mainPlayerSeat].lastBet);
        actionUI.showBetButton(isBet);
    }
    let firstSeat = Math.max(0, mainPlayerSeat);
    if (mainPlayerSeat != previousMainPlayerIndex) {
        if (previousMainPlayerIndex != -1 && mainPlayerSeat == -1) {
            table.restorePlayerWrappers();

            mainUI.showBackLobbyButton(true);
        } else {
            table.rotatePlayerWrappers(mainPlayerSeat, mainPlayerIndex);

            mainUI.showBackLobbyButton(false);
        }
        previousMainPlayerIndex = mainPlayerSeat;
    }

    if (mainPlayerSeat != -1) {
        mainUI.setHandResult(status.seats[firstSeat].handRank, (status.state != prevRoundState) ? status.cards.length * 450 : 0);
        mainUI.setPlayStatus(true);
    } else {
        mainUI.setHandResult();
        mainUI.setPlayStatus(false);
    }

    if (mainPlayerSeat != -1 && status.seats[mainPlayerSeat].state === 'Playing' && status.state == prevRoundState) {
        const mainPlayerBet = status.seats[mainPlayerSeat].lastBet || 0;
        const isAutoFold = status.seats.find((currentValue, index) => {
            return currentValue.state === "Playing" && mainPlayerSeat != index && mainPlayerBet < currentValue.lastBet  && !['sb', 'bb'].includes(currentValue.lastAction);
        });
        mainUI.setFoldToAnyBetText(isAutoFold);
        mainUI.showautoCheckButton(status.seats[mainPlayerSeat].lastAction != 'sb');
        mainUI.showFoldToAnyBetOption(status.state != "Showdown" && ['sb', 'bb', undefined].includes(status.seats[mainPlayerSeat].lastAction));
    } else {
        mainUI.showFoldToAnyBetOption(false);
    }

    if (tableSettings.mode == "cash" && mainPlayerSeat >= 0) {
        if (status.seats[mainPlayerSeat].lastAction === 'fold' || status.seats[mainPlayerSeat].state === 'SitOut')
            mainUI.showAddChips(true);
        else if (!buyInUI.visible) {
            mainUI.showAddChips(false);
        }


        /*else if (status.seats[mainPlayerSeat].state == 'Playing') {
                   mainUI.setAlwaysFold(true);
               }*/
        mainUI.showLeaveGameButton(status.seats[mainPlayerSeat].lastAction === 'fold' || status.seats[mainPlayerSeat].state !== 'Playing');
        mainUI.showSitOut(true);
        mainUI.showTipDealer(status.seats[mainPlayerSeat].state == 'Playing');

    } else {
        mainUI.showAddChips(false);
        mainUI.showSitOut(false);
        mainUI.showLeaveGameButton(false);
        mainUI.showTipDealer(false);
    }

    if (status.state != "Showdown")
        mainUI.showShowCardsButton(false);

    if (status.state == "None" || status.state == "PreFlop") {
        table.setShowSbBbButtons(true);
    } else {
        table.setShowSbBbButtons(false);
    }

    //mainUI.showWaitList(!status.seats.find(seat => seat.state === "Empty") && mainPlayerSeat == -1);

    table.setFirstSeat(firstSeat);
    table.setSeats(status.seats, status.state);
    table.setButtons(status.seatOfDealer, status.seatOfSmallBlind, status.seatOfBigBlind);
    table.setTableCards(status.cards);
    table.setTotalPot(status.pot);
    table.setStreetPot(status.streetPot);

    if (lastTurnSeat != -1 && status.seats[lastTurnSeat].hasOwnProperty('lastAction')) {
        if (status.seats[lastTurnSeat].lastAction == "raise" && mainPlayerSeat != lastTurnSeat){
            checkAutoCheckFoldValid(status.seats, true);
            actionUI.setRaiseLebel(true);
        } else {
            actionUI.setRaiseLebel(false);
        }
    } else {
        actionUI.setRaiseLebel(false);
    }

    table.clearTurn();
    mainUI.showBreakTime(status.breakTime, status.duration);

    if (status.state != prevRoundState) {
        updatCurrency();
        if (status.state == "PreFlop") {
            sound.playCardDealt();
            table.clearTableCards();
        } else if (status.state == "Flop") {
            sound.playFlop();
        } else if (status.state == "Turn" || status.state == "River") {
            sound.playTurnRiver();
        } else if (status.state == "Showdown") {
            sound.playEndStreet();
            checkAutoCheckFoldValid(status.seats, false);
        }

        if (status.state != "Showdown") {
            checkAutoCheckFoldValid(status.seats, true);
        }
    }

    if (status.state == "Showdown") {
        table.removePlayerActionLabel();
    }

    if (status.round != prevRound) {
        //sound.playCardDealt();
        table.removeMuckedFlag();
    }

    prevRoundState = status.state;
    prevRound = status.round;
}

function checkAutoCheckFoldValid(seats, isShow) {
    let isValid = true;
    const playerSeat = getPlayerSeat();

    if (playerSeat == -1)
        isValid = false;
    else {
        if (seats[playerSeat].state != "Playing" || seats[playerSeat].fold || seats[playerSeat].lastAction == "allin")
            isValid = false;
    }

    if (!isValid) {
        mainUI.showAutoCheckOptions(false);
        return;
    }

    mainUI.showAutoCheckOptions(isShow);
}

function onRoundResult(roundResult) {
    table.showRoundResult(roundResult);
    mainUI.resetFoldToAnyBetOption();
    mainUI.roundResult();

    // const players = roundResult.lastPlayers;
    // mainUI.showShowCardsButton(roundResult.players.length > 1 && players.length == 1 && players[0].seat != getPlayerSeat());
}

function onAnimation(res) {
    switch (res.type) {
        case "TableStatus":
            table.totalChipAnimation(res);
            mainUI.showFoldToAnyBetOption(false);
            break;
        case "betAction":
            table.betActionAnimation(res);
            break;
        case "allPlayersAllIn":
            table.setLastAnimationAction("allPlayersAllIn");
            break;
        case "returnSidePot":
            table.returnSidePotAnimation(res);
            break;
        default:
            break;
    }
}

function onPlayerGameSetting(res) {
    var checkBoxes = { mute: $("#muteCheckbox")[0], fourColors: $("#fourColorsCheckbox")[0], autoMuck: autoMuckCheckbox, showBB: showBBCheckbox, showSUD: showSUDCheckbox, shuffleVerification: shuffleVerificationButtonCheckboxe, DisplayCards: DisplayCards }
    Object.keys(res).forEach(value => {
        toggleCheckbox(checkBoxes[value], res[value]);
    });

}

function onVerifyShuffling(res) {
    if (!shuffleVerificationButtonCheckboxe.checked)
        return;

    // A. client verifies the seed independently
    const seed = res.seed;
    const isSeedValid = verifySeed(seed, res.jsonString);
    if (!isSeedValid) {
        shufflingVerificationReport("Seed verification failed.");
        console.log("Seed verification failed.");
        return;
    }

    // B. Reconstruct the deck and perform cryptographic shuffling with the verified seed
    let deck = initializeDeck();
    deck = cardShuffler.shuffle(deck, seed);

    let verificationPreFlopArray = [];
    for (let i = 0; i < res.pfCount; i++) {
        verificationPreFlopArray.push(deck.pop());
    }

    // D. Draw common cards from the deck
    const commonCards = res.commonCards;
    let verificationCommonCards = [];
    for (let i = 0; i < commonCards.length; i++) {
        verificationCommonCards.push(deck.pop());
    }

    // E. Compare the common cards with the original common cards
    const verificationSuccess = arraysEqual(commonCards, verificationCommonCards);

    if (verificationSuccess) {
        shufflingVerificationReport(getMessage('successVerification'));
        console.log("Verification successful: The shuffling was fair.");
    } else {
        shufflingVerificationReport(getMessage('failVerification'));
        console.log("Verification failed: The shuffling was tampered with.");
    }
}

function arraysEqual(array1, array2) {
    return JSON.stringify(array1) === JSON.stringify(array2);
}

function onShowCardsButton(res) {
    if (!autoMuckCard)
        mainUI.showShowCardsButton(true);
}

function onAlwaysFold(res) {
    mainUI.setAlwaysFold(true);
    actionUI.showActionUI(false);
}

function onRoundTurn(turn) {
    table.setTurn(turn);
    lastTurnSeat = turn.seat;

    if (turn.seat != -1 && turn.seat == getPlayerSeat()) {
        mainUI.showFoldToAnyBetOption(false);
        const playerCards = table.getTurnPlayerCards(turn.seat);
        const activeSeats = table.getActiveSeats();

        if (mainUI.doFoldToBet())
            return;

        if (mainUI.doAutoCheckOrFold())
            return;

        if (mainUI.doAutoCheck())
            return;

        if (mainUI.doCall())
            return;

        if (tableSettings.gameType == "nlh" && mainUI.doPreFlopAutoFold(preFlopAutoFoldCheckboxes, playerCards, activeSeats))
            return;

        actionUI.showActionUI(true);
        mainUI.showTipDealer(false);

        if (!document.hasFocus() && !$('body').is(':hover'))
            sound.playNotification();

        mainUI.setTurnFlag(true);

        actionUI.showCall(turn.call, myMoneyInGame());

        if (turn.canRaise)
            actionUI.showRaise(turn.minRaise, turn.maxRaise, turn.pot, tableSettings.bigBlind, turn.currentBet);
        else
            actionUI.hideRaise();
    } else {

        actionUI.showActionUI(false);
        mainUI.setTurnFlag(false);
    }
}

function onSidePots(pots) {
    table.setSidePots(pots);
}

function onShowCards(showCards) {
    // if (showCards.seat != getPlayerSeat()) // show others only
    table.showCards(showCards.seat, showCards.cards);
    mainUI.addLog({ log: table.players[showCards.seat].name + ' shows ' + showCards.cards.join() });
}

function onMuckCards(seat) {
    table.muckCards(seat);
}

function onMessage(res) {
    if (res.status)
        console.log(res.msg);
    else {
        console.error(res.msg);
        mainUI.showMessage(res.msg, res.data);
    }
}
function onCancelBet() {
    actionUI.showActionUI(true);
}

function onTourneyInfo(res) {
    mainUI.setTrophyInfo(res.position, res.number);
}

function onCashWaitList(res) {
    // mainUI.setWaitList(res);
}

function onLog(res) {
    mainUI.addLog(res);
}

function onWaitForBB(res) {
    mainUI.setWaitForBB(res);
}

function onTournamentCancelTime(res) {
    mainUI.showTournamentCancelTime(res);
}

function onChat(res) {
    mainUI.addChat(res);
}

function onTip(res) {
    table.setTipMessage(res);
}

function onBuyInPanelOpen(res) {
    buyInUI.setBuyInPanelInfo(res);
}

tableSubscribe("onPlayerInfo", onPlayerInfo);
tableSubscribe("onTableSettings", onTableSettings);
tableSubscribe("onPlayerState", onPlayerState);
tableSubscribe("onPlayerLeave", onPlayerLeave);
tableSubscribe("onTableStatus", onTableStatus);
tableSubscribe("onRoundResult", onRoundResult);
tableSubscribe("onAnimation", onAnimation);
tableSubscribe("onRoundTurn", onRoundTurn);
tableSubscribe("onSidePots", onSidePots);
tableSubscribe("onShowCards", onShowCards);
tableSubscribe("onMuckCards", onMuckCards);
tableSubscribe("onShowCardsButton", onShowCardsButton);
tableSubscribe("onAlwaysFold", onAlwaysFold);
tableSubscribe("onBuyInPanelOpen", onBuyInPanelOpen);
tableSubscribe("onMessage", onMessage);
tableSubscribe("onCancelBet", onCancelBet);
tableSubscribe("onTourneyInfo", onTourneyInfo);
tableSubscribe("onCashWaitList", onCashWaitList);
tableSubscribe("onLog", onLog);
tableSubscribe("onWaitForBB", onWaitForBB);
tableSubscribe("onTournamentCancelTime", onTournamentCancelTime);

tableSubscribe("onChat", onChat);
tableSubscribe("onInsurance", onInsurance);
/* tableSubscribe("onSideBet", onSideBet);
tableSubscribe("onSideBetHistory", onSideBetHistory);
tableSubscribe("onTableFreeBalance", onTableFreeBalance); */
tableSubscribe("onTip", onTip);
tableSubscribe("onVerifyShuffling", onVerifyShuffling);
tableSubscribe("onPlayerGameSetting", onPlayerGameSetting)

export default {
    showBuyIn,
}
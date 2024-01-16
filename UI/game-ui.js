import { autoFold, playerLeave } from "../socket-client";
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

let previousMainPlayerIndex = -1;
let lastTurnSeat = -1;
let prevRoundState = "None";
let prevRound;

const mainPlayerIndex = 5;
const table = new Table();
const buyInUI = new BuyInUI();
const mainUI = new MainUI(buyInUI);
const actionUI = new ActionUI();
const sound = new Sound();

const showBBCheckbox = $("#showAsBBCheckbox")[0];
const showSUDCheckbox = $("#showAsSUDCheckbox")[0];

showBBCheckbox.addEventListener('change', () => {
    if (showBBCheckbox.checked)
        toggleCheckbox(showSUDCheckbox, false);

    setShowInBB(showBBCheckbox.checked);
});

showSUDCheckbox.addEventListener('change', () => {
    if (showSUDCheckbox.checked)
        toggleCheckbox(showBBCheckbox, false);

    setShowInUSD(showSUDCheckbox.checked);
});

const autoFoldModeButtonCheckboxes = $(".autoFoldModeButton1 .checkbox")[0];
autoFoldModeButtonCheckboxes.addEventListener('click', () => {
    if (autoFoldModeButtonCheckboxes.checked && tableSettings.gameType == "nlh") {
        autoFold(autoFoldModeButtonCheckboxes.checked, (data) => {
            data = JSON.parse(data);
            if (data.status == true) {
                mainUI.setPlayerAutoFoldCards(data.AutoFoldCards);
                const playerCards = table.getTurnPlayerCards(getPlayerSeat());
                const activeSeats = table.getActiveSeats();
                mainUI.doAutoFold(autoFoldModeButtonCheckboxes, playerCards, activeSeats);
                return true;
            }
        });
    }
    mainUI.setPlayerAutoFoldCards([]);
});




let showInBB = false;
showBBCheckbox.checked = false;

let showInUSD = false;
showSUDCheckbox.checked = false;

const autoMuckCheckbox = $("#autoMuckCheckbox")[0];
autoMuckCheckbox.addEventListener('click', () => {
    setAutoMuck(!autoMuckCheckbox.checked);
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
        mainUI.showTournamentResult(res.hasWin, res.prize, res.rank);
    } 
    else if (res.type === 'double_browser_leave') {
        mainUI.showDoubleLoginMsg(res.msg);
    }
}

function onPlayerInfo(playerInfo) {
    mainUI.setPlayerName(playerInfo);
}

function onSideBet(res) {
    mainUI.updateSideBetOptions(res.street, res.streetText, res.options);
}

function onSideBetHistory(res) {
    mainUI.updateSideBetHistory(res);
}

function onTableFreeBalance(balance) {
    mainUI.updateFreeBalance(balance);
}

function onTableSettings(settings) {
    var usdRate = parseFloat(settings.usdRate).toFixed(2);
    mainUI.setTableName(settings.name);
    mainUI.setSmallBlind(settings.smallBlind);
    mainUI.setBigBlind(settings.bigBlind);
    actionUI.setBigBlind(settings.bigBlind);
    actionUI.setUsdRate(usdRate);
    table.setBigBlind(settings.bigBlind);
    table.setUsdRate(usdRate);
    table.setCloseTable(settings.closeTable);

    if (settings.mode == "tournament") {
        mainUI.showLevel(true);
        mainUI.setLevelInfo(settings.level, settings.duration, settings.nextSB, settings.nextBB, settings.displayAnte, settings.displaySB, settings.displayBB);
        mainUI.showTrophyInfo(true);
        table.setSitVisible(false);
        mainUI.showTipDealer(false);
        actionUI.showSidebetUI(false);
        mainUI.showSitIn(false);
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
    mainUI.showSitIn(state == "SitOut");
    mainUI.showFoldToAnyBetCheckbox(state == "Playing");

    if (tableSettings.mode == "cash") {

        mainUI.showWaitForBB(state == "Waiting");
        // mainUI.setWaitForBB(true);
        mainUI.showAutoFold(true);
        mainUI.showSitOutNextHand(state == "Playing");
        mainUI.setSitOutNextHand(false);
        mainUI.showTipDealer(state == "Playing");

        if (getPlayerSeat() >= 0 && (state == "Playing" || state == "Waiting") && buyInUI.visible) {} else if (getPlayerSeat() >= 0 && state == "Joining") {
            showBuyIn();
        } else {
            hideBuyIn();
        }

        // actionUi.setShowDollarSign(true);
        // tableUi.setShowDollarSign(true);
    } else {
        mainUI.showWaitForBB(false);
        mainUI.showTipDealer(false);
        // mainUI.setWaitForBB(false);
        mainUI.showSitOutNextHand(false);
        mainUI.setSitOutNextHand(false);
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

function onTableStatus(status) {
    document.hasFocus();
    let mainPlayerSeat = getPlayerSeat();
    let firstSeat = Math.max(0, mainPlayerSeat);
    if (mainPlayerSeat != previousMainPlayerIndex) {
        if (previousMainPlayerIndex != -1 && mainPlayerSeat == -1) {
            table.restorePlayerWrappers();
            mainUI.showTipDealer(false);
            mainUI.showBackLobbyButton(true);
        } else {
            table.rotatePlayerWrappers(mainPlayerSeat, mainPlayerIndex);
            mainUI.showTipDealer(true);
            mainUI.showBackLobbyButton(false);
        }
        previousMainPlayerIndex = mainPlayerSeat;
    }

    if (mainPlayerSeat != -1) {
        mainUI.setHandResult(status.seats[firstSeat].handRank);
        mainUI.setPlayStatus(true); 
        mainUI.showLeaveGameButton(status.seats[mainPlayerSeat].lastAction === 'fold' || status.seats[mainPlayerSeat].state !== 'Playing');
    } else {
        mainUI.setHandResult();
        mainUI.setPlayStatus(false);
        mainUI.showLeaveGameButton(false);
    }

    if (tableSettings.mode == "cash" && mainPlayerSeat >= 0) {
        if (status.seats[mainPlayerSeat].lastAction === 'fold' || status.seats[mainPlayerSeat].state === 'SitOut')
            mainUI.showAddChips(true);
        else if (!buyInUI.visible) {
            mainUI.showAddChips(false);
        } else if (status.seats[mainPlayerSeat].state == 'Playing') {
            mainUI.setFoldAnyBet(true);
        }

        mainUI.showSitOut(true);
    } else {
        mainUI.showAddChips(false);
        mainUI.showSitOut(false);
    }

    if (status.state != "Showdown")
        mainUI.showShowCardsButton(false);

    if (status.state == "None" || status.state == "HoleCards") {
        table.setShowSbBbButtons(true);
    } else {
        table.setShowSbBbButtons(false);
    }

    mainUI.showWaitList(!status.seats.find(seat => seat.state === "Empty") && mainPlayerSeat == -1);

    table.setFirstSeat(firstSeat);
    table.setSeats(status.seats, status.state);
    table.setButtons(status.seatOfDealer, status.seatOfSmallBlind, status.seatOfBigBlind);
    table.setTableCards(status.cards);
    table.setTotalPot(status.pot);
    table.setStreetPot(status.streetPot);

    if (lastTurnSeat != -1 && status.seats[lastTurnSeat].hasOwnProperty('lastAction')) {
        if (status.seats[lastTurnSeat].lastAction == "raise" && mainPlayerSeat != lastTurnSeat)
            checkAutoCheckFoldValid(status.seats, true);
    }

    table.clearTurn();
    mainUI.showBreakTime(status.breakTime, status.duration);

    if (status.state != prevRoundState) {
        updatCurrency();
        if (status.state == "HoleCards") {
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
    table.AutoTip(roundResult)

    // const players = roundResult.lastPlayers;
    // mainUI.showShowCardsButton(roundResult.players.length > 1 && players.length == 1 && players[0].seat != getPlayerSeat());
}

function onPlayerAnimation(res) {
    table.PlayerAnimation(res);
}

function onShowCardsButton(res) {
    if (!autoMuckCard)
        mainUI.showShowCardsButton(true);
}

function onFoldAnyBet(res) {
    mainUI.setFoldAnyBet(true);
}

function onRoundTurn(turn) {
    table.setTurn(turn);
    lastTurnSeat = turn.seat;

    if (turn.seat != -1 && turn.seat == getPlayerSeat()) {
        const playerCards = table.getTurnPlayerCards(turn.seat);
        const activeSeats = table.getActiveSeats();

        if (mainUI.doFoldToAnyBet())
            return;

        if (mainUI.doAutoCheckOrFold())
            return;

        if (mainUI.doAutoCheck())
            return;

        if (tableSettings.gameType == "nlh" && mainUI.doAutoFold(autoFoldModeButtonCheckboxes, playerCards, activeSeats))
            return;

        actionUI.showActionUI(true);

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
    mainUI.addLog(table.players[showCards.seat].name + ' shows ' + showCards.cards.join())
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

function onTourneyInfo(res) {
    mainUI.setTrophyInfo(res.position, res.number);
}

function onCashWaitList(res) {
    mainUI.setWaitList(res);
}

function onLog(res) {
    mainUI.addLog(res);
}

function onChat(res) {
    mainUI.addChat(res);
    console.log("main ui", res)
}

function onTip(res) {
    table.addTip(res);
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
tableSubscribe("onPlayerAnimation", onPlayerAnimation);
tableSubscribe("onRoundTurn", onRoundTurn);
tableSubscribe("onSidePots", onSidePots);
tableSubscribe("onShowCards", onShowCards);
tableSubscribe("onMuckCards", onMuckCards);
tableSubscribe("onShowCardsButton", onShowCardsButton);
tableSubscribe("onFoldAnyBet", onFoldAnyBet);
tableSubscribe("onBuyInPanelOpen", onBuyInPanelOpen);
tableSubscribe("onMessage", onMessage);
tableSubscribe("onTourneyInfo", onTourneyInfo);
tableSubscribe("onCashWaitList", onCashWaitList);
tableSubscribe("onLog", onLog);
tableSubscribe("onChat", onChat);
tableSubscribe("onInsurance", onInsurance);
tableSubscribe("onSideBet", onSideBet);
tableSubscribe("onSideBetHistory", onSideBetHistory);
tableSubscribe("onTableFreeBalance", onTableFreeBalance);
tableSubscribe("onTip", onTip);

export default {
    showBuyIn,
}
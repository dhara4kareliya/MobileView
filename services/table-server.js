import { emit, playerSitDown, playerLeaveGame, sendTurnAction, subscribe, connectSocket, ShowTipToDealer, updatePlayerSetting } from "../socket-client";
import { setServer } from "./game-server";
import { Get, hostAddress } from "../http-client";
import { generateHashAndRandomString, verifyJSONFromServer } from './utils-server';
import { getMessage } from "../UI/language-ui";

export const PlayerState = Object.freeze({
    None: 0,
    Leaving: 1,
    Joining: 2,
    SitOut: 3,
    Waiting: 4,
    Playing: 5
});

export const SeatState = Object.freeze({
    Empty: 0,
    Joining: 1,
    SitOut: 2,
    Waiting: 3,
    Playing: 4
});

export const RoundState = Object.freeze({
    None: 0,
    PreFlop: 1,
    Flop: 2,
    Turn: 3,
    River: 4,
    Showdown: 5,
    End: 6
});

export const HandRank = Object.freeze({
    None: 0,
    HighCard: 1,
    Pair: 2,
    TwoPair: 3,
    ThreeOfAKind: 4,
    Straight: 5,
    Flush: 6,
    FullHouse: 7,
    FourOfAKind: 8,
    StraightFlush: 9
});

export class PlayerInfo {
    /**
     * @param {String} name 
     * @param {Number} avatar 
     * @param {Number} globalBalance 
     * @param {Number} tableBalance 
     * @param {Number} chips 
     */
    constructor(name, avatar, globalBalance, tableBalance, chips) {
        this.name = name;
        this.avatar = avatar;
        this.globalBalance = globalBalance;
        this.tableBalance = tableBalance;
        this.chips = chips;
    }
}

export class TableSetting {
    constructor(name, numberOfSeats, mode, gameType, level, nextSB,
        nextBB, duration, smallBlind, bigBlind, ante, minBuyIn, maxBuyIn, displaySB, displayBB, displayAnte, isRandomTable, isEncryptedShuffling) {
        this.name = name;
        this.numberOfSeats = numberOfSeats;
        this.mode = mode;
        this.gameType = gameType;
        this.level = level;
        this.nextSB = nextSB;
        this.nextBB = nextBB;
        this.duration = duration;
        this.smallBlind = smallBlind;
        this.bigBlind = bigBlind;
        this.ante = ante;
        this.minBuyIn = minBuyIn;
        this.maxBuyIn = maxBuyIn;
        this.displaySB = displaySB;
        this.displayBB = displayBB;
        this.displayAnte = displayAnte;
        this.isRandomTable = isRandomTable;
        this.isEncryptedShuffling = isEncryptedShuffling;
    }
}

export class TableStatus {
    constructor(breakTime, paused, round, state, cards, seatOfDealer,
        seatOfSmallBlind, seatOfBigBlind, pot, turn, streetPot) {
        this.breakTime = breakTime;
        this.paused = paused;
        this.round = round;
        this.state = state;
        this.cards = cards;
        this.seatOfDealer = seatOfDealer;
        this.seatOfSmallBlind = seatOfSmallBlind;
        this.seatOfBigBlind = seatOfBigBlind;
        this.pot = pot;
        this.turn = turn;
        this.streetPot = streetPot;
    }
}

export class Seat {
    constructor(state, player, money, pendingMoney, play,
        cards, action, lastAction, lastBet, missingSB, missingBB, sum) {
        this.state = state;
        this.player = player;
        this.money = money;
        this.pendingMoney = pendingMoney;
        this.play = play;
        this.cards = cards;
        this.action = action;
        this.lastAction = lastAction;
        this.lastBet = lastBet;
        this.missingSB = missingSB;
        this.missingBB = missingBB;
        this.sum = sum;
    }

    get totalMoney() {
        return this.money + this.pendingMoney;
    }
}

export class Turn {
    constructor(seat, pot, call, canRaise, currentBet,
        minRaise, maxRaise, timeout, timeToReact, timeBank) {
        if (!seat)
            seat = -1;
        this.seat = seat;
        this.pot = pot;
        this.call = call;
        this.canRaise = canRaise;
        this.minRaise = minRaise;
        this.maxRaise = maxRaise;
        this.timeout = timeout;
        this.timeToReact = timeToReact;
        this.timeBank = timeBank;
        this.currentBet = currentBet;
    }

    get canCheck() {
        return this.call == 0;
    }

    get canCall() {
        return this.call > 0;
    }
}

export class Pot {
    constructor(amount, seats) {
        this.amount = amount;
        this.seats = seats;
    }
}

export class PlayerResult {
    constructor(seat, fold, bet, prize, handCards, handRank) {
        this.seat = seat;
        this.fold = fold;
        this.bet = bet;
        this.prize = prize;
        this.handCards = handCards;
        this.handRank = handRank;
    }
}

export class PotResult {
    constructor(amount, prize, winners) {
        this.amount = amount;
        this.prize = prize;
        this.winners = winners;
    }
}

export class RoundResult {
    /**
     * 
     * @param {PlayerInfo[]} players 
     * @param {Pot} pots 
     */
    constructor(players, pots, vpip) {
        this.players = players;
        this.pots = pots;
        this.vpip = vpip;
    }

    get lastPlayers() {
        return this.players.filter(player => {
            return !player.fold;
        });
    }

    get winners() {
        return this.players.filter(player => {
            return player.prize > 0;
        });
    }
}

export class SeatShowCards {
    constructor(seat, cards, handrank) {
        this.seat = seat;
        this.cards = cards;
        this.handrank = handrank;
    }
}

export const myInfo = new PlayerInfo();
export const tableSettings = new TableSetting();
export const round = new TableStatus();
export const turn = new Turn();
let playerState = PlayerState.None;
let playerSeat = -1;
let type = "";
let randomString = undefined;
let hash = undefined;
let allHashes = undefined;

export function getCurrentTurn() {
    return turn;
}
export function getPlayerSeat() {
    return playerSeat;
}

export function myMoneyInGame() {
    const seat = round.seats[playerSeat];
    if (!seat)
        return 0;
    return seat.money;
}

export function myTotalMoneyInGame() {
    const seat = round.seats[playerSeat];
    if (!seat)
        return 0;
    return seat.money + (seat.pendingMoney ? seat.pendingMoney : 0);
}

export function acceptInsurance(insuranceAmount, insuranceWinAmount) {
    emit("REQ_PLAYER_ACCEPT_INSURANCE", { insuranceAmount: insuranceAmount, insuranceWinAmount: insuranceWinAmount });
}

function onPlayerLeave(reason) {
    playerState = PlayerState.None;
    playerSeat = -1;

    const type = reason.type;
    if (type == 'migrate') {
        setServer(reason.server, reason.token, type);
        $('.notification-message')[0].innerHTML = getMessage('moveNewTable');
        $('#notificationModal').modal('show');
        setTimeout(() => {
            $('#notificationModal').modal('hide');
        }, 3000);
        connectSocket(reason.server);
        const soundCheckbox = $("#muteCheckbox")[0];
        const fourColorsCheckbox = $("#fourColorsCheckbox")[0];
        const showBBCheckbox = $("#showAsBBCheckbox")[0];
        const showSUDCheckbox = $("#showAsSUDCheckbox")[0];
        const shuffleVerificationButtonCheckboxe = $("#shuffleVerificationButton")[0];
        const DisplayCards = $("#DisplayCards")[0];
        const autoMuckCheckbox = $("#autoMuckCheckbox")[0];
        const deckColorMenu = $("#fourColorsCheckbox .dropdown-menu li.active")[0];

        setTimeout(function() {
            updatePlayerSetting('mute', soundCheckbox.checked);
            // updatePlayerSetting('fourColors', fourColorsCheckbox.checked);
            updatePlayerSetting('autoMuck', autoMuckCheckbox.checked);
            updatePlayerSetting('shuffleVerification', shuffleVerificationButtonCheckboxe.checked);
            updatePlayerSetting('DisplayCards', DisplayCards.checked);
            updatePlayerSetting('showSUD', showSUDCheckbox.checked);
            updatePlayerSetting('showBB', showBBCheckbox.checked);
            updatePlayerSetting('deckColor', deckColorMenu.dataset.value);
        }, 5000);
    } else if (type == 'tournament_leave' || type == 'double_browser_leave') {
        triggerEventListeners("onPlayerLeave", reason);
    } else {
        triggerEventListeners("onPlayerLeave", reason);
        window.close();
    }
}

function onPlayerInfo(info) {
    copyTo(info, myInfo);
    triggerEventListeners("onPlayerInfo", myInfo);
}
function onStateData(res) {
    triggerEventListeners("onStateData", res);
}
function onPrizeData(res) {
    triggerEventListeners("onPrizeData", res);
}
function onPlayerState(state) {
    playerState = state.state;
    triggerEventListeners("onPlayerState", playerState);
}

function onTableSettings(settings) {
    copyTo(settings, tableSettings);
    triggerEventListeners("onTableSettings", tableSettings);
}

function onTableStatus(status) {
    copyTo(status, round);
    playerSeat = status.seats.findIndex(seat => {
        return seat.player && (seat.player.name == myInfo.name);
    });
    const players = round.seats.map(seat => {
        return `${seat.state}(${seat.player ? seat.player.name : ""})`;
    });
    triggerEventListeners("onTableStatus", round);

}

/* function onSideBetOptions(res) {
    triggerEventListeners("onSideBet", res);
}

function onSideBetHistory(res) {
    triggerEventListeners("onSideBetHistory", res);
}

function onTableFreeBalance(res) {
    triggerEventListeners("onTableFreeBalance", res);
} */

function onTableSidePots(res) {
    triggerEventListeners("onSidePots", res);
}

function onInsurance(res) {
    triggerEventListeners("onInsurance", res);
}

function onTableTurn(res) {
    copyTo(res, turn);
    if (turn.seat == undefined)
        turn.seat = -1;
    if (turn.seat >= 0) {
        if (turn.canRaise) {
            turn.minRaise = turn.raise[0];
            if (type == "plo")
                turn.maxRaise = turn.pot;
            else
                turn.maxRaise = turn.raise[1];
        } else {
            turn.minRaise = 0;
            turn.maxRaise = 0;
        }

        turn.timeout = turn.time[0];
        turn.timeToReact = turn.time[1];
        turn.timeBank = turn.time[2];
    } else {
        turn.call = 0;
        turn.canRaise = false;
        turn.minRaise = 0;
        turn.maxRaise = 0;
        turn.timeout = 0;
        turn.timeToReact = 0;
        turn.timeBank = 0;
        turn.currentBet = 0;
    }

    triggerEventListeners("onRoundTurn", turn);
}

export function turnAction(action, bet = 0) {
    if (isNaN(bet))
        bet = 0;
    sendTurnAction(action, bet);
}
function onTableUpdateTurn(res) {
    copyTo(res, turn);
    if (turn.seat == undefined)
        turn.seat = -1;
    if (turn.seat >= 0) {
        if (turn.canRaise) {
            turn.minRaise = turn.raise[0];
            if (type == "plo")
                turn.maxRaise = turn.pot;
            else
                turn.maxRaise = turn.raise[1];
        } else {
            turn.minRaise = 0;
            turn.maxRaise = 0;
        }

        turn.timeout = turn.time[0];
        turn.timeToReact = turn.time[1];
        turn.timeBank = turn.time[2];
    } else {
        turn.call = 0;
        turn.canRaise = false;
        turn.minRaise = 0;
        turn.maxRaise = 0;
        turn.timeout = 0;
        turn.timeToReact = 0;
        turn.timeBank = 0;
        turn.currentBet = 0;
    }
}
function onTableRoundResult(res) {
    let result = new RoundResult(res.players, res.pots, res.vpip);
    triggerEventListeners("onRoundResult", result);
}

export function showCards() {
    emit("REQ_PLAYER_SHOWCARDS");
}

function onTablePlayerShowCards(res) {
    const showCards = new SeatShowCards(res.seat, res.cards, res.handrank, res.avatar);
    triggerEventListeners("onShowCards", showCards);
}

function onTablePlayerMuckCards(res) {
    triggerEventListeners("onMuckCards", res.seat);
}

function onTablePlayerShowCardsButton(res) {
    triggerEventListeners("onShowCardsButton", res);
}

function onTablePlayerAlwaysFold(res) {
    triggerEventListeners("onAlwaysFold", res);
}

function onPlayerGenerateHashAndRandomString(res) {
    const generatedInfo = generateHashAndRandomString();
    hash = generatedInfo.hash;
    randomString = generatedInfo.randomString;
    emit('REQ_PLAYER_HASH', hash);
}

function onAllHashes(res) {
    allHashes = res;
    // Each user sends their random string to the server

}

function onPlayerRandomString(res) {
    emit('REQ_PLAYER_RANDOM_STRING', randomString);
}

function onVerifyJsonString(res) {
    triggerEventListeners("onVerifyShuffling", res);

    /* const data = verifyJSONFromServer(res);


    emit('REQ_PLAYER_VERIFY_JSON_STRING', data); */
}

function onTournamentCancelTime(res) {
    triggerEventListeners("onTournamentCancelTime", res);
}

function onPlayerGameSetting(res) {
    triggerEventListeners("onPlayerGameSetting", res);
}

function onBuyInOpen(res) {
    triggerEventListeners("onBuyInPanelOpen", res);
}

function onMessage(res) {
    triggerEventListeners("onMessage", res);
}
export function onCancelBet() {
    triggerEventListeners("onCancelBet");
}

function onAnimation(res) {
    triggerEventListeners("onAnimation", res);
}

function onTourneyInfo(res) {
    triggerEventListeners("onTourneyInfo", res);
}

function onCashWaitList(res) {
    triggerEventListeners("onCashWaitList", res);
}

function onLog(res) {
    triggerEventListeners("onLog", res);
}

function onChat(res) {
    triggerEventListeners("onChat", res);
}

function onTip(res) {
    triggerEventListeners("onTip", res);
}

function onWaitForBB(res) {
    triggerEventListeners("onWaitForBB", res);
}

export function waitForBB(value = true) {
    emit("REQ_PLAYER_WAITFORBB", { value: value });
}

export function sitOutNextHand(value) {
    emit("REQ_PLAYER_SITOUTNEXTHAND", { value: value });
}

export function sitOut() {
    emit("REQ_PLAYER_SITOUT");
}

export function sitIn() {
    emit("REQ_PLAYER_SITIN");
}

export function sitDown(seatIndex) {
    if (playerState != "Playing")
        playerSitDown(seatIndex);
}

export function TipToDealer(amount) {
    ShowTipToDealer(amount, () => {});
}

export function joinWaitingList() {
    emit("REQ_PLAYER_JOINWAITLIST");
}

export function doChat(msg) {
    emit("REQ_PLAYER_CHAT", msg);
}

export function playerLeaveTable() {
    playerSeat = -1;
    playerLeaveGame();
}

subscribe("onPlayerLeave", onPlayerLeave);
subscribe("onPlayerInfo", onPlayerInfo);
subscribe("onStateData", onStateData);
subscribe("onPrizeData", onPrizeData);
subscribe("onTableSettings", onTableSettings);
subscribe("onPlayerState", onPlayerState);
subscribe("onTableStatus", onTableStatus);
subscribe("onTableSidePots", onTableSidePots);
subscribe("onTableTurn", onTableTurn);
subscribe("onTableRoundResult", onTableRoundResult);
subscribe("onTablePlayerShowCards", onTablePlayerShowCards);
subscribe("onTablePlayerMuckCards", onTablePlayerMuckCards);
subscribe("onTablePlayerShowCardsButton", onTablePlayerShowCardsButton);
subscribe("onTablePlayerAlwaysFold", onTablePlayerAlwaysFold);
subscribe("onBuyInOpen", onBuyInOpen);
subscribe("onWaitForBB", onWaitForBB);
subscribe("onInsurance", onInsurance);
subscribe("onMessage", onMessage);
subscribe("onCancelBet", onCancelBet);
subscribe("onAnimation", onAnimation);
subscribe("onTourneyInfo", onTourneyInfo);
subscribe("onCashWaitList", onCashWaitList);
subscribe("onLog", onLog);
subscribe("onChat", onChat);
subscribe("onTip", onTip);
subscribe("onPlayerGenerateHashAndRandomString", onPlayerGenerateHashAndRandomString);
subscribe("onPlayerRandomString", onPlayerRandomString);
subscribe("onAllHashes", onAllHashes);
subscribe("onVerifyJsonString", onVerifyJsonString);
subscribe("onPlayerGameSetting", onPlayerGameSetting);
subscribe("onTournamentCancelTime", onTournamentCancelTime);
/* subscribe("onSideBetOptions", onSideBetOptions);
subscribe("onSideBetHistory", onSideBetHistory);
subscribe("onTableFreeBalance", onTableFreeBalance); */

export async function registerTournament(tournament_id, user_token) {
    try {
        const data = await Get(`api/tournamentRegistrationByApi?user_token=${user_token}&tournament_id=${tournament_id}`);
        const option = JSON.parse(data);
        $(".loader").hide();
        if (option.result == 'success')
            window.location.href = hostAddress + "/mobile-html/?t=" + option.token;
        else
            throw "Failed to connect to game server."
    } catch {
        throw "Failed to connect to game server."
    }
}

export async function getOptions() {
    try {
        const options = await Get("/api/options");
    } catch {
        throw "Failed to connect to game server."
    }
}


function copyTo(source, destination) {
    for (const key in destination)
        destination[key] = undefined;

    for (const key in source)
        destination[key] = source[key];
}

const eventListeners = {};

function triggerEventListeners(name, data) {
    if (!eventListeners[name])
        return;
    try {
        data = JSON.parse(data);
    } catch {}
    eventListeners[name].forEach(listener => {
        listener(data);
    });
}

/**
 * Adds a function that will be called when the event is triggered.
 * @param {String} eventName 
 * @param {Function} callback 
 */
export function tableSubscribe(eventName, callback) {
    if (!eventListeners[eventName])
        eventListeners[eventName] = [];
    if (typeof callback !== 'function')
        throw "The callback should be a function";
    eventListeners[eventName].push(callback);
}
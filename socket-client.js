import { io } from 'socket.io-client';
let socket = undefined;

export function getSocket() {
    return socket;
}

export function connectSocket(server) {
    console.log('connecting socket to ', server);
    disConnectSocket();
    socket = io(server);
    setSocketEventListeners();
}

export function disConnectSocket() {
    if (socket && socket.connected)
        socket.close();
}

function setSocketEventListeners() {
    socket.on("REQ_PLAYER_INFO", eventTrigger("onPlayerInfo"));
    socket.on("REQ_TABLE_SETTINGS", eventTrigger("onTableSettings"));
    socket.on("REQ_PLAYER_STATE", eventTrigger("onPlayerState"));
    socket.on("REQ_TABLE_STATUS", eventTrigger("onTableStatus"));
    socket.on("REQ_TABLE_SIDEPOTS", eventTrigger("onTableSidePots"));
    socket.on("REQ_TABLE_TURN", eventTrigger("onTableTurn"));
    socket.on("REQ_TABLE_ROUNDRESULT", eventTrigger("onTableRoundResult"));
    socket.on("REQ_TABLE_PLAYERSHOWCARDS", eventTrigger("onTablePlayerShowCards"));
    socket.on("REQ_TABLE_PLAYERMUCKCARDS", eventTrigger("onTablePlayerMuckCards"));
    socket.on("REQ_TABLE_PLAYERSHOWCARDSBTN", eventTrigger("onTablePlayerShowCardsButton"));
    socket.on("REQ_TABLE_FOLDANYBET", eventTrigger("onTablePlayerFoldAnyBet"));
    socket.on("REQ_TABLE_BUYIN", eventTrigger("onBuyInOpen"));
    socket.on("REQ_PLAYER_LEAVE", eventTrigger("onPlayerLeave"));
    socket.on("REQ_MESSAGE", eventTrigger("onMessage"));
    socket.on("REQ_Animation", eventTrigger("onAnimation"));
    socket.on("REQ_TOURNEY_INFO", eventTrigger("onTourneyInfo"));
    socket.on("REQ_TABLE_WAITLIST", eventTrigger("onCashWaitList"));
    socket.on("REQ_TABLE_LOG", eventTrigger("onLog"));
    socket.on("REQ_TABLE_CHAT", eventTrigger("onChat"));
    socket.on("connect", eventTrigger("onConnect"));
    socket.on("disconnect", eventTrigger("onDisconnect"));
    socket.on("REQ_INSURANC", eventTrigger("onInsurance"));
    socket.on("REQ_TABLE_TIP", eventTrigger("onTip"));
    /* socket.on("REQ_SIDEBET_OPTIONS", eventTrigger("onSideBetOptions"));
    socket.on("REQ_SIDEBET_HISTORY", eventTrigger("onSideBetHistory"));
    socket.on("REQ_TABLE_FREE_BALANCE", eventTrigger("onTableFreeBalance")); */

    /*     socket.on("REQ_SIDEBET_OPTIONS", eventTrigger("onSideBetOptions"));
        socket.on("REQ_SIDEBET_HISTORY", eventTrigger("onSideBetHistory"));
        socket.on("REQ_TABLE_FREE_BALANCE", eventTrigger("onTableFreeBalance")); */
}

// TS -> client

const eventListeners = {
    onPlayerInfo: [],
    onTableSettings: [],
    onPlayerState: [],
    onTableStatus: [],
    onTableSidePots: [],
    onTableTurn: [],
    onTableRoundResult: [],
    onTablePlayerShowCards: [],
    onTablePlayerMuckCards: [],
    onTablePlayerShowCardsButton: [],
    onTablePlayerFoldAnyBet: [],
    onBuyInOpen: [],
    onPlayerLeave: [],
    onMessage: [],
    onAnimation: [],
    onTourneyInfo: [],
    onCashWaitList: [],
    onLog: [],
    onChat: [],
    onTip: [],
    onConnect: [],
    onDisconnect: [],
    onInsurance: [],
    /*  onSideBetOptions: [],
     onSideBetHistory: [],
     onTableFreeBalance: [],
     onSideBetOptions: [],
     onSideBetHistory: [],
     onTableFreeBalance: [], */
};

function triggerEventListeners(name, data) {
    console.log(`EventName: ${name}\nData:`);
    console.log(data);
    if (!eventListeners[name])
        return;
    try {
        data = JSON.parse(data);
    } catch {}
    eventListeners[name].forEach(listener => {
        listener(data);
    });
}

function eventTrigger(name) {
    return data => {
        triggerEventListeners(name, data);
    };
}

/**
 * Adds a function that will be called when the event is triggered.
 * @param {String} eventName 
 * @param {Function} callback 
 */
export function subscribe(eventName, callback) {
    if (!eventListeners[eventName])
        eventListeners[eventName] = [];
    if (typeof callback !== 'function')
        throw "The callback should be a function";
    eventListeners[eventName].push(callback);
}

// client - TS

export function emit(eventName, data) {
    socket.emit(eventName, data);
}
export function ShowTipToDealer(amount, callback) {
    socket.emit("REQ_TIP_DEALER", { amount: amount },
        (strResult) => {
            const result = JSON.parse(strResult);
            if (result.status) {
                callback();
            } else {
                console.log(`Failed Tip to Deal event`);
            }
        });
}

export function joinToTs(userToken, tsToken) {
    socket.emit("REQ_PLAYER_ENTER", {
        user: userToken,
        user_token: userToken,
        thread: userToken,
        table: tsToken,
        table_token: tsToken
    }, (success) => {
        if (success) {
            console.log("Success to join table server.");
        } else {
            console.error("Failed to join table server. Quiting now.");
        }
    });
}

export function submitSideBet(bets, street) {
    socket.emit("REQ_PLAYER_SIDEBET", { sidebets: bets, street },
        (strResult) => {
            const result = JSON.parse(strResult);
            console.log('Side Bet submitted \n', result.sideBet);
        });
}

export function joinToTsWithMtData(userEncrypted, tsToken) {
    socket.emit("REQ_PLAYER_ENTER_ENCRYPT", {
        user_encrypted: userEncrypted,
        table: tsToken,
        table_token: tsToken
    }, (success) => {
        if (success) {
            console.log("Success to join table server.");
        } else {
            console.error("Failed to join table server. Quiting now.");
        }
    });
}

export function playerLeave() {
    socket.emit("REQ_PLAYER_LEAVE");
    window.close();
}

export function playerSitDown(sitIndex) {
    socket.emit("REQ_PLAYER_SITDOWN", {
        seat: sitIndex
    }, (result) => {
        if (result)
            console.log(`Success to sitdown. seat: ${sitIndex}`);
        else
            console.log(`Failed to sitdown. seat: ${sitIndex}`);
    });
}

export function playerBuyChips(amount, autoTopUpLess, autoTopUpZero) {
    if (!autoTopUpLess)
        autoTopUpLess = false;
    if (!autoTopUpZero)
        autoTopUpZero = false;
    socket.emit("REQ_PLAYER_BUYIN", {
        amount: amount,
        autoTopUpLess: autoTopUpLess,
        autoTopUpZero: autoTopUpZero
    }, (strResult) => {
        const result = JSON.parse(strResult);
        if (result.status)
            console.log(`Success to buy-in. buyin: ${amount}`);
        else {
            console.log(`Failed to buy-in. buyin: ${amount}`);
            console.log(result.message);
        }
    });
}

export function playerTransfer(amount, callback) {
    socket.emit("REQ_PLAYER_TRANSFER", {
        amount: amount,
    }, (strResult) => {
        const result = JSON.parse(strResult);
        if (result.status) {
            console.log(`Success to transfer. amount: ${result.updatedTableWalletBalance}`);
            callback(result.updatedGlobalBalance, result.updatedTableWalletBalance);
        } else {
            console.log(`Failed to tranfer. amount: ${amount}`);
            console.log(result.message);
        }
    });
}

export function sendTurnAction(action, amount) {
    console.log({
        action: action,
        bet: amount
    });
    socket.emit("REQ_PLAYER_ACTION", {
        action: action,
        bet: amount
    });
}

export function showCards() {
    socket.emit("REQ_PLAYER_SHOWCARDS");
}

export function waitForBB(value) {
    socket.emit("REQ_PLAYER_ WAITFORBB", {
        value: value
    });
}

export function sitOutNextHand(value) {
    socket.emit("REQ_PLAYER_SITOUTNEXTHAND", {
        value: value
    });
}

export function playerSitOut() {
    socket.emit("REQ_PLAYER_SITOUT");
}

export function playerSitIn() {
    socket.emit("REQ_PLAYER_SITIN");
}

export function updatePlayerInfo(callback) {
    socket.emit("REQ_PLAYER_INFO", (result) => {
        callback();
        if (!result) {
            console.error("Failed to update player info.");
        }
    });
}

export function autoFold(value, callback) {
    socket.emit("REQ_AUTO_FOLD", { value: value }, callback);
}

export function playerLeaveGame() {
    socket.emit("REQ_PLAYER_LEAVEGAME");
}
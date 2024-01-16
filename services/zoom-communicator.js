import { playerBuyChips, playerLeave } from "../socket-client";
import { toggleCheckbox } from "../UI/checkbox";
import { connectWithMtData, getParamGameId, userToken } from "./game-server";
import { getPlayerSeat, round, sitOut, tableSettings, tableSubscribe, turn } from "./table-server";

// Add the origin where the zoom page is hosted.
const allowedZoomOrigins = [
    "https://nrpoker.net",
];

let playerResult = undefined;
let gameId = getParamGameId();

const receivedMessagesIds = [];

export function addEventListener (eventName, handler) {
    window.addEventListener('message', message => {
        if (receivedMessagesIds.indexOf(message.data.messageId) != -1)
            return;
        receivedMessagesIds.push(message.data.messageId);
        if (message.data.gameId != undefined)
            gameId = message.data.gameId;
        // Reject events from origins not on the list.
        if (allowedZoomOrigins.indexOf(message.origin) == -1) {
            console.warn(`Message rejected from origin ${message.origin}`);
            return;
        }
        dispatchEvent('yes', message.data.eventName);
        if (message.data.eventName == eventName)
            handler(message.data.eventData);
    });
}

export function dispatchEvent (eventName, eventData) {
    let targetWindow = window.parent;
    if (!targetWindow || targetWindow == window)
        targetWindow = window.opener;
    if (!targetWindow)
        throw "Can't send messege to target window null";
    if (targetWindow == window)
        throw "Target window is window?";
    for (const allowedZoomOrigin of allowedZoomOrigins) {
        let sent = false;
        try {
            targetWindow.postMessage({gameId: gameId, eventName: eventName, eventData: eventData}, allowedZoomOrigin);
            sent = true;
        } catch (e) {
            //console.warn(e);
        }
        if (!sent)
            console.warn("The origin of the target window is not in the whitelist");
    }
}

export function updateZoom () {
    const seatToPlay = turn.seat;
    const playerSeat = getPlayerSeat();
    const numberOfSeats = tableSettings.numberOfSeats;
    const detail = {
        minBuyIn: tableSettings.minBuyIn,
        maxBuyIn: tableSettings.maxBuyIn,
        tableName: tableSettings.name
    };

    if (turn) {
        if (playerSeat == seatToPlay)
            detail.status = "turn";
        else if ((seatToPlay + 1) % numberOfSeats == playerSeat)
            detail.status = "next";
        detail.turnDuration = turn.time ? turn.time[1] : undefined
    }

    if (playerResult)
        detail.status = playerResult;

    dispatchEvent('update', detail);
}
addEventListener('tsdata', data => {
    connectWithMtData(data)
    console.log("Getting TS data from MT", data)
});

addEventListener('sitOut', sitOut);
addEventListener('leave', playerLeave);
addEventListener('buy-in', e => {
    playerBuyChips(e.detail);
});
addEventListener('checkbox', e => {
    const checkbox = $(`#${e.detail.id}`)[0];
    const value = e.detail.value;
    toggleCheckbox(checkbox, value);
});

tableSubscribe('onTableSettings', updateZoom);
// tableSubscribe('onRoundResult', updateZoom);
tableSubscribe('onRoundTurn', updateZoom)
tableSubscribe('onTableStatus', () => {
    playerResult = undefined;
});
tableSubscribe('onRoundResult', result => {
    for (const pot of result.pots) {
        for (const seatIndex of pot.winners) {
            if (seatIndex == getPlayerSeat())
                playerResult = "win";
                updateZoom();
                return;
        }
    }
    playerResult = "lose";
    updateZoom();
});
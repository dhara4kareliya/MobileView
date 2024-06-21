import { Player } from './player-ui';
import { Sound } from './audio';
import { getMoneyText, getMoneyValue } from "./money-display";
import { TipToDealer, getPlayerSeat, tableSettings } from '../services/table-server';
import { getCardImageFilePath } from './card-ui';

const totalPotDiv = $("#totalPot")[0];
const streetPotDiv = $("#currentSreetPotDiv")[0];
const totalPotSpan = $("#totalPot span")[0];
const winPotSpan = $("#winPot span")[0];
const streetPotSpan = $("#currentSreetPotDiv span")[0];
const sidePots = $(".sidePot");
const logDiv = $('.logTabButton .activInner .log_data')[0];
const AutoTip = $(".AutoTip")[0];
const AutoTipCheckboxes = $(".AutoTip .checkbox")[0];
let lastBet = 0;
let prevState = "";
let lastAnimationAction = "betAction";
let lastBetPlayer = null;
const sound = new Sound();

export class Table {
    constructor() {
        this.firstSeat = 0;
        this.players = [];
        this.playerWrappers = [];
        this.seats = [];
        this.init();
        this.mode = modes.Observing;
        this.showInBB = false;
        this.showInUSD = false;
        this.sidePots = undefined;
        this.shift = 0;
        this.showSbBbButtons = false;
        this.siticonVisible = false;
        this.tableCardsCount = 0;
        this.closeTable = false;
    }

    init() {
        this.playerWrappers = this.getSortedPlayerWrappers();

        for (let i = 0; i < 9; ++i) {
            let player = new Player(this.playerWrappers[i], i);
            this.players.push(player);
        }

        totalPotDiv.style.visibility = "hidden";
        streetPotDiv.style.visibility = "hidden";
    }

    setSitVisible(value) {
        this.siticonVisible = value;
    }

    setTotalPot(amount) {
        const amountText = getMoneyText(amount);
        totalPotSpan.innerHTML = winPotSpan.innerHTML = amountText.outerHTML
        totalPotDiv.style.visibility = "visible";
    }

    setStreetPot(amount) {
        const amountText = getMoneyText(amount);
        streetPotSpan.innerHTML = amountText.outerHTML;
        streetPotDiv.style.visibility = "visible";
    }

    setSidePots(pots) {
        for (const sidePot of sidePots) {
            sidePot.style = "";
            sidePot.style.visibility = "hidden";
        }
        // if (pots === undefined) {
        //     this.setTotalPot(0);
        //     return;
        // }
        this.sidePots = pots;
        let totalPot = 0;
        // if (pots.length == 0) {
        //     this.setTotalPot(0);
        //     return;
        // }

        for (let j = 0; j < 2; ++j)
            for (let i = 0; i < pots.length; ++i) {
                const index = sidePots.length / 2 * j + i;

                const sidePot = sidePots[index];
                sidePot.style.visibility = "visible";
                const moneySpan = $(sidePot).find(".money")[0];
                moneySpan.innerText = getMoneyValue(pots[i].amount);
                if (j == 0)
                    totalPot += pots[i].amount;
            }
            // this.setTotalPot(totalPot);
    }

    setShowInBB(isShowInBB) {
        this.showInBB = isShowInBB;
        this.setSidePots(this.sidePots);
        this.players.forEach(player => {
            player.setShowInBB(isShowInBB);
        });
    }

    setShowInUSD(isShowInUSD) {
        this.showInUSD = isShowInUSD;
        this.setSidePots(this.sidePots);
        this.players.forEach(player => {
            player.setShowInUSD(isShowInUSD);
        });
    }

    setBigBlind(bb) {
        this.bigBlind = bb;
        this.players.forEach(player => {
            player.setBigBlind(bb);
        });
    }

    setUsdRate(usd) {
        this.usdRate = usd;
        this.players.forEach(player => {
            player.setUsdRate(usd);
        });
    }

    setCloseTable(status) {
        this.closeTable = status;
    }

    addTip(data) {
        console.log(data);
        this.players[data.seat].TipDealer(data);
    }

    setMode(mode) {
        this.mode = mode;
        if (this.mode === modes.Observing && this.closeTable !== true)
            this.setSitDownBtn();
        // this.arrangeSeats(this.seats);/
    }

    getSortedPlayerWrappers() {
        let playerWrappers = $(".player_wrapper");
        return playerWrappers.sort((a, b) => {
            if (a.classList[1] == undefined || b.classList[1] == undefined)
                return 0;
            return +a.classList[1] - +b.classList[1];
        });
    }

    /**
     * Rotates the seats such that the targetSeat
     * is moved to destinationSeat.
     * The relative positions remain.
     * @param {Number} targetSeat 
     * @param {Number} destinationSeat 
     */
    rotatePlayerWrappers(targetSeat, destinationSeat) {
        const tempArray = this.players.slice();
        this.shift = (destinationSeat - targetSeat + this.players.length) % this.players.length;
        for (let i = 0; i < this.players.length; i++) {
            this.players[i] = tempArray[(i + this.shift) % this.players.length];
        }
    }

    restorePlayerWrappers() {
        const tempArray = this.players.slice();
        for (let i = 0; i < this.players.length; i++) {
            this.players[i] = tempArray[(i + this.players.length - this.shift) % this.players.length];
        }
    }

    setFirstSeat(seat) {
        this.firstSeat = seat;
    }

    removePlayerActionLabel() {
        for (let i = 0; i < this.players.length; ++i) {
            let player = this.players[i];
            player.removeActionLabel();
        }
    }

    removeMuckedFlag() {
        for (let i = 0; i < this.players.length; ++i) {
            let player = this.players[i];
            player.removeMuckedFlag();
        }
    }

    setSitDownBtn() {
        for (let i = 0; i < this.seats.length; ++i) {
            let player = this.players[i];
            let seat = this.seats[i];
            if (seat.state === "Empty") {
                player.showSitDownButton(true && this.siticonVisible && this.closeTable !== true)
            }
        }
    }

    arrangeSeats(seats, RoundState) {
        let playingIndex = 0;
        const gameRunning = seats.find(seat => seat.state === 'Playing') !== undefined;

        for (let i = 0; i < seats.length; ++i) {
            let player = this.players[i];
            let seat = seats[i];
            if (seat.state === "Empty") {
                player.setPlayState(false);
                player.showSitDownButton(this.mode === modes.Observing && this.siticonVisible && getPlayerSeat() < 0 && this.closeTable !== true)
            } else {
                player.setIsPlayer(getPlayerSeat() != -1 && getPlayerSeat() == i);
                player.showPlayer(true);
                player.setPlayState(true);
                player.setTip(getPlayerSeat() > -1)
                player.setPlayerName(seat.player.name);
                player.setPlayerMoney(seat.money);
                player.setPlayerAction(seat.lastAction);
                player.setPlayerAvatar(seat.player.avatar);
                player.setAmountAnimation(false);
                // player.setPlayerBet(seat.lastAction == "allin" ? seat.bet : seat.lastBet);
                player.setPlayerBet(seat.lastBet);
                if (lastBetPlayer == i) {
                    var checkAction = seat.lastAction == "check" || seat.lastAction == "fold";
                    this.PlayerAnimation({ type: "betAction", animation: !checkAction, actionCheck: checkAction, data: { index: lastBetPlayer } });
                    if (seat.state == "Playing") {
                        switch (seat.lastAction) {
                            case "check": 
                                sound.playCheck();
                                break;
                            case "call":
                                sound.playCall();
                                // player.setAmountAnimation(seat.lastBet);
                                break;
                            case "raise":
                                sound.playRaise();
                                // player.setAmountAnimation(seat.lastBet);
                                break;
                            case "allin":
                                sound.playAllin();
                                // player.setAmountAnimation(seat.lastBet);
                                break;
                            case "fold":
                                sound.playFold();
                                break;
                        }
                    }
                }
                if (tableSettings.mode == "cash" && seat.state === "Waiting" && RoundState != "None" && gameRunning) {
                    player.showWaitForBBLabel(seat.state === "Waiting");
                }

                if (seat.state == 'Playing' && !seat.fold) {
                    setTimeout(() => {
                        player.setCards(seat.cards);
                    }, playingIndex * 50);

                    ++playingIndex;
                } else
                    player.clearCards();


            }

            player.setGreyStatus(seat);
            player.setMissingBigBlindButton(seat.missingBB);
            player.setMissingSmallBlindButton(seat.missingSB);
        }
    }

    setSeats(seats, RoundState) {
        this.seats = seats;
        this.arrangeSeats(seats, RoundState);
    }

    getActiveSeats() {
        const activeSeate = [];
        for (let i = 0; i < this.seats.length; ++i) {
            if (this.seats[i].state == "Playing")
                activeSeate.push(i);
        }
        return activeSeate;
    }

    setShowSbBbButtons(value) {
        this.showSbBbButtons = value;
    }

    setButtons(dealerSeat, sbSeat, bbSeat) {
        for (let i = 0; i < this.players.length; ++i) {
            const player = this.players[i];
            player.setDealerButton(i == dealerSeat);
            player.setSmallBlindButton(false);
            if (i == sbSeat) {
                if (this.showSbBbButtons)
                    player.setSmallBlindButton(true);
            } else if (i == bbSeat) {
                if (this.showSbBbButtons)
                    player.setBigBlindButton(true);
            }
        }
    }

    setTableCards(cards) {

        if (cards == undefined) return;

        for (let i = this.tableCardsCount; i < cards.length; ++i) {
            const cardFilePath = getCardImageFilePath(cards[i]);
            this.tableCardsCount = this.tableCardsCount + 1;
            setTimeout(() => {
                const tableCard = `<div class="tableCard" value=${cards[i].toLowerCase()}>
                                    <img class="back" src="./images/png/102x142/back.png"/>
                                    <img class="front" src="${cardFilePath}"/>
                                </div>`;

                $('.tableCards').append(tableCard)

            }, 200 * i);
            // $('.tableCards').append(tableCard)
        }
    }
    PlayerAnimation(result) {
        const players = this.players;
        console.log(result);
        if (result.type == "TableStatus") {
            if (result.data.state != prevState && lastAnimationAction != "AllIn") {
                const div = document.querySelector('.chipRow');
                const rect = div.getBoundingClientRect();
                players.forEach((player, index) => {
                    const wrapper = player.wrapper;
                    let element = wrapper.querySelector('.lastBetDiv');
                    var x = rect.left;
                    var y = rect.top;

                    if (element)
                        this.AnimateDivsToLocation(x + 42, y + 5, element, 0, `900ms`);
                });
            }
            prevState = result.data.state;
        } else if (result.type == "betAction") {
            const index = result.data.index;
            if (result.animation && lastBetPlayer != null && !result.actionCheck) {
                const player = players[index];
                console.warn(player);
                const wrapper = player.wrapper;
                const player_wrapper = $(wrapper)[0];
                const lastBetDiv = player_wrapper.querySelector(".lastBetDiv");
                lastBetDiv.style = "";
                lastBetDiv.style.visibility = "visible";
                let lastBetDivImg = player_wrapper.querySelector(".lastBetDiv").querySelector("img");
                let element = player_wrapper.querySelector('.betAnimation');
                element.style = "";
                element.style.visibility = "visible";
                const rect = lastBetDivImg.getBoundingClientRect();
                lastAnimationAction = result.type;
                this.AnimateDivsToLocation(rect.left + 4, rect.top + 3, element, 0, `680ms`);
                console.warn(lastBet);
                player.setAmountAnimation(lastBet);
                lastBetPlayer = null;
                lastBet = 0;
            } else if (result.actionCheck) {
                lastBetPlayer = null;
                lastBet = 0;
            } else {
                lastBetPlayer = index;
                lastBet = result.data.bet;
            }
        } else if (result.type == "WinnerAnimate") {
            const rect = result.wrapper.querySelector('.avatar').getBoundingClientRect();
            this.AnimateDivsToLocation(rect.left, rect.top, result.winPot, 0, `900ms`);
            this.clearAnimateCss(result.element);
            this.AnimateDivsToLocation(rect.left + 25, rect.top + 25, result.element, 0, `900ms`);
        } else if (result.type == "AllIn") {
            lastAnimationAction = result.type;
        }
    }
    clearAnimateCss(element) {
        if (element) {
            element.style.transform = ``;
            element.style.opacity = 1;
            element.style.transition = ``;
        }
    }
    AnimateDivsToLocation(x, y, div, opacity, speed) {
        const rect = div.getBoundingClientRect();
        const divX = rect.left + rect.width / 2;
        const divY = rect.top + rect.height / 2;
        const distanceX = x - divX;
        const distanceY = y - divY;
        div.style.transform = `translate(${distanceX}px,${distanceY}px)`;
        div.style.opacity = opacity;
        div.style.transition = `transform ${speed}, opacity ${speed}`;
    }

    showRoundResult(result) {
        const playerMap = result.players;
        let index = 0;
        result.pots.forEach(pot => {
            const winners = pot.winners;
            const indexDesktop = sidePots.length / 2 + index;
            const indexMobile = index;

            setTimeout(() => {
                sidePots[indexMobile].style.visibility = 'hidden';
                //sidePots[indexDesktop].style.visibility = 'hidden';
                for (let i = 0; i < this.players.length; ++i) {
                    let player = this.players[i];
                    if (winners.indexOf(i) != -1) {

                        var data = playerMap.filter((item) => item.seat === i)[0];
                        player.showWinner(true);
                        sound.playWin();
                        var winPot = $("#winPot")[0];
                        winPot.style = "";
                        winPot.style.visibility = "visible";
                        if (winners.length <= 1) {
                            this.PlayerAnimation({ "type": "WinnerAnimate", "wrapper": player.wrapper, "element": sidePots[indexDesktop], "winPot": winPot, "indexMobile": indexMobile, "indexDesktop": indexDesktop });
                        } else {
                            /* var sidePotClones = sidePots[indexDesktop].cloneNode(true);
                             var winPotClones = winPot.cloneNode(true);
                             var AllSidePotClones = [];
                             for (var totalWinner = 0; totalWinner < winners.length; totalWinner++) {
                                 var sidePotClone = sidePotClones.cloneNode(true);
                                 var winPotClone = winPotClones.cloneNode(true);
                                 const moneySpan = $(sidePotClone).find(".money")[0];
                                 moneySpan.innerText = `$${pot.prize}`;
                                 sidePots[indexDesktop].parentElement.appendChild(sidePotClone);
                                 winPot.parentElement.appendChild(winPotClone);
                                 this.PlayerAnimation({ "type": "WinnerAnimate", "wrapper": player.wrapper, "element": sidePotClone, "winPot": winPotClone, "indexMobile": indexMobile, "indexDesktop": indexDesktop });
                                 AllSidePotClones.push({ "sidePotClone": sidePotClone, "winPotClone": winPotClone });
                             }
                             sidePots[indexDesktop].style.visibility = 'hidden';
                             winPot.style.visibility = "hidden";
                             setTimeout(() => {
                                 AllSidePotClones.forEach(clone => {
                                     clone.sidePotClone.remove();
                                     clone.winPotClone.remove();
                                 })
                             }, 1200);*/
                        }
                        player.showPrize(pot.prize);
                        if (data.hand != undefined) {
                            this.HighlightTableCards(data.hand.cards);
                            player.HighlightCards(data.hand.cards);
                            player.showWinnerHand(true);
                            player.setWinnerCards(data.hand.cards);
                            player.setWinnerHand(data.hand.rank);
                        } else {
                            player.showWinnerHand(false);
                        }
                        this.addLog(`${player.name} wins ${index === 1 ? 'main pot' : ('side pot ' + index)} of ${pot.prize} with ${data.hand ? data.hand.cards.join(' ') : ''}`)
                    } else {
                        player.setTotalCardMask();
                    }
                }
            }, 2000 * index);

            ++index;

            setTimeout(() => {
                this.HighlightTableCards();
                this.players.forEach(player => {
                    player.HighlightCards();
                    player.showWinner(false);
                    player.showWinnerHand(false);
                });
            }, 2000 * index);
        });

        setTimeout(() => {
            this.players.forEach(player => {
                player.HighlightCards();
                player.showWinner(false);
                this.clearTableCards();
                player.clearPlayerAnimationCss();
                prevState = "";
            });
        }, 2000 * index);
    }

    AutoTip(result){
        result.pots.forEach(pot => {
            const winners = pot.winners;
                for (let i = 0; i < this.players.length; ++i) {
                    if (winners.indexOf(i) != -1) {
                            if (AutoTipCheckboxes.checked) {
                                if(winners == getPlayerSeat()){
                                TipToDealer((pot.prize* 0.02).toFixed(2));
                                }
                            }
                    }
                }
        });
    }

    HighlightTableCards(cards) {
        const tableCards = $(".tableCard");

        if (!cards) {
            for (const card of tableCards) {
                if (card.attributes['value'].value != "?")
                    card.classList.remove("with_mask")
            };
            return;
        }

        for (const card of tableCards) {
            if (cards.indexOf(card.attributes['value'].value.toUpperCase()) == -1) {
                card.classList.add("with_mask")
            }
        }
    }

    clearTableCards() {
        $('.tableCards')[0].innerHTML = '';
        this.tableCardsCount = 0;
    }

    clearTurn() {
        for (let i = 0; i < this.players.length; ++i) {
            let player = this.players[i];
            player.clearTurnTimer();
        }
    }

    setTurn(turn) {
        for (let i = 0; i < this.players.length; ++i) {
            let player = this.players[i];
            if (i == turn.seat) {
                player.setTurnTimer(turn.timeout, turn.timeToReact, Math.round(turn.timeBank));
                player.removeActionLabel();
            } else {
                player.clearTurnTimer();
            }
        }
    }

    getTurnPlayerCards(seat) {
        return this.seats[seat].cards;
    }

    showCards(seat, cards) {
        for (let i = 0; i < this.players.length; ++i) {
            let player = this.players[i];
            if (i == seat) {
                player.showCards(cards);
            }
        }
    }

    muckCards(seat) {
        for (let i = 0; i < this.players.length; ++i) {
            let player = this.players[i];
            if (i == seat) {
                player.muckCards();
            }
        }
    }

    addLog(text) {
        logDiv.innerHTML = logDiv.innerHTML + '<p class="firsr_but mt-2 px-2">' + text + '</p>';
    }
}

export const modes = Object.freeze({
    None: 0,
    Joining: 1,
    Playing: 2,
    Observing: 3
});

export const playerStates = Object.freeze({
    None: 0,
    Leaving: 1,
    Joining: 2,
    SitOut: 3,
    Waiting: 4,
    Playing: 5,
    Observing: 6
});

export default {
    playerStates,
}
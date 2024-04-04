import { getPlayerSeat, sitDown } from "../services/table-server";
import { getMoneyValue, getMoneyText } from "./money-display";
import { Card, getCardImageFilePath } from "./card-ui";
import { userMode } from '../services/game-server';
import { Sound } from './audio';
import { ShowTipToDealer } from "../socket-client";

const sound = new Sound();
const actionColors = {
    "CHECK": "#1F9231",
    "CALL": "#1F9231",
    "ALLIN": "#1F9231",
    "RAISE": "#FF8400",
    "BET": "#FF8400",
    "FOLD": "#EC262F",
    "BIG BLIND": "#595959",
    "SMALL BLIND": "#595959",
    "MISSING BB": "#595959",
    "MISSING SB": "#595959",
    "BB": "#595959",
    "SB": "#595959",
    "SittingOut": "#595959",
    "Waiting For BB": "#595959",
    "MUCKED": "#EC262F",
};

const playerFieldSelectors = {
    avatar: ".avatar",
    flag: ".flag",
    name: ".name",
    money: ".money",
    lastAction: ".action",
    blind: ".blind",
    dealer: ".dealer",
    handResult: ".handResult",
    winner: ".winnerImg",
    winnerHand: ".winnerhand",
    lastBet: ".lastBetDiv",
    stars: ".stars",
    prize: ".prize",
    missSb: ".missSb",
    missBb: ".missBb",
    lastBetAmount: '.betAmountAnimation',
    extraToken: ".extraToken"
};

const fieldAlternativeActions = {
    lastBet: (element, value) => {
        const span = $(element).find("span")[0];
        span.innerHTML = value;
    },
    lastBetAmount: (element, value) => {
        const span = $(element).find("span")[0];
        span.innerHTML = value;
    },
    prize: (element, value) => {
        const span = $(element).find("span")[0];
        span.innerHTML = value;
    },
    winnerHand: (element, value) => {
        const span = $(element).find("span")[0];
        span.innerHTML = value;
    },
    blind: srcToken,
    avatar: (element, value) => {
        element.src = value;
        console.log(value);
    },
    lastAction: (element, value) => {
        element.innerText = value;
        if (actionColors[value])
            element.style.backgroundColor = actionColors[value];
    },
    extraToken: srcToken
};

function srcToken(element, value) {
    element.src = value;

    if (value == missingSmallBlindSrc || value == missingBigBlindSrc)
        $(element).addClass('shrink');
    else
        $(element).removeClass('shrink');
}

const playerWrapperHTML = `
<div class="timeCircle">
    <div>9</div>
</div>
<div class="avtar_img">
    <div class = "betAmountAnimation">
        <span>+55</span>
    </div>
    <img src="./images/desktop/22 copy 7@2x.png" class="avatar">
    <div class="player-cards"></div>
    <div class="betAnimation">
        <img src="./images/desktop/1 copy 4-1@2x.png">
    </div>
</div>
<div class="tangoHeadBlack">
    <div class="title name">Tangotag</div>
    <div class="price money">$5.24</div>
</div>
<div class="raise action">RAISE</div>
<div class="turnTime">
    <div></div>
</div>
<!--<div class="bigSmallBlind">BIG BLIND</div>-->
<div class="lastBetDiv">
    <img src="./images/desktop/1 copy 4-1@2x.png">
    <span>{X} 55</span>
</div>
<img src="./images/desktop/WINNER.png" class="winnerImg">
<img class="dealer" src="./images/desktop/newdealer.png">
<img class="blind" src="./images/desktop/SB.png">
<img class="missSb" src="./images/desktop/newms.png">
<img class="missBb" src="./images/desktop/newmb.png">
<div class="prize">
    <span class="textset">Prize Amount</span>
</div>
<div class="toast-container text-black p-3">
            <div id="toastMessage" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="me-auto">Thank you user for 10BB Tips</strong>
                  </div>
            </div>
          </div>
`;
//<img class = "extraToken" src="./images/desktop/MSB.png">
const sitDownHTML = "<button class=\"sitDownButton\"></button>";

const smallBlindSrc = "./images/desktop/newsb.png";
const bigBlindSrc = "./images/desktop/newbb.png";

const dealerSrc = "./images/D.png";

const missingSmallBlindSrc = "./images/desktop/MSB.png";
const missingBigBlindSrc = "./images/desktop/MBB.png";

const mainPlayerIndex = 5;
let previousMainPlayerIndex = -1;

const cardsImageProperties = {
    cardWidth: 102,
    cardHeight: 142
}

const playerWrappers = getSortedPlayerWrappers();

function getSortedPlayerWrappers() {
    let playerWrappers = $(".player_wrapper");
    return playerWrappers.sort((a, b) => {
        if (a.classList[1] == undefined || b.classList[1] == undefined)
            return 0;
        return +a.classList[1] - +b.classList[1];
    });
}
function  tipButtonClickHandler(event) {
    const TipAmount = event.target.getAttribute('value');
    ShowTipToDealer(TipAmount, () => {
        // $('#TipToDealer').modal('show');
    });
}

export class Player {
    constructor(wrapper, seatIndex) {
        this.wrapper = wrapper;
        this.cards = [];
        this.seatIndex = seatIndex;
        this.wrapper.innerHTML = playerWrapperHTML;
        this.wrapper.style.visibility = "hidden";
        this.name = "";
        this.interval = undefined;
        this.reactTimeOut = undefined;
        this.showInBB = false;
        this.showInUSD = false;
        this.bigBlind = undefined;
        this.usdRate = undefined;
        this.money = undefined;
        this.bet = undefined;
        this.prize = undefined;
        this.turnCountInterval = undefined;
        this.missingBB = false;
        this.missingSB = false;
        this.mucked = false;
        this.isPlaying = false;
    }

    setPlayState(isPlaying) {
        this.isPlaying = isPlaying;
    }

   
    
    setTip(player) {
        const TipsOptions = document.querySelectorAll("#tip-button button");
        if (player === true) {
    
            TipsOptions.forEach(function(button) {
                button.addEventListener('click', tipButtonClickHandler);
            });
        }
    }

    setShowInBB(isShowInBB) {
        this.showInBB = isShowInBB;
        this.setPlayerMoney(this.money);
        this.setPlayerBet(this.bet);
    }
    setShowInUSD(isShowInUSD) {
        this.showInUSD = isShowInUSD;
        this.setPlayerMoney(this.money);
        this.setPlayerBet(this.bet);
    }

    setBigBlind(bb) {
        this.bigBlind = bb;
    }

    setUsdRate(usd) {
        this.usdRate = usd;
    }

    setCards(cards) {
        if (cards == undefined) return;

        // const animated = this.cards.length > 0;
        // if (animated) return;

        if (this.cards.toString() == cards.toString()) return;

        if (this.cards.length > 0 && this.cards.every(c => c === '?') && cards.every(c => c !== '?')) {
            this.showCards(cards);
            return;
        }

        this.cards = cards;

        let twoCardsClassName = "";
        let fourCardsClassName = "";

        if (cards.length == 2) twoCardsClassName = "two-cards";
        if (cards.length == 4 || cards.length == 5) fourCardsClassName = "four-cards";

        if (fourCardsClassName != "") {
            $(this.wrapper).find('.player-cards').addClass(fourCardsClassName);
        }
        for (let i = 0; i < cards.length; ++i) {
            const card = cards[i].toLowerCase();
            const cardImgFilePath = getCardImageFilePath(card);
            const tableCard = `<div class="content player-card ${twoCardsClassName}" value=${card} style="animation-name:${card == '?' ? "slide-animation" : "slideInDown"}">
                                    <img class="back" src="./images/png/102x142/back.png"/>
                                    <img class="front" src="${cardImgFilePath}"/>
                                </div>`;

            $(this.wrapper).find('.player-cards').append(tableCard)
        }
    }

    showCards(cards) {
        if (JSON.stringify(this.cards) === JSON.stringify(cards)) return;

        const playerCards = $(this.wrapper).find(".player-card");

        let i = 0;
        for (const card of playerCards) {
            const cardDeck = cards[i].toLowerCase();
            const cardImgFilePath = getCardImageFilePath(cardDeck);
            card.attributes['value'].value = cardDeck;
            $(card).find('.front')[0].src = cardImgFilePath;
            i = i + 1;
        };

        for (const card of playerCards) {
            card.style.animationName = "flip-animation";
        }
    }

    clearCards() {
            $(this.wrapper).find('.player-cards')[0].innerHTML = '';
            this.cards = [];
        }
        /**
         * Sets the value in the element.
         * undefined or false will make it invisible.
         * true will make it visible again.
         * @param {String} fieldName 
         * @param {String} value 
         */
    setWrapperField(fieldName, value) {
        const selector = playerFieldSelectors[fieldName];
        if (!selector)
            throw `No selector for ${fieldName}`;
        let element = $(this.wrapper).find(selector)[0];
        if (!element)
            return;
        if (value === undefined || value === false) {
            element.style.visibility = "hidden";
            return;
        }
        element.style.visibility = "visible";
        if (value === true)
            return;
        if (fieldAlternativeActions[fieldName])
            fieldAlternativeActions[fieldName](element, value);
        else
            element.innerHTML = value;
    }

    setStars(value) {
        this.setWrapperField("stars", value);
    }

    setGreyStatus(seat) {
        if (seat.state == 'SitOut' || seat.lastAction == 'fold') {
            this.wrapper.style.opacity = 0.5;
        } else {
            this.wrapper.style.opacity = 1;
        }

        if (seat.state == 'SitOut') {
            this.setWrapperField("lastAction", "SittingOut");
        }
    }

    setPlayerName(name) {
        this.setWrapperField("name", name);
        this.name = name;
    }

    setPlayerMoney(amount) {
        this.money = getMoneyValue(amount);
        const amountText = getMoneyText(amount);
        let value = amount ? amountText.outerHTML : false;
        this.setWrapperField("money", value);
    }

    setPlayerBet(amount) {
        this.bet = amount;
        let value = false;

        if (amount) {
            const amountText = getMoneyText(amount);
            value = amountText.outerHTML;
        }

        this.setWrapperField("lastBet", value);
    }

    setAmountAnimation(amount) {
        let value = amount ? `+${getMoneyValue(amount)}` : false;
        this.setWrapperField("lastBetAmount", value);
        var element = $(this.wrapper).find(".betAmountAnimation")[0];
        if (value === false) {
            element.style.animation = '';
            element.style.animationFillMode = `none`;
        } else {
            element.style.animation = `betAmountAnimation 1s`;
            element.style.animationFillMode = `both`;
        }
    }

    setPlayerAction(action) {
        this.setWrapperField("lastAction", action ? action.toUpperCase() : false);
    }

    muckCards() {
        this.mucked = true;
        this.clearCards();
        this.setWrapperField("lastAction", "MUCKED");
    }

    removeMuckedFlag() {
        this.mucked = false;
    }

    removeActionLabel() {
        if (this.mucked) return;

        this.setWrapperField("lastAction", false);
    }

    showWinner(value) {
        if (value) {
            $(this.wrapper).addClass("winner");
            this.setWrapperField("prize", true);
        } else {
            let element = $("#winPot")[0];
            element.style = "";
            element.style.visibility = "hidden";
            $(this.wrapper).removeClass("winner");
            this.setWrapperField("prize", false);
        }
    }

    showWinnerHand(value) {
        if (value) {
            this.setWrapperField("winnerHand", true);
        } else {
            this.setWrapperField("winnerHand", false);
        }
    }

    showPrize(amount) {
        let value = false;
        if (amount) {
            const amountText = getMoneyText(amount);
            value = amountText.outerHTML;
        }
        this.setWrapperField("prize", value);
    }

    setWinnerHand(handRank) {
        this.setWrapperField('winnerHand', handRank);
    }

    setWinnerCards(cards) {
        const canvas = $(this.wrapper).find(".winnerhand canvas")[0];

        if (!canvas) return;

        canvas.width = cardsImageProperties.cardWidth * 5 * 0.5;
        canvas.height = cardsImageProperties.cardHeight * 0.5;

        for (let i = 0; i < cards.length; ++i) {
            const card = new Card(canvas);
            card.setCardName(cards[i]);
            card.setPosition(i);
            card.setRatio(0.5)
            card.drawCard();
        }
    }

    setDealerButton(visible) {
        if (!visible)
            this.setWrapperField("dealer", false);
        else
            this.setWrapperField("dealer", true);
    }

    setSmallBlindButton(visible) {
        if (this.missingSB) return;
        if (!visible)
            this.setWrapperField("blind", false);
        else
            this.setWrapperField("blind", smallBlindSrc);
    }

    setBigBlindButton(visible) {
        if (this.missingBB) return;
        if (!visible)
            this.setWrapperField("blind", false);
        else
            this.setWrapperField("blind", bigBlindSrc);
    }

    setMissingBigBlindButton(visible) {
        this.missingBB = visible;
        // if(!visible)
        //     this.setWrapperField("blind", false);
        // else 
        //     this.setWrapperField("blind", missingBigBlindSrc);
        if (!visible)
            this.setWrapperField("missBb", false);
        else
            this.setWrapperField("missBb", true);
    }

    setMissingSmallBlindButton(visible) {
        this.missingSB = visible;
        // if(!visible)
        //     this.setWrapperField("extraToken", false);
        // else 
        //     this.setWrapperField("extraToken", missingSmallBlindSrc);

        if (!visible)
            this.setWrapperField("missSb", false);
        else
            this.setWrapperField("missSb", true);
    }

    setPlayerAvatar(avatar) {
        this.setWrapperField("avatar", avatar);
    }

    setTotalCardMask() {
        const playerCards = $(this.wrapper).find(".player-card");

        for (const card of playerCards) {
            card.classList.remove("with_mask")
        };

        for (const card of playerCards) {
            card.classList.add("with_mask")
        }
    }

    HighlightCards(cards) {
        const playerCards = $(this.wrapper).find(".player-card");

        if (!cards) {
            for (const card of playerCards) {
                if (card.attributes['value'].value != "?")
                    card.classList.remove("with_mask")
            };
            return;
        }

        for (const card of playerCards) {
            if (cards.indexOf(card.attributes['value'].value.toUpperCase()) == -1) {
                card.classList.add("with_mask")
            }
        }
    }

    showPlayer(visible) {
        if (this.isPlaying && visible) return;

        this.wrapper.innerHTML = playerWrapperHTML;
        this.wrapper.style.visibility = visible ? "visible" : "hidden";
    }

    clearPlayerAnimationCss() {
        const player_wrapper = this.wrapper;
        const lastBetDiv = player_wrapper.querySelector(".lastBetDiv");
        if (lastBetDiv)
            lastBetDiv.style = "";

    }

    showWaitForBBLabel(value) {
        this.setWrapperField("lastAction", value ? "Waiting For BB" : false);
    }

    showSitDownButton(visible) {
        if (visible && userMode !== 1) {
            this.wrapper.innerHTML = sitDownHTML;
            this.wrapper.style.visibility = "visible";
            $(this.wrapper).find(".sitDownButton")[0].addEventListener('click',
                () => {
                    sitDown(this.seatIndex);
                });
        } else {
            this.wrapper.innerHTML = playerWrapperHTML;
            this.wrapper.style.visibility = "hidden";
        }
    }

    setTurnTimer(timeout, timeToReact, timeBank) {

        this.resetPlayerWrapperClasses();
        if (this.turnCountInterval != undefined) { return; }

        var timeBanksound = false;
        const timeCircleCount = $(this.wrapper).find(".timeCircle div")[0];
        timeCircleCount.innerText = timeToReact;

        this.turnCountInterval = setInterval(() => {
            const timeCircleCount = $(this.wrapper).find(".timeCircle div")[0];
            if (timeToReact > 0) {
                timeCircleCount.innerText = --timeToReact;
            }

            // --timeToReact;

            if (timeToReact === 0) {
                if (timeBank >= 0) {
                    if (!timeBanksound) {
                        sound.playTurnTime(true);
                        timeBanksound = true;
                    }

                    timeCircleCount.innerText = timeBank--;
                } else if (timeBank == -1) {
                    this.clearIntervalTimer();
                }
            }
        }, 1000);

        $(this.wrapper).addClass("toPlay");
        const timeBar = $(this.wrapper).find(".turnTime div")[0];
        const clonedTimeBar = timeBar.cloneNode(true);
        timeBar.parentNode.replaceChild(clonedTimeBar, timeBar);
        clonedTimeBar.style.animationDuration = `${timeToReact}s`;
        clonedTimeBar.style.animationName = "timeReactRunOut";


        const timeCircle = $(this.wrapper).find(".timeCircle")[0];
        const clonedTimeCircle = timeCircle.cloneNode(true);
        timeCircle.parentNode.replaceChild(clonedTimeCircle, timeCircle);
        clonedTimeCircle.style.animationDuration = `${timeToReact}s`;
        clonedTimeCircle.style.animationName = "turnCircleReact";

        this.reactTimeOut = setTimeout(() => {
            clonedTimeBar.style.animationDuration = `${timeBank}s`;
            clonedTimeBar.style.animationName = "timeBankRunOut";
            clonedTimeCircle.style.animationDuration = `${timeBank + 1}s`;
            clonedTimeCircle.style.animationName = "turnCircleBank";

            if (this.reactTimeOut != undefined)
                clearTimeout(this.reactTimeOut);
        }, timeToReact * 1000);

    }

    clearTurnTimer() {
        sound.playTurnTime(false);
        this.clearIntervalTimer();
        this.resetPlayerWrapperClasses();
        $(this.wrapper).removeClass("toPlay");
        if (this.reactTimeOut != undefined)
            clearTimeout(this.reactTimeOut);
    }

    resetPlayerWrapperClasses() {
        $(this.wrapper).removeClass("toPlay");
        $(this.wrapper).removeClass("winner");
    }

    restartAnimation(element) {
        if (!element)
            return;
        element.style.animation = 'none';
        element.offsetHeight; /* trigger reflow */
        element.style.animation = null;
    }

    clearIntervalTimer() {
        if (this.turnCountInterval != undefined) {
            clearInterval(this.turnCountInterval);
            this.turnCountInterval = undefined;
        }
    }

    TipDealer(data) {
        const tostMessage = $(this.wrapper).find("#toastMessage")[0];
        const tostText = $(this.wrapper).find('#toastMessage .me-auto')[0];
        tostText.innerText = data.msg;
        tostMessage.style.display = 'block';

                    setTimeout(() => {
                        tostMessage.style.display = 'none';
                    }, 1500);
    }
}
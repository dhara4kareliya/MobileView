import { getPlayerSeat, sitDown, tableSettings } from "../services/table-server";
import { getMoneyValue, getMoneyText, round2, roundWithFormatAmount } from "./money-display";
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
    "ANTE": "#595959",
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
    <img src="./images/mobile/22 copy 7@2x.png" class="avatar">
    <div class="player-cards"></div>
    <div class="betAnimation">
        <img src="./images/mobile/1 copy 4-1@2x.png">
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
    <img src="./images/mobile/1 copy 4-1@2x.png">
    <span>{X} 55</span>
</div>
<img src="./images/mobile/WINNER.png" class="winnerImg">
<img class="dealer" src="./images/mobile/newdealer.png">
<img class="blind" src="./images/mobile/SB.png">
<img class="missSb" src="./images/mobile/newms.png">
<img class="missBb" src="./images/mobile/newmb.png">
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
//<img class = "extraToken" src="./images/mobile/MSB.png">
const sitDownHTML = "<button class=\"sitDownButton\"></button>";

const smallBlindSrc = "./images/mobile/newsb.png";
const bigBlindSrc = "./images/mobile/newbb.png";

const dealerSrc = "./images/D.png";

const missingSmallBlindSrc = "./images/mobile/MSB.png";
const missingBigBlindSrc = "./images/mobile/MBB.png";

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

function tipButtonClickHandler(event) {
    const TipAmount = event.target.getAttribute('value');
    ShowTipToDealer(round2(TipAmount), () => {
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
        this.isPlayerTurn = false;
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
        this.clearCards();
        this.cards = cards;

        let twoCardsClassName = "";
        let fourCardsClassName = "";

        if (cards.length == 2) twoCardsClassName = "two-cards";
        if (cards.length == 4 || cards.length == 5) fourCardsClassName = "four-cards";

        const isCardsOpen = this.cards.every(c => c !== '?');
        if (isCardsOpen)
            $(this.wrapper).find('.player-cards')[0].classList.add("isCardsOpen");

        console.log(cards.length)
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
            if(this.wrapper.classList.contains('isPlayer')){
                const logcards = $(`<img class="" src="${cardImgFilePath}" style="opacity:1;height: 40px;width: 25px;"/>`);
                $('.playerCards').find('.cards').append(logcards)
            }
        }
    }

    showCards(cards) {
        if (JSON.stringify(this.cards) === JSON.stringify(cards)) return;

        const playerCards = $(this.wrapper).find(".player-card");

        const isCardsOpen = cards.every(c => c !== '?');
        if (isCardsOpen)
            $(this.wrapper).find('.player-cards')[0].classList.add("isCardsOpen");

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
    checkPlayerCards() {
        const playerCards = $(this.wrapper).find(".player-card");
        if(playerCards.length > 0)
            return true;
        else 
            return false;
    }

    clearCards() {
        if(this.wrapper.classList.contains('isPlayer')){
          $('.playerCards').find('.cards').html('')
        }
        const playerCards = $(this.wrapper).find('.player-cards')[0];
        playerCards.innerHTML = '';
        playerCards.classList.remove("isCardsOpen");

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
        const amountText = tableSettings.mode == 'cash' ? getMoneyText(amount).outerHTML : roundWithFormatAmount(getMoneyValue(amount));
        let value = amount ? amountText : false;
        this.setWrapperField("money", value);
        this.showTipButtons(amount);
    }

    setPlayerBet(amount) {
        this.bet = amount;
        let value = false;

        if (amount) {
            value = tableSettings.mode == 'cash' ? getMoneyText(amount).outerHTML : roundWithFormatAmount(getMoneyValue(amount));
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
        //this.clearCards();
        this.setWrapperField("lastAction", "MUCKED");
    }

    removeMuckedFlag() {
        this.mucked = false;
        this.setWrapperField("lastAction", false);
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
            value = tableSettings.mode == 'cash' ? getMoneyText(amount).outerHTML : roundWithFormatAmount(getMoneyValue(amount));
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

    storeSitoutAndFoldCards(visible, cards) {
        $(this.wrapper).find('.avtar_img')[0].onclick = undefined;
        if (visible == true) {
            this.storedCards = cards;

            $(this.wrapper).find('.avtar_img')[0].onclick = () => {
                if ($(this.wrapper).find(".fold-cards").length !== 0) {
                    $(this.wrapper).find(".fold-cards").remove();
                } else {
                    this.showSitoutFoldCards(this.storedCards);
                }
            };
        } else {
            this.storedCards = [];
            if ($(this.wrapper).find(".fold-cards").length !== 0) {
                $(this.wrapper).find(".fold-cards").remove();
            }
        }
    }

    showSitoutFoldCards(cards) {
        if (cards == undefined) return;

        $(this.wrapper).append('<div class="fold-cards"></div>');
        let twoCardsClassName = "";
        let fourCardsClassName = "";

        if (cards.length == 2) twoCardsClassName = "two-cards";
        if (cards.length == 4 || cards.length == 5) fourCardsClassName = "four-cards";

        if (fourCardsClassName != "") {
            $(this.wrapper).find('.fold-cards').addClass(fourCardsClassName);
        }
        for (let i = 0; i < cards.length; ++i) {
            const card = cards[i].toLowerCase();
            const cardImgFilePath = getCardImageFilePath(card);
            const tableCard = `<div class="content ${twoCardsClassName}">
                                    <img src="${cardImgFilePath}"/>
                                </div>`;

            $(this.wrapper).find('.fold-cards').append(tableCard)
        }

    }

    setDealerButton(visible) {
        if (!visible)
            this.setWrapperField("dealer", false);
        else
            this.setWrapperField("dealer", true);
    }

     setSmallBlindButton(visible) {
    //     if (this.missingSB) return;
    //     if (!visible)
    //         this.setWrapperField("blind", false);
    //     else
    //         this.setWrapperField("blind", smallBlindSrc);
     }

     setBigBlindButton(visible) {
    //     if (this.missingBB) return;
    //     if (!visible)
    //         this.setWrapperField("blind", false);
    //     else
    //         this.setWrapperField("blind", bigBlindSrc);
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

    setIsPlayer(visible) {
        if (visible == true)
            this.wrapper.classList.add("isPlayer");
        else
            this.wrapper.classList.remove("isPlayer");
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

    setTurnTimer(timeout, timeToReact, timeBank, isRootPlayer) {
        const totalInitialTime = timeToReact + timeBank;
        const elapsedTime = totalInitialTime - timeout;
    
        let remainingReactTime = Math.floor(timeToReact - elapsedTime);
        if (remainingReactTime < 0) remainingReactTime = 0;

        let remainingBankTime = Math.floor(timeBank);
        let elapsedBankTime = 0;
        if (remainingReactTime === 0) {
            elapsedBankTime = Math.floor(timeBank - timeout);
            remainingBankTime = Math.floor(timeout);
            if (remainingBankTime < 0) remainingBankTime = 0;
        }
        const timeCircleCount = $(this.wrapper).find(".timeCircle div")[0];
        timeCircleCount.innerText = remainingReactTime || remainingBankTime;

        this.resetPlayerWrapperClasses();
        if (this.turnCountInterval != undefined) { return; }

        var timeBanksound = false;
        this.isPlayerTurn = true;
        
        const timeCircle = $(this.wrapper).find(".timeCircle")[0];
        const clonedTimeCircle = timeCircle.cloneNode(true);
        

        $(this.wrapper).find(".tangoHeadBlack").addClass("active-turn");
        this.turnCountInterval = setInterval(() => {
            const timeCircleCount = $(this.wrapper).find(".timeCircle div")[0];
            if (remainingReactTime > 0) {
                timeCircleCount.innerText = --remainingReactTime;
            }

            // --timeToReact;

            if (remainingReactTime === 0) {
                if (remainingBankTime >= 0) {
                    clonedTimeBar.style.animationDuration = `${remainingBankTime}s`;
                    clonedTimeBar.style.animationName = "timeBankRunOut";
                    // clonedTimeCircle.style.animationDuration = `${timeBank + 1}s`;
                    clonedTimeCircle.style.animationName = "turnCircleBank";
                    if (!timeBanksound && isRootPlayer) {
                        sound.playTurnTime(true);
                        timeBanksound = true;
                    }

                    timeCircleCount.innerText = remainingBankTime--;

                    if (remainingBankTime < 3 && remainingBankTime > 0) {
                        $(this.wrapper).find(".tangoHeadBlack").addClass("blink");
                    }
                } else if (remainingBankTime == 0) {
                    this.clearIntervalTimer();
                }
            }
        }, 1000);

        $(this.wrapper).addClass("toPlay");
        const timeBar = $(this.wrapper).find(".turnTime div")[0];
        const clonedTimeBar = timeBar.cloneNode(true);
        timeBar.parentNode.replaceChild(clonedTimeBar, timeBar);
        clonedTimeBar.style.animationDuration = `${remainingReactTime}s`;
        clonedTimeBar.style.animationName = "timeReactRunOut";


        timeCircle.parentNode.replaceChild(clonedTimeCircle, timeCircle);
        clonedTimeCircle.style.animationDuration = `${remainingReactTime}s`;
        clonedTimeCircle.style.animationName = "turnCircleReact";

        this.reactTimeOut = setTimeout(() => {
            clonedTimeBar.style.animationDuration = `${remainingBankTime}s`;
            clonedTimeBar.style.animationName = "timeBankRunOut";
            // clonedTimeCircle.style.animationDuration = `${timeBank + 1}s`;
            // clonedTimeCircle.style.animationName = "turnCircleBank";

            if (this.reactTimeOut != undefined)
                clearTimeout(this.reactTimeOut);
        }, remainingReactTime * 1000);

    }

    clearTurnTimer() {
        $(this.wrapper).find(".tangoHeadBlack").removeClass("blink");
        $(this.wrapper).find(".tangoHeadBlack").removeClass("active-turn");
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
        this.isPlayerTurn = false;
        if (this.turnCountInterval != undefined) {
            clearInterval(this.turnCountInterval);
            this.turnCountInterval = undefined;
        }
    }

    showTipButtons(amount) {
        if (!this.wrapper.classList.contains('isPlayer'))
            return false;

        const elements = $("#tip-button button");
        const bigBlind = tableSettings.bigBlind;
        for (const element of elements) {
            const tipValue = element.attributes['value'].value;
            element.disabled = (!amount || this.isPlayerTurn || amount < (tipValue * bigBlind));
        }
    }

    showTipDealer(value){
        if (!this.wrapper.classList.contains('isPlayer'))
            return false;

        const elements = $("#tip-button")[0];      
        elements.style.visibility = value ? 'visible' : 'hidden';
    }

    setTipMessage(data) {
        const tostMessage = $(this.wrapper).find("#toastMessage")[0];
        const tostText = $(this.wrapper).find('#toastMessage .me-auto')[0];
        tostText.innerText = data.msg;
        tostMessage.style.display = 'block';

        if (data.money !== undefined && data.seat === getPlayerSeat())
            this.setPlayerMoney(data.money);

        setTimeout(() => {
            tostMessage.style.display = 'none';
        }, 1500);
    }
}
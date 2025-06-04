import { turnAction } from "../services/table-server";
import { toggleCheckbox } from "./checkbox";
import { setSliderMax, setSliderMin, setSliderValue } from "./slider";
import { getMoneyText, getMoneyValue, getMoneyOriginalValue, round2, roundWithFormatAmount } from "./money-display";

const foldButton = $("#fold-button")[0];
const callButton = $("#call-button")[0];
const raiseButton = $("#raise-Button")[0];
const actionUIDiv = $("#turnActionsDiv")[0];
//const sidebetUIDiv = $(".button-section")[0];
const betSlider = $("#betSlider")[0];
const betInput = $("#betDivWrapper input")[0];
const betDivWrapper = $("#betDivWrapper")[0];
const betAmountDiv = $("#betAmountDiv")[0];
const betAmount = $(".betAmount")[0];
const allInButton = $("#allInButton")[0];
const bet70 = $("#bet70")[0];
const bet50 = $("#bet50")[0];
const bet33 = $("#bet33")[0];
const minusButton = $("#betMinus")[0];
const plusButton = $("#betPlus")[0];
const callButton1 = $(".callButtonDiv")[0];
const foldToAnyBetButtonDiv = $(".foldToAnyBetButton")[0];
const raiseButtonSpan = $("#raise-Button .valueDisplay")[0];
const raiseButtonLebel = $("#raise-Button .raise_text")[0];
const autoModeCheckbox = $(".autoModeButton .checkbox")[0];
const automaticActionsDiv = $("#automaticActionsDiv")[0];
const betButtons = $(".betAmount div");

export class ActionUI {
    constructor() {
        foldButton.addEventListener('click', () => this.fold());
        callButton.addEventListener('click', () => this.checkOrCall());
        raiseButton.addEventListener('click', () => this.raise());
        allInButton.addEventListener('click', () => this.setRaise(this.m_MaxRaise));
        bet70.addEventListener('click', () => this.setRaise(Math.floor(this.m_POT * 2 / 3 * 100) / 100));
        bet50.addEventListener('click', () => this.setRaise(Math.floor(this.m_POT * 1 / 2 * 100) / 100));
        bet33.addEventListener('click', () => this.setRaise(Math.floor(this.m_POT * 1 / 3 * 100) / 100));
        plusButton.addEventListener('click', () => this.setRaise(this.m_Raise + this.m_Increment));
        minusButton.addEventListener('click', () => this.setRaise(this.m_Raise - this.m_Increment));
        for (const button of betButtons) {
            button.addEventListener('click', () => {
                const buttonValue = button.querySelector("span").innerText;
                this.setRaise(buttonValue * this.m_bigBlind);
                betButtons.removeClass("active");
                button.classList.add("active");
            })
        }
        betInput.addEventListener('change', (e) => {
            let value = Math.floor(getMoneyOriginalValue(parseFloat(e.target.value)) * 100) / 100;
            // value = this.m_showInBB ? value * this.m_bigBlind : value;
            // value = this.m_showInUSD ? value * this.m_usdRate : value;
            this.setRaise(value);
        });
        betInput.addEventListener('click', (e) => {
            betInput.value = '';
        })
        betInput.addEventListener('input', (e) => {
            const value = Math.floor(getMoneyOriginalValue(parseFloat(e.target.value)) * 100) / 100;
            
            if (value == this.getValidAmount(value)){
                raiseButtonLebel.style.display = (value == this.m_MaxRaise) ? 'none' : 'block';
                const amountText = getMoneyText(value + this.m_CurrentBet);
                raiseButtonSpan.innerHTML = (value == this.m_MaxRaise) ? 'ALL IN' : $(raiseButtonSpan).hasClass("moneyDisplay") ? amountText.outerHTML : getMoneyValue(value + this.m_CurrentBet);
            }
        });

        this.showActionUI(false);

        this.m_Call = 0.0;
        this.m_Raise = 0.0;
        this.m_MinRaise = 0.0;
        this.m_MaxRaise = 0.0;
        this.m_POT = 0.0;
        this.m_Increment = 0.0;
        this.m_CurrentBet = 0.0;
        this.m_showInBB = false;
        this.m_showInUSD = false;
        this.m_bigBlind = undefined;
        this.m_usdRate = undefined;
    }

    setShowInBB(value) {
        this.m_showInBB = value;
        this.setRaise(this.m_Raise);
    }

    setShowInUSD(value) {
        this.m_showInUSD = value;
        this.setRaise(this.m_Raise);
    }

    setBigBlind(bb) {
        this.m_bigBlind = bb;
    }

    setUsdRate(usd) {
        this.m_usdRate = usd;
    }

    setActive(element, value) {
        element.style.visibility = (value == false) ? "hidden" : "visible";
    }

    setDisplay(element, value) {
        element.style.display = (value == false) ? "none" : "block";
    }
    setRaiseLebel(value){
        if(value)
            raiseButtonLebel.innerText = 'RAISE';
        else 
            raiseButtonLebel.innerText = 'BET';

    }
    setRaise(amount) {
        raiseButtonSpan.innerText = (amount >= this.m_MaxRaise) ? 'ALL IN' : '';
        raiseButtonLebel.style.display = (amount >= this.m_MaxRaise) ? 'none' : 'block';
        var condition = (amount >= this.m_MaxRaise) ? true : false;
        this.m_Raise = this.getValidAmount(amount);
        betInput.value = (amount >= this.m_MaxRaise) ? getMoneyValue(amount) : getMoneyValue(this.m_Raise + this.m_CurrentBet);
        setSliderValue(betSlider, this.m_Raise + this.m_CurrentBet, condition);
    }
    showBetButton(value) {
        this.setActive(betAmount, !value);
    }
    getValidAmount(amount) {
        return amount > this.m_MaxRaise ? amount = this.m_MaxRaise : amount < this.m_MinRaise ? amount = this.m_MinRaise : amount;
    }

    allIn() {
        this.setActive(automaticActionsDiv, false);
        this.showActionUI(false);
        // this.showSidebetUI(false);
        this.setRaise(this.m_MaxRaise);
        this.setActive(foldToAnyBetButtonDiv, false);
        this.setActive(callButton1, false);
    }

    fold() {
        this.setActive(automaticActionsDiv, false);
        this.setActive(actionUIDiv, false);
        this.showActionUI(false);
        this.setActive(foldToAnyBetButtonDiv, false);
        this.setActive(callButton1, false);
        // this.showSidebetUI(false);
        turnAction("fold");
    }

    call() {
        this.setActive(automaticActionsDiv, false);
        this.showActionUI(false);
        this.setActive(foldToAnyBetButtonDiv, false);
        this.setActive(callButton1, false);
        // this.showSidebetUI(false);
        turnAction("bet", this.m_Call);
    }

    check() {
        this.setActive(automaticActionsDiv, false);
        this.showActionUI(false);
        this.setActive(foldToAnyBetButtonDiv, false);
        this.setActive(callButton1, false);
        // this.showSidebetUI(false);
        turnAction("bet", 0);
    }

    checkOrCall() {
        this.showActionUI(false);
        // this.showSidebetUI(false);
        if (this.m_Call == 0)
            this.check();
        else
            this.call();
    }

    raise() {
        this.showActionUI(false);
        // this.showSidebetUI(false);
        // turnAction("bet", this.m_Raise);
        // console.error(`betInput.value : ${betInput.value},getMoneyOriginalValue : ${getMoneyOriginalValue(parseFloat(betInput.value))},m_CurrentBet : ${this.m_CurrentBet} = ${getMoneyOriginalValue(parseFloat(betInput.value)) - this.m_CurrentBet}`);

         const bet = Math.min(Math.max(getMoneyOriginalValue(parseFloat(betInput.value)), this.m_MinRaise), this.m_MaxRaise);
        turnAction("bet", bet)
    }

    showActionUI(value) {
        this.setActive(actionUIDiv, value);
        this.setActive(betDivWrapper, value);
        this.setDisplay(betAmountDiv, value);
        this.setActive(raiseButton, value);

        turnActionsDiv.querySelector(".bottom_buttons_Wrapper").style.zIndex = (value) ? 100 : 'unset';

        if (value) {
            this.setActive(automaticActionsDiv, false);
            this.setActive(foldToAnyBetButtonDiv, false);
            this.setActive(callButton1, false);
            // this.showSidebetUI(false);
        }

        if (value && autoModeCheckbox.checked) {
            setTimeout(() => {
                this.doAutoAction();
            }, 1000);
        }
    }

    /* showSidebetUI(value) {
        this.setActive(sidebetUIDiv, value);
    } */


    showCall(call, currentChips,mode) {
        this.m_Call = call;

        if (call == 0) {
            callButton.innerHTML = "CHECK";
        } else {
            const callText = mode == 'cash' ? getMoneyText(call).outerHTML : roundWithFormatAmount(getMoneyValue(call));
            callButton.innerHTML = `CALL ${callText}`;

            if (call >= currentChips) {
                this.hideRaise();
                const callText = mode == 'cash' ? getMoneyText(call).outerHTML : roundWithFormatAmount(getMoneyValue(call));
                callButton.innerHTML = `CALL ${callText}`;
            }
        }
    }

    showRaise(minRaise, maxRaise, pot, increment, currentBet, mode) {
        if (minRaise !== maxRaise){
            this.setActive(betDivWrapper, true);
            this.setDisplay(betAmountDiv, true);
        }
        else{
            this.setDisplay(betAmountDiv, false);
            this.setActive(betDivWrapper, false);
        }
        this.setActive(raiseButton, true);
        this.m_MinRaise = minRaise;
        this.m_MaxRaise = maxRaise;
        this.m_POT = pot;
        this.m_Increment = increment;
        this.m_CurrentBet = currentBet;
        mode === 'cash' ? !$(raiseButtonSpan).hasClass('moneyDisplay') && $(raiseButtonSpan).addClass('moneyDisplay') : $(raiseButtonSpan).removeClass('moneyDisplay');

        setSliderMin(betSlider, round2(minRaise + currentBet));
        setSliderMax(betSlider, round2(maxRaise + currentBet));
        setSliderValue(betSlider, round2(minRaise + currentBet));
        this.m_Raise = minRaise;

        raiseButtonLebel.style.display = 'block';
        if (this.m_MaxRaise == this.m_POT) {
            allInButton.innerText = "POT"
            raiseButtonLebel.style.display = 'none';
        }
    }

    hideRaise() {
        this.setActive(betDivWrapper, false);
        this.setDisplay(betAmountDiv, false);
        this.setActive(raiseButton, false);
    }

    doAutoAction() {
        const random = Math.floor(Math.random() * 10);

        if (random < 2) {
            this.fold();
        } else if (random < 7 && raiseButton.style.visibility == "visible") {
            betInput.value = Math.floor(Math.random() * (this.m_MaxRaise - this.m_MinRaise)) + this.m_MinRaise;
            this.raise();
        } else {
            this.checkOrCall();
        }
    }
}
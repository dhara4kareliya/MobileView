import { playerBuyChips, playerTransfer } from "../socket-client";
import { setSliderMax, setSliderMin, setSliderValue } from "./slider";
import { getPlayerSeat, myTotalMoneyInGame } from '../services/table-server';
import { tableSettings, myInfo, myMoneyInGame } from "../services/table-server";
import { toggleCheckbox } from "./checkbox";
import { getRoundValue, getMoneyText, getMoneyValue, getMoneyOriginalValue } from "./money-display";

const buyInButton = $("#buyInButton")[0];
const buyInRange = $("#buyInRange")[0];

const buyInSlider = $("#buyInSlider")[0];
const buyInConfirm = $("#buyInMenu .okButton")[0];
const buyInCancel = $("#buyInMenu .cancleButton")[0];
const buyInMinus = $("#buyInMinus")[0];
const buyInPlus = $("#buyInPlus")[0];
const buyInMinSpan = $("#buyInMinus span")[0];
const buyInMaxSpan = $("#buyInPlus span")[0];
const buyInInput = $("#buyInCount")[0];
const chipsLowerThenBuyInCheckbox = $("#chipsLowerThenBuyInCheckbox")[0];
const runOutOfChipsCheckbox = $("#runOutOfChipsCheckbox")[0];
const buyInMenu = $("#buyInMenu")[0];
const tableBalanceSpan = $('#table-balance')[0];
const tableChipSpan = $('#table-chip')[0];
const globalBalanceSpan = $('#global-balance')[0];
const transferSlider = $("#transferSlider")[0];
const transferMinus = $("#transferMinus")[0];
const transferPlus = $("#transferPlus")[0];
const transferMinSpan = $("#transferMinus span")[0];
const transferMaxSpan = $("#transferPlus span")[0];
const transferInput = $("#transferCount")[0];
const transferConfirm = $("#buyInMenu .transferButton")[0];
const transferLoader = $(".transferWaitingClock")[0];

export class BuyInUI {
    constructor() {

        this.minBuyIn = 0;
        this.maxBuyIn = 0;
        this.minTransfer = 0;
        this.maxTransfer = 0;
        this.bb = 0;
        this.sb = 0;
        this.currentTableMoney = 0;
        this.currentBuyInAmount = 0;
        this.currentTransferAmount = 0;
        this.tableWalletBalance = 0;
        this.globalBalance = 0;
        this.autoTopUpLess = false;
        this.autoTopUpZero = false;
        this.visible = false;

        this.updateBalancesAfterTransfer = (updatedGlobalBalance, updatedTableBalance) => {
            transferLoader.style.visibility = 'hidden';
            this.setBalances(updatedGlobalBalance, updatedTableBalance)

            transferMaxSpan.innerText = getRoundValue(updatedGlobalBalance);
            this.maxTransfer = getRoundValue(updatedGlobalBalance);
        }

        buyInConfirm.addEventListener('click', () => {
            this.visible = false;
            if (this.currentBuyInAmount - this.currentTableMoney <= 0)
                return;

            this.setBuyInValidValue(getMoneyOriginalValue(parseInt(buyInInput.value)).toFixed(2));

            playerBuyChips(this.currentBuyInAmount - this.currentTableMoney, this.autoTopUpLess, this.autoTopUpZero);
        });

        buyInCancel.addEventListener('click', () => {
            this.visible = false;
            if (this.currentTableMoney < this.minBuyIn)
                playerBuyChips(0);
        });

        buyInMinus.addEventListener('click', () => {
            this.setBuyInValidValue(this.currentBuyInAmount - this.bb);
        });

        buyInPlus.addEventListener('click', () => {
            this.setBuyInValidValue(this.currentBuyInAmount + this.bb);
        });

        buyInInput.addEventListener('change', () => {
            this.setBuyInValidValue(getMoneyOriginalValue(parseInt(buyInInput.value).toFixed(2)));
        });

        buyInSlider.addEventListener('change', () => {
            this.setBuyInValidValue(parseInt(buyInSlider.value).toFixed(2));
        });

        transferConfirm.addEventListener('click', () => {
            if (this.currentTransferAmount - this.globalBalance >= 0)
                return;

            this.setTransferValidValue(getMoneyOriginalValue(parseInt(transferInput.value)).toFixed(2));

            transferLoader.style.visibility = 'visible';
            playerTransfer(this.currentTransferAmount, this.updateBalancesAfterTransfer);
        });

        transferMinus.addEventListener('click', () => {
            this.setTransferValidValue(this.currentTransferAmount - this.bb);
        });

        transferPlus.addEventListener('click', () => {
            this.setTransferValidValue(this.currentTransferAmount + this.bb);
        });

        transferInput.addEventListener('change', () => {
            this.setTransferValidValue(getMoneyOriginalValue(parseInt(transferInput.value)).toFixed(2));
        });

        transferSlider.addEventListener('change', () => {
            this.setTransferValidValue(parseInt(transferSlider.value).toFixed(2));
        });

        chipsLowerThenBuyInCheckbox.addEventListener('change', () => {
            this.autoTopUpLess = chipsLowerThenBuyInCheckbox.checked;
            if (this.autoTopUpZero && this.autoTopUpLess) {
                this.autoTopUpZero = !this.autoTopUpLess;
                toggleCheckbox(runOutOfChipsCheckbox, this.autoTopUpZero);
            }
        });

        runOutOfChipsCheckbox.addEventListener('change', () => {
            this.autoTopUpZero = runOutOfChipsCheckbox.checked;
            if (this.autoTopUpZero && this.autoTopUpLess) {
                this.autoTopUpLess = !this.autoTopUpZero;
                toggleCheckbox(chipsLowerThenBuyInCheckbox, this.autoTopUpLess);
            }
        });
    }

    // updateBalancesAfterTransfer(transferedAmount, updatedGlobalBalance) {
    //   tableBalanceSpan.innerText = transferedAmount;
    //   globalBalanceSpan.innerText = updatedGlobalBalance;
    // }

    checkConfirmValid() {
        if (this.currentTableMoney >= this.maxBuyIn || this.tableWalletBalance < this.minBuyIn) {
            buyInConfirm.disabled = true;
            return false
        }

        buyInConfirm.disabled = false;
        return true;
    }

    setBalances(globalBalance, tableBalance) {
        const tableBalanceText = getMoneyText(tableBalance);
        tableBalanceSpan.innerHTML = tableBalanceText.outerHTML;
        this.tableWalletBalance = tableBalance;
        const globalBalanceText = getMoneyText(globalBalance);
        globalBalanceSpan.innerHTML = globalBalanceText.outerHTML;
        this.globalBalance = globalBalance;

        this.checkConfirmValid();
    }

    setBuyInValidValue(value) {
        let tmpValue = value;

        tmpValue = Math.max(tmpValue, this.minBuyIn);
        tmpValue = Math.min(tmpValue, this.maxBuyIn, this.tableWalletBalance);

        tmpValue = Math.max(tmpValue, this.currentTableMoney == 0 ? this.minBuyIn : this.currentTableMoney);

        this.currentBuyInAmount = tmpValue;
        buyInInput.value = getMoneyValue(tmpValue);
        setSliderValue(buyInSlider, tmpValue);
    }

    setTransferValidValue(value) {
        let tmpValue = value;

        tmpValue = Math.max(tmpValue, this.minTransfer);
        tmpValue = Math.min(tmpValue, this.maxTransfer);

        this.currentTransferAmount = tmpValue;
        transferInput.value = getMoneyValue(tmpValue);
        setSliderValue(transferSlider, tmpValue);
    }

    setBlinds(sb, bb) {
        this.bb = bb;
        this.sb = sb;
    }

    setBuyInRange(minBuyIn, maxBuyIn) {
        setSliderMin(buyInSlider, minBuyIn);
        setSliderMax(buyInSlider, maxBuyIn);
        //    setSliderValue(buyInSlider, minBuyIn);
        buyInMinSpan.innerText = getMoneyValue(minBuyIn);
        buyInMaxSpan.innerText = getMoneyValue(maxBuyIn);
        buyInInput.value = getMoneyValue(minBuyIn);
        this.maxBuyIn = maxBuyIn;
        this.minBuyIn = minBuyIn;
        this.setBuyInValidValue(minBuyIn);
    }

    setTransferRange(minTransfer, maxTransfer) {
        setSliderMin(transferSlider, minTransfer);
        setSliderMax(transferSlider, maxTransfer);
        setSliderValue(transferSlider, minTransfer);
        transferMinSpan.innerText = getMoneyValue(minTransfer);
        transferMaxSpan.innerText = getMoneyValue(maxTransfer);
        transferInput.value = getMoneyValue(minTransfer);
        this.maxTransfer = maxTransfer;
        this.minTransfer = minTransfer;
    }

    setTableChips(money) {
        this.currentTableMoney = money != undefined ? money : 0;

        if (!this.checkConfirmValid()) return;

        setSliderValue(buyInSlider, Math.max(this.currentTableMoney, this.minBuyIn));
        buyInInput.value = getMoneyValue(Math.max(this.currentTableMoney, this.minBuyIn));
        const tableChipText = getMoneyText(this.currentTableMoney);
        tableChipSpan.innerHTML = tableChipText.outerHTML;
    }

    showBuyIn(visible) {
        this.visible = visible;
        buyInMenu.style.visibility = (visible == false) ? "hidden" : "visible";
        // transferLoader.style.visibility = 'hidden';
        toggleCheckbox(chipsLowerThenBuyInCheckbox, this.autoTopUpLess);
        toggleCheckbox(runOutOfChipsCheckbox, this.autoTopUpZero);
    }

    setBuyInPanelInfo(minBuyIn) {
        this.setBlinds(tableSettings.smallBlind, tableSettings.bigBlind);
        this.setBuyInRange(minBuyIn, tableSettings.maxBuyIn);
        this.setTransferRange(minBuyIn, getRoundValue(myInfo.globalBalance));
        this.setTableChips(myTotalMoneyInGame());
        this.setBalances(getRoundValue(myInfo.globalBalance), getRoundValue(myInfo.tableBalance));
    }
}
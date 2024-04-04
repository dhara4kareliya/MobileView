import { showCards, sitIn, sitOut, playerLeaveTable, sitOutNextHand, tableSettings, tableSubscribe, waitForBB, doChat, acceptInsurance, round } from "../services/table-server";
import { ShowTipToDealer, disConnectSocket, playerLeave, submitSideBet, updatePlayerInfo } from "../socket-client";
import { toggleCheckbox } from "./checkbox";
import { getPlayerSeat, getCurrentTurn, turnAction, joinWaitingList } from '../services/table-server';
import { showBuyIn } from './game-ui';
import { userMode, userToken } from '../services/game-server';
import { getMoneyText } from "./money-display";
import { getPlayerCardHandGroup } from "./card-ui";

const tableSettingSpanDiv = $(".tableSettingsSpan")[0];
const tableNameDiv = $(".tableName")[0];

const actionUIDiv = $("#turnActionsDiv")[0];
const sidebetUIDiv = $(".button-section")[0];
const sidebetUIWrapper = $(".wrapper")[0];
const automaticActionsDiv = $("#automaticActionsDiv")[0];
const autoCheckCheckbox = $("#autoCheckButton .checkbox")[0];
const autoCheckOrFoldCheckbox = $("#autoCheckOrFoldButton .checkbox")[0];
const autoFoldCheckboxes = $(".autoFoldButton .checkbox");
const autoFoldButtons = $(".autoFoldButton");
const waitForBBButtons = $(".waitForBBButton");
const waitForBBCheckboxes = $(".waitForBBButton .checkbox");
const sitOutNextHandButtons = $(".sitOutNextHandButton")[0];
const sitOutNextHandCheckboxes = $(".sitOutNextHandButton .checkbox")[0];
const smallBlindSpan = $(".smallBlind")[0];
const bigBlindSpan = $(".bigBlind")[0];
const anteSpan = $(".ante")[0];
const levelSpan = $(".level")[0];
const nextSbBb = $(".nextSBBB")[0];
const levelTimer = $(".tournamentOnly .timer")[0];
const breakCountdownDiv = $("#breakTime")[0];
const sitInBtn = $("#backButton")[0];
const showCardBtn = $("#showCardsButton")[0];
const menuBottomButtons = $(".menuBottomButtons button");
const addChipsButtons = $(".addChipsButton");
const settingsButtons = $(".settingsButton")[0];
const buyInMenu = $("#buyInMenu")[0];
const settingsMenu = $("#settingsMenu")[0];
const sitOutButtons = $(".sitOutButton");
const leaveButtons = $(".leaveButton");
const backLobbyButtons = $(".backLobbyButton");
const uiTables = $("#uiTable")[0];
const closeUiTable = $(".closeUiTable")[0];
const CloseModal = $(".close, #GO");
const tournamentDivs = $(".tournamentOnly");
const meDiv = $("#meDiv")[0];
const tropyDivs = $(".trophyDiv");
const tropySpans = $(".trophyDiv span");
const openMenuButton = $("#openMenuButton")[0];
//const mobileSideBar = $("#mobileSideBar")[0];
const handResultDiv = $(".handResult")[0];
const waitListDiv = $(".waitingList")[0];
const joinWaitingButton = $(".waitingList button")[0];
const waitListCount = $(".waitingListSide ")[0];
const waitList = $(".users")[0];
const waitListDropdown = $("#usersDropdown")[0];
const waitListArrow = $("#arrow")[0]
const logDiv = $('.log_data1')[0];
// const addTipsButtons = $(".addTipsButton")[0];
// const TipsOptions = $("#tip-button button");
const tipButtonDiv = $("#tip-button")[0]
const chatDiv = $('#divmessage1 .userMessage')[0];
const chatInput = $('.chatButton2 .input_div1 input')[0];
const chatSendIcon = $('.chatButton2 .input_div1 > i')[0];
const chatButton = $('.chatButton2')[0];
const logButton = $('.logTabButton')[0];
const multiTableButtons = $(".multiTableButton");
const dropdownMenus = $(".dropdown-menu");
const chatButtons = $(".chatButtons1");
const btnCloses = $(".btn-closes");
const preChatMsgOrEmoji = $('.preChatEmoji,.preChatMsg');
const insuranceYesButton = $(".insuranceYesButton")[0];
const insuranceNextTime = $(".insuranceNextTime")[0];
const insurancePrice = $(".insurancePrice")[0];
const allInPrice = $(".allInPrice1");
const autoFoldModeButtonDiv = $(".autoFoldModeButton1")[0];
const submitButton = $('#submit-sidebet1')[0];
const submitButton2 = $('#submit-sidebet-2.s-sec');
const submitButton4 = $('.sidebet');
const submitButton3 = $('.round_button_2');
const streetsOnSideBet = new Map();
streetsOnSideBet.set('PreCards', 'Next Cards');
streetsOnSideBet.set('PreFlop', 'Flop');
streetsOnSideBet.set('Flop', 'Turn');
streetsOnSideBet.set('Turn', 'River');
const AutoTip = $(".AutoTip")[0];

export class MainUI {
    constructor(buyInUI) {
        this.playerInfo = {
            name: "Guest",
            seat: 0
        };

        this.levelInfo = {
            level: 0,
            duration: 0,
            nextSB: 0,
            nextBB: 0,
            ante: 0
        };

        this.tableInfo = {
            name: "Table",
            mode: "cash",
            smallBlind: 0,
            bigBlind: 0
        };

        this.buyInUI = buyInUI;
        this.prevLevel = 0;
        this.breakDuration = 60;
        this.interval = undefined;
        this.lvlInterval = undefined;
        this.optionFoldToAnyBet = false;
        this.optionActionAutoCheck = false;
        this.optionActionAutoCheckOrFold = false;
        this.isTurn = false;
        this.isPlaying = false;
        this.insuranceAmount = 0;
        this.insuranceWinAmount = 0;
        this.playerAutoFoldCards = [];
        // this.showAutoCheckOrFold = false;
        this.init();
    }

    init() {
        breakCountdownDiv.style.visibility = "hidden";
        this.setActive(automaticActionsDiv, false);
        this.setActive(sidebetUIDiv, false);
        this.setActive(sidebetUIWrapper, false);
        this.setActiveElements1(leaveButtons, false);
        this.setActiveElements1(backLobbyButtons, true);
        this.setActive(sitInBtn, false);
        this.setActiveElements(tournamentDivs, false);
        this.setActive(tableNameDiv, false);
        this.setActive(tableSettingSpanDiv, false);
        this.setActive(meDiv, false);
        this.setActive($(meDiv).find(".stars")[0], false);
        this.setActive(handResultDiv, false);
        this.setActive(uiTables, false);
        this.setActive(settingsMenu, false);
        this.setActive1(waitListDropdown, false);
        this.setActive1(AutoTip, false);
        // this.setActive(addTipsButtons, false);
        this.setActive1(autoFoldModeButtonDiv, false);

        sitInBtn.addEventListener('click', () => {
            this.onSitInClick();
        });
        for (const button of sitOutButtons)
            button.addEventListener('click', () => { if (this.isTurn) this.onSitOutClick(); });
        showCardBtn.addEventListener('click', () => {
            this.onShowCardClick();
        });

        for (const tropyDiv of tropyDivs)
            this.setActive(tropyDiv, false);

        for (const button of leaveButtons)
            button.addEventListener('click', () => { playerLeaveTable(); });

        for (const button of backLobbyButtons)
            button.addEventListener('click', playerLeave);

            openMenuButton.addEventListener('click',()=>{ this.setActive(uiTables, true);
                $("#uiTable .modal").css("display", "block");})

            closeUiTable.addEventListener('click',()=>{ this.setActive(uiTables, false);
                $("#uiTable .modal").css("display", "none");})

                for (const button of CloseModal)
                button.addEventListener('click', () => {
                    $('#shareHandMessage').modal('hide');
                    // $('#TipToDealer').modal('hide');
                    $('#SubmitReport').modal('hide');
                });

        for (const button of dropdownMenus)
            button.addEventListener('click', (e) => { if (button.classList.contains("show")) { e.stopPropagation(); } });

        for (const button of btnCloses)
            button.addEventListener('click', (e) => { button.closest('.dropdown-menu').classList.remove("show"); });

        for (const button of chatButtons) {
            button.addEventListener('click', () => {

                $(".chatButtons1").removeClass("active");
                $(".blocks").css("display", "none");
                $(".chatButtons1").find('i').css("color", '#9499a6');
                button.querySelector('i').style.color = 'white';
                const div = button.getAttribute('data-divshow');
                document.querySelector("#" + div + "1").style.display = "block";
                button.classList.add('active');
            });
        }

        for (const button of preChatMsgOrEmoji) {
            button.addEventListener('click', (e) => {
                doChat({ msg: e.target.innerText });
            });
        }

        for (const button of menuBottomButtons) {
            button.addEventListener('click', this.closeMenu);
        }

        for (const button of addChipsButtons) {
            button.addEventListener('click', () => {
                updatePlayerInfo(() => {
                    this.buyInUI.showBuyIn(true);
                    this.buyInUI.setBuyInPanelInfo(1);
                }, 100);
            });
        }

            settingsButtons.addEventListener('click', () => {
                this.setActive(settingsMenu, true);
            });

        waitListCount.addEventListener('click', ()=>{
            if(waitListDropdown.style.display == "block"){
            this.setActive1(waitListDropdown, false)
        } else {
        this.setActive1(waitListDropdown, true)}


    })

        for (const waitForBBCheckbox of waitForBBCheckboxes) {
            waitForBBCheckbox.addEventListener('change', () => { waitForBB(waitForBBCheckbox.checked) });
        }
            sitOutNextHandCheckboxes.addEventListener('click', () => { 
                sitOutNextHand(sitOutNextHandCheckboxes.checked); 
                console.log(sitOutNextHandCheckboxes.checked);
            });

        for (const autoFoldCheckbox of autoFoldCheckboxes) {
            autoFoldCheckbox.addEventListener('click', () => {
                this.onOptionFoldToAnyBet(autoFoldCheckbox.checked);
            });
        }
        
        chatSendIcon.addEventListener('click', () => {
            if (chatInput.value) {
                doChat({ msg: chatInput.value });
                chatInput.value = "";
            }
        });

        chatInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter' || e.keyCode === 13) {
                doChat({ msg: e.target.value });
                e.target.value = "";
            }
        });

        autoCheckCheckbox.addEventListener('change', () => {
            this.onOptionActionAutoCheck(autoCheckCheckbox.checked);
        });

        autoCheckOrFoldCheckbox.addEventListener('change', () => {
            this.onOptionActionAutoCheckOrFold(autoCheckOrFoldCheckbox.checked);
        });
        // for (const button of TipsOptions) {
        //     button.addEventListener('click', () => {
        //         const TipAmount = button.attributes['value'].value;
        //         this.setActive(tipButtonDiv, false);
        //         ShowTipToDealer(TipAmount, () => {
        //             $('#TipToDealer').modal('show');
        //         });
        //     })
        // }

        insuranceYesButton.addEventListener('click', () => {
            acceptInsurance(this.insuranceAmount, this.insuranceWinAmount);
            $('#insuranceModal').modal('hide');
        });

        insuranceNextTime.addEventListener('click', () => {
            $('#insuranceModal').modal('hide');
        });

        submitButton.addEventListener('click', () => {
            let sidebets = [];
            const elements = $('.btun');
            for (const button of elements) {
                if (button.classList.contains('selected')) {
                    sidebets.push(button.id);
                }
            }
            console.log(sidebets);
            console.log(this.sidebetStreet);
            submitSideBet(sidebets, this.sidebetStreet);
            this.initSideBetPanel();
        });

        for(const btn of submitButton4){
            const button = btn.querySelector('.s-sec')
            const priceButton = button.querySelector('.price_button');
            const confirmButton = button.querySelector('.confirm_button');

            button.addEventListener('click', ()=>{
                console.log(priceButton);
                if (priceButton.style.display ==='block') {
                    this.handlePriceClick(btn, priceButton, confirmButton);
                } else if (confirmButton.style.display ==='block') {
                    this.handleConfirmClick(btn, button, priceButton, confirmButton);
                }
            })
        }

        /* openMenuButton.addEventListener('click', () => {
             $(mobileSideBar).addClass("active");
         });

        mobileSideBar.addEventListener('click', () => {
            $(mobileSideBar).removeClass("active");
        });*/

        /*  joinWaitingButton.addEventListener('click', () => {
              joinWaitingList();
          })

          waitListArrow.addEventListener('click', () => {
              if (waitListDropdown.style.display == 'none') {
                  waitListDropdown.style.display = 'block';
              } else {
                  waitListDropdown.style.display = 'none';
              }
          })

          chatInput.addEventListener('keyup', (e) => {
              if (e.key === 'Enter' || e.keyCode === 13) {
                  console.log(e.target.value);
                  doChat({ msg: e.target.value });
                  e.target.value = "";
              }
          });

          chatSendIcon.addEventListener('click', () => {
              console.log(chatInput.value);
              if (chatInput.value) {
                  doChat({ msg: chatInput.value });
                  chatInput.value = "";
              }
          });

          for (const button of multiTableButtons) {
              button.addEventListener('click', () => { window.open("https://nrpoker.net/frontUser/newhome", userToken); });
          }*/
    }

    handlePriceClick(btn, priceButton, confirmButton){
        btn.classList.add('hitting_pair_11');
        priceButton.style.display = 'none';
        confirmButton.style.display = 'block';
    }

    handleConfirmClick(btn, button, priceButton, confirmButton){
        for (const btn of submitButton2) {
                                btn.classList.remove('selected');
                            }
                    let sidebets = [];
                    button.classList.add('selected');
                    const sidebetId = $('#submit-sidebet-2.selected > div').prop('class');
                    sidebets.push(sidebetId);
                    submitSideBet(sidebets, this.sidebetStreet);
                    this.initSideBetPanel();
                    
                    priceButton.style.display = 'block';
                    confirmButton.style.display = 'none';
                    btn.classList.remove('hitting_pair_11');
    }

    showInsurance(data) {
        console.log(data);
        if (data.status == true) {
            this.insuranceAmount = data.data.insurancePrice;
            this.insuranceWinAmount = data.data.allInPrice;
            console.log(this.insuranceAmount);
            console.log(this.insuranceWinAmount);

            const insurancePriceText = getMoneyText(data.data.insurancePrice);
            insurancePrice.innerHTML =insurancePriceText.outerHTML;
            for (const price of allInPrice){
            let allInPriceText = getMoneyText(data.data.allInPrice);
                price.innerHTML = allInPriceText.outerHTML;
            }

            $('#insuranceModal').modal('show');
        } else {
            $('#insuranceModal').modal('hide');
            this.insuranceAmount = 0;
            this.insuranceWinAmount = 0;
        }

    }

    setTrophyInfo(position, number) {
        for (const tropySpan of tropySpans) {
            tropySpan.innerText = `${position}/${number}`;
        }
    }

    showTrophyInfo(value) {
        for (const tropyDiv of tropyDivs)
            this.setActive(tropyDiv, value);
    }

    showFoldToAnyBetCheckbox(value) {
        for (const autoFoldButton of autoFoldButtons) {
            this.setActive1(autoFoldButton, value);
        }
    }

    onOptionFoldToAnyBet(value) {
        this.optionFoldToAnyBet = value;
        // this.showAutoCheckOptions(!value);
        // this.showAutoCheckOrFold = !value;
        this.doFoldToAnyBet();
    }

    showAutoCheckOptions(value) {
        if (value) {
            console.trace();
        }

        if (this.optionFoldToAnyBet) {
            this.setActive(automaticActionsDiv, false);
            this.setActive(sidebetUIDiv, true);
            return;
        }

        if (automaticActionsDiv.style.visibility == "visible" && value) {
            return;
        }

        this.setActive(automaticActionsDiv, value);
        this.setActive(sidebetUIDiv, value);
        this.resetAutoCheckOptions();
    }

    resetAutoCheckOptions() {
        toggleCheckbox(autoCheckCheckbox, false);
        this.onOptionActionAutoCheck(false);
        toggleCheckbox(autoCheckOrFoldCheckbox, false);
        this.onOptionActionAutoCheckOrFold(false);
    }

    onOptionActionAutoCheck(value) {
        this.optionActionAutoCheck = value;
        this.doAutoCheck();

        if (this.optionActionAutoCheck) {
            toggleCheckbox(autoCheckOrFoldCheckbox, false);
            this.onOptionActionAutoCheckOrFold(false);
        }
    }

    onOptionActionAutoCheckOrFold(value) {
        this.optionActionAutoCheckOrFold = value;
        this.doAutoCheckOrFold();

        if (this.optionActionAutoCheckOrFold) {
            toggleCheckbox(autoCheckCheckbox, false);
            this.onOptionActionAutoCheck(false);
        }
    }

    doFoldToAnyBet() {
        if (!this.optionFoldToAnyBet || getPlayerSeat() == -1 || getPlayerSeat() != getCurrentTurn().seat){
        return false;} else{
        this.onFoldClick();
        return true;}
    }

    doAutoFold(autoFoldModeButtonCheckboxes, playerCards, activeSeats) {
        console.warn(round.state);
        console.warn(autoFoldModeButtonCheckboxes.checked != true || round.state != "HoleCards" || getPlayerSeat() == -1 || getPlayerSeat() != getCurrentTurn().seat);
        if (autoFoldModeButtonCheckboxes.checked != true || round.state != "HoleCards" || getPlayerSeat() == -1 || getPlayerSeat() != getCurrentTurn().seat)
            return false;

        var autoFoldType = "";
        const activeSeatsCount = activeSeats.length;
        if (round.seatOfSmallBlind == getPlayerSeat())
            autoFoldType = "small_blind";
        else if (round.seatOfBigBlind == getPlayerSeat())
            autoFoldType = "big_blind";
        else if (activeSeatsCount >= 5) {
            const seatOfSmallBlind = round.seatOfSmallBlind;

            if (seatOfSmallBlind == undefined)
                return false;

            var palyer = getPlayerSeat();
            var playerPosition = 0;
            var next = activeSeats.indexOf(seatOfSmallBlind);
            for (let i = 0; i < activeSeatsCount; i++) {
                playerPosition++;
                if (activeSeats[next] == palyer)
                    break;

                if (activeSeats[next] == activeSeats[activeSeats.length - 1]) {
                    next = 0;
                } else {
                    next++;
                }
            }

            var autoFoldTypes = {};
            if (activeSeatsCount == 5) {
                autoFoldTypes = { "3": "early_position", "4": "middle_position", "5": "late_position" };
            } else if (activeSeatsCount == 6) {
                autoFoldTypes = { "3": "early_position", "4": "middle_position", "5": "middle_position", "6": "late_position" };
            } else if (activeSeatsCount == 7) {
                autoFoldTypes = { "3": "early_position", "4": "early_position", "5": "middle_position", "6": "late_position", "7": "late_position" };
            } else if (activeSeatsCount == 8) {
                autoFoldTypes = { "3": "early_position", "4": "early_position", "5": "middle_position", "6": "middle_position", "7": "late_position", "8": "late_position" };
            } else if (activeSeatsCount == 9) {
                autoFoldTypes = { "3": "early_position", "4": "early_position", "5": "middle_position", "6": "middle_position", "7": "middle_position", "8": "late_position", "9": "late_position" };
            }
            autoFoldType = autoFoldTypes[playerPosition];
            console.warn(`sb: ${seatOfSmallBlind},palyer:${palyer},playerPosition : ${playerPosition}, autoFoldType:${autoFoldType}`);
        }

        if (autoFoldType == "")
            return false;

        const playerCardHandGroup = getPlayerCardHandGroup(playerCards);
        console.warn(`playerCardHandGroup : ${playerCardHandGroup}, autoFoldType : ${autoFoldType}`);
        console.warn(`playerAutoFoldCards : ${this.playerAutoFoldCards[autoFoldType]}`);
        if (this.playerAutoFoldCards[autoFoldType] !== undefined) {
        console.warn(`playerAutoFoldCards : ${this.playerAutoFoldCards[autoFoldType][playerCardHandGroup]}`);
        if (this.playerAutoFoldCards[autoFoldType] !== undefined && this.playerAutoFoldCards[autoFoldType][playerCardHandGroup] == true) {
            this.onFoldClick();
            return true;
        }}

        return false;
    }

    doAutoCheck() {
        if (!this.optionActionAutoCheck || getPlayerSeat() == -1 || getPlayerSeat() != getCurrentTurn().seat)
            return false;

        this.resetAutoCheckOptions();

        if (!getCurrentTurn().canCheck) {
            // this.setActive(automaticActionsDiv, false);
            return false;
        }

        // this.setActive(automaticActionsDiv, false);
        this.onBetClick(0);
        return true;
    }

    showSidebetUI(value) {
        this.setActive(sidebetUIDiv, value);
        if(value){
            sidebetUIWrapper.style.display = "block";
        } else{
            sidebetUIWrapper.style.display = "none"; 
        }
    }

    doAutoCheckOrFold() {
        if (!this.optionActionAutoCheckOrFold || getPlayerSeat() == -1 || getPlayerSeat() != getCurrentTurn().seat)
            return false;

        this.resetAutoCheckOptions();

        if (getCurrentTurn().canCheck) {
            this.onBetClick(0);
            // this.setActive(automaticActionsDiv, false);
        } else
            this.onFoldClick();
        return true;
    }

    onFoldClick() {
        turnAction("fold");
        this.setActive(actionUIDiv, false);
        this.setActive(automaticActionsDiv, false);
        this.setActive(sidebetUIDiv, true);
    }

    onBetClick(bet) {
        turnAction("bet", bet);
        this.setActive(actionUIDiv, false);
        this.setActive(automaticActionsDiv, false);
        this.setActive(sidebetUIDiv, true);
    }

    closeMenu() {
        const button = $(this);
        const div = button.closest('.menuDiv')[0];
        div.style.visibility = "hidden";
    }

    getTableMode() {
        return this.tableInfo.mode;
    }

    getPlayerSeat() {
        return this.playerInfo.seat;
    }

    setPlayerAutoFoldCards(autoFoldCard) {
        this.playerAutoFoldCards = autoFoldCard;
    }

    setPlayerName(newPlayerInfo) {
        this.playerInfo.name = newPlayerInfo.name;
        $(meDiv).find("#myName")[0].innerText = this.playerInfo.name;
        this.setActive(meDiv, true);
    }

    setHandResult(value) {
        if (!value) {
            this.setActive(handResultDiv, false)
        } else {
            this.setActive(handResultDiv, true)
            handResultDiv.innerText = value;
        }
    }

    setLevelInfo(level, duration, nextSB, nextBB, ante, sb, bb) {

        if (level == this.prevLevel)
            return;

        this.levelInfo.level = level;
        this.levelInfo.duration = Math.floor(duration);
        this.levelInfo.nextSB = nextSB;
        this.levelInfo.nextBB = nextBB;
        this.levelInfo.ante = ante;

        if (level != undefined) {
            const smallBlindText = getMoneyText(sb);
            smallBlindSpan.innerHTML = smallBlindText.outerHTML;
            const bigBlindText = getMoneyText(bb);
            bigBlindSpan.innerHTML = bigBlindText.outerHTML;
            anteSpan.innerText = ante;
            levelSpan.innerText = level;
        }

        this.setActiveElements(tournamentDivs, true);
        this.setActive(tableSettingSpanDiv, true);
        if (nextBB != undefined && nextSB != undefined) {
            if (nextBB === 0 && nextSB === 0)
                nextSbBb.innerText = ``;
            else
                nextSbBb.innerText = `${nextSB} / ${nextBB}`;
        } else
            nextSbBb.innerText = ": Break"

        this.runLevelDurationTimer();

        this.prevLevel = level;
    }

    showLevel(value) {
        this.setActive(anteSpan, value);
        this.setActive(levelSpan, value);
        this.setActive(nextSbBb, value);
        this.setActive(levelTimer, value);
    }

    runLevelDurationTimer() {
        if (this.lvlInterval != undefined) return;
        this.lvlInterval = setInterval(() => {
            let hour = Math.floor(this.levelInfo.duration / 3600);
            let min = Math.floor((this.levelInfo.duration - hour * 60) / 60);
            let sec = this.levelInfo.duration - hour * 3600 - min * 60;
            levelTimer.innerText = hour + ":" + (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);

            if (this.levelInfo.duration === 0) {
                this.clearLevelDuration();
            }

            --this.levelInfo.duration;
        }, 1000);
    }

    clearLevelDuration() {
        clearInterval(this.lvlInterval);
        this.lvlInterval = undefined;
    }

    setTableName(name) {
        this.tableInfo.name = name;
        tableNameDiv.innerText = name;
        this.setActive(tableNameDiv, true);
    }

    setSmallBlind(smallBlind) {
        this.tableInfo.smallBlind = smallBlind;
        const smallBlindText = getMoneyText(smallBlind);
        smallBlindSpan.innerHTML = smallBlindText.outerHTML;
        this.setActive(tableSettingSpanDiv, true);
    }

    setBigBlind(bigBlind) {
        this.tableInfo.bigBlind = bigBlind;
        const bigBlindText = getMoneyText(bigBlind);
        bigBlindSpan.innerHTML = bigBlindText.outerHTML;
        this.setActive(tableSettingSpanDiv, true);
    }

    setShowDollarSign(value) {

    }

    showAddChips(value) {
        for (const button of addChipsButtons) {
            this.setActive1(button, value);
        }
    }

    showSitIn(value) {
        this.setActive(sitInBtn, value);
    }

    setTurnFlag(value) {
        this.isTurn = value;
    }

    onSitInClick() {
        sitIn();
    }

    onSitOutClick() {
        sitOut();
    }

    onShowCardClick() {
        showCards();
        this.showShowCardsButton(false);
    }

    showShowCardsButton(value) {
        showCardBtn.style.visibility = value ? "visible" : "hidden";
    }

    showSitOut(value) {
        this.setActiveElements1(sitOutButtons, value);
    }

    showWaitForBB(value) {
        this.setActiveElements1(waitForBBButtons, value);
    }

    showAutoFold(value) {
        this.setActive1(autoFoldModeButtonDiv, value);
    }

    setWaitForBB(value) {
        for (const waitForBBCheckbox of waitForBBCheckboxes) {
            toggleCheckbox(waitForBBCheckbox, value);
        }
    }

    setFoldAnyBet(value) {
        for (const autoFoldCheckbox of autoFoldCheckboxes) {
            toggleCheckbox(autoFoldCheckbox, value);
        }
    }

    showLeaveGameButton(value) {
        this.setActiveElements1(leaveButtons, value);
    }

    showBackLobbyButton(value) {
        this.setActiveElements1(backLobbyButtons, value);
    }

    showTipDealer(value) {
        this.setActive(tipButtonDiv, value);
        this.setActive1(AutoTip, value);
    }

    showSitOutNextHand(value) {
        this.setActive1(sitOutNextHandButtons, value);
    }

    setSitOutNextHand(value) {
            toggleCheckbox(sitOutNextHandCheckboxes, value);
    }

    showBreakTime(isBreak, breakDuration) {
        if (this.prevLevel == 0) return;
        if (!isBreak && this.interval != undefined) { this.clearBreakTime(); return; }
        if (!isBreak || this.interval != undefined) return;

        this.breakDuration = breakDuration;
        breakCountdownDiv.style.visibility = "visible";
        breakCountdownDiv.style.display = "flex";
        $(breakCountdownDiv).find("div")[0].style.animationDuration = `${breakDuration}s`;
        $(breakCountdownDiv).find("div")[0].style.animationName = "progressAnimation";
        this.interval = setInterval(() => {
            let min = Math.floor(this.breakDuration / 60);
            let sec = this.breakDuration - min * 60;
            $(breakCountdownDiv).find(".timer")[0].textContent = (min < 10 ? "0" + min : min) + ":" + (sec < 10 ? "0" + sec : sec);
            --this.breakDuration;
            if (this.breakDuration === 0) {
                this.clearBreakTime();
            }
        }, 1000);
    }

    clearBreakTime() {
        breakCountdownDiv.style.visibility = "hidden";
        breakCountdownDiv.style.display = "none";
        clearInterval(this.interval);
        this.breakDuration = 0;
        this.interval = undefined;
    }

    setActiveElements(elements, value) {
        for (const element of elements)
            element.style.visibility = (value == false || userMode === 1) ? "hidden" : "visible";
    }
    setActiveElements1(elements, value) {
        for (const element of elements)
            element.style.display = (value == false || userMode === 1) ? "none" : "block";
    }

    setActive(element, value) {
        element.style.visibility = (value == false || userMode === 1) ? "hidden" : "visible";
    }
    setActive1(element, value) {
        element.style.display = (value == false || userMode === 1) ? "none" : "block";
    }

    setWaitList(players) {
        this.setActive1(joinWaitingButton, true);

        waitListCount.innerText = players.length;
        waitList.innerHTML = '';


        // const div = document.createElement('div');
        // div.innerText = 'user'
        // waitList.append(div);

        for (const player of players) {
            let userDiv;

            if (player === this.playerInfo.name) {
                userDiv = document.createElement('button');
                // joinWaitingButton.setAttribute('disabled', '');
            } else {
                userDiv = document.createElement('div');
                userDiv.className = "innerUser";
            }

            userDiv.innerHTML = player;

            waitList.append(userDiv);
        }
    }

    showWaitList(value) {
        if (value) {
            waitListDiv.style.display = 'flex';
        } else {
            waitListDiv.style.display = 'none';
        }
    }

    setPlayStatus(value) {
        this.isPlaying = value;

        this.showLogButton(value);
        this.showChatButton(value);
    }

    showLogButton(value) {
        logButton.style.display = value ? "block" : "none";
    }

    showChatButton(value) {
        chatButton.style.display = value ? "block" : "none";
    }

    addLog(text) {
            logDiv.innerHTML += '<p class="firsr_but mt-2 px-2">' + text + '</p>';
        

        let x = $('.logTabButton .activities')[0];
        x.scrollTop = x.scrollHeight; // Scroll to the bottom
        // x.scrollTo(0, x.scrollHeight);
    }

    addChat(data) {
        var html = '<div class="third_p mt-2"><p class="tan mx-2">' + data.playerName + '</p><p class="he mx-2">' + data.msg + '</p></div>';
        chatDiv.innerHTML = chatDiv.innerHTML + html;

        let x = $('.chatButton2 .activities')[0];
        x.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: "smooth" });
    }

    showMessage(msg, data = null) {
        if (data != null) {
            if (data.type == "RejoinInterval") {
                var Interval_time = Math.round(data.RestOfTime / 1000);
                let interval = undefined;

                if (Interval_time == 61) {
                    msg = "There is mandatory " + (Interval_time - 1) + " seconds delay if you want to rejoin this game";
                    $('.error-message')[0].innerHTML = msg;
                } else {
                    interval = setInterval(() => {
                        Interval_time--;
                        if (Interval_time > 0) {
                            msg = "There is mandatory " + Interval_time + " seconds delay if you want to rejoin this game";
                            $('.error-message')[0].innerHTML = msg;
                        } else {
                            $('#msgModal').modal('hide');
                        }
                    }, 1000);
                }

                $("#msgModal").on('hide.bs.modal', function() {
                    if (!!interval)
                        clearInterval(interval);
                    Interval_time = 1000;
                });
            }
        }

        $('.error-message')[0].innerHTML = msg;
        $('#msgModal').modal('show');
    }

    showDoubleLoginMsg(msg) {
        $('.error-message')[0].innerHTML = msg;
        $('#msgModal #myModalLabel')[0].innerText = "Message"
        $('#msgModal button')[1].innerText = "Close Browser"

        $('#msgModal').modal('show');

        $("#msgModal").on('hide.bs.modal', function() {
            disConnectSocket();
            window.close();
        });
    }

    showTournamentResult(hasWin, prize, rank) {
        if (!hasWin) {
            $('.tournament-prize')[0].style.visibility = 'hidden';
        }

        $('#tournamentRank')[0].innerText = rank;
        
        if (/^[1]$/.test(rank)) {
            $('#tournament_place')[0].innerText = 'st';
        } else if(/^[2]$/.test(rank)) {
            $('#tournament_place')[0].innerText = 'nd';
        } else if(/^[3]$/.test(rank)) {
            $('#tournament_place')[0].innerText = 'rd';
        }
        
        $('#tournamentPrize')[0].innerText = prize;

        $('#tournamentResultModal').modal('show');

        $("#tournamentResultModal").on('hide.bs.modal', function() {
            alert('The modal is about to be hidden.');
            window.close();
        });
    }

    initSideBetPanel() {
        $('#submit-sidebet1').find('#total-amount')[0].innerText = '0$';
        $('#total-payout')[0].innerText = '$0';

        const payoutBtns = $(".scroll_prents").find(".button_payout");
        for (const payoutbtn of payoutBtns) {
            payoutbtn.style.visibility = 'hidden';
        }

        const elements = $('.btun');
        for (const button of elements) {
            if (button.classList.contains('selected')) {
                button.classList.remove("selected");
            }
        }
    }


    updateSideBetOptions(street, streetText, options) {
        this.sidebetStreet = street;
        $(".scroll_prents").find('.fund_prent').remove();
        $('#submit-sidebet1').find('#total-amount')[0].innerText = '0';
        $('#total-payout')[0].innerText = '0';
        $(".text-street")[0].innerText = streetsOnSideBet.get(streetText);

        let div = '';
        for (const option of options) {
            const title = $('.button-section .f-sec h5');
            for(let titleName of title){
                titleName.innerText = option.betName;
            }
            $('.button-section .f-btn .s-sec > div').eq(0).removeClass().addClass(`${option.betName}-${this.tableInfo.bigBlind * 10}`)
            $('.button-section .s-btn .s-sec > div').eq(0).removeClass().addClass(`${option.betName}-${this.tableInfo.bigBlind * 20}`)
            $('.button-section .t-btn .s-sec > div').eq(0).removeClass().addClass(`${option.betName}-${this.tableInfo.bigBlind * 50}`)
            const amount1 = getMoneyText(this.tableInfo.bigBlind * 10 * (Number(option.ratio) - 1));
            const amount2 = getMoneyText(this.tableInfo.bigBlind * 20 * (Number(option.ratio) - 1));
            const amount3 = getMoneyText(this.tableInfo.bigBlind * 50 * (Number(option.ratio) - 1));
            const price1 = getMoneyText(this.tableInfo.bigBlind * 10);
            const price2 = getMoneyText(this.tableInfo.bigBlind * 20);
            const price3 = getMoneyText(this.tableInfo.bigBlind * 50);
            console.log( $('.f-btn .s-sec span'));
            $('.f-btn .s-sec span')[0].innerHTML = amount1.outerHTML;
            $('.s-btn .s-sec span')[0].innerHTML = amount2.outerHTML;
            $('.t-btn .s-sec span')[0].innerHTML = amount3.outerHTML;
            $('.button-section .f-btn .s-sec .price')[0].innerHTML = price1.outerHTML;
            $('.button-section .f-btn .s-sec .round_button_2 span')[0].innerHTML = price1.outerHTML;
            $('.button-section .s-btn .s-sec .price')[0].innerHTML = price2.outerHTML;
            $('.button-section .s-btn .s-sec .round_button_2 span')[0].innerHTML = price2.outerHTML;
            $('.button-section .t-btn .s-sec .price')[0].innerHTML = price3.outerHTML;
            $('.button-section .t-btn .s-sec .round_button_2 span')[0].innerHTML = price3.outerHTML;
            div = div + `<div class="fund_prent mb-1 mt-1">
                            <div class="fund3 ">
                                <div class="top_prent">
                                    <div class="Hitting_prents">
                                        <div class="side-bet">
                                            <p class="bet-name">${option.betName}</p>
                                            <p class="bet-ratio">1:${Number(option.ratio) - 1}</p>
                                        </div>
                                        <button class="button_payout" style="visibility: hidden"> <span class="text-white-pay">Payout:</span><span class="text-yellow">$<span id="payout">0</span></span></button>
                                    </div>
                                    <i class="bi bi-question-circle icon-question"
                                        data-bs-toggle="modal" data-bs-target="#modal-note"><span id="sidebet-note" style="display: none;">${option.note}</span></i>
                                </div>
                                <div class="main_right">
                                    <div class="">
                                        <button id="${option.betName}-${this.tableInfo.bigBlind * 10}" class="p-bule btun"><span class="btau_text">$${this.tableInfo.bigBlind * 10}</span></button>
                                    </div>
                                    <div class="">
                                        <button id="${option.betName}-${this.tableInfo.bigBlind * 20}" class="p-bule btun"><span class="btau_text">$${this.tableInfo.bigBlind * 20}</span></button>
                                    </div>
                                    <div class="">
                                        <button id="${option.betName}-${this.tableInfo.bigBlind * 50}" class="p-bule btun"><span class="btau_text">$${this.tableInfo.bigBlind * 50}</span></button>
                                    </div>
                                </div>
                            </div>
                        </div>`;
        }
        $(".scroll_prents").append(div);

        const questionIcons = $('.icon-question');
        for (const icon of questionIcons) {
            icon.addEventListener('click', (e) => {
                $('.sidebet-note')[0].innerText = $(e.currentTarget).find("#sidebet-note")[0].innerText;
            });
        }

        const elements = $('.btun');
        for (const button of elements) {
            button.addEventListener('click', (e) => {
                const parentNode = e.currentTarget.parentNode.parentNode.parentNode;
                const ratio = Number($(parentNode).find(".bet-ratio")[0].innerText.split(':')[1]);
                const totalAmountNode = $('#submit-sidebet1').find('#total-amount')[0];

                if (e.currentTarget.classList.contains('selected')) {
                    e.currentTarget.classList.remove("selected");
                    $(parentNode).find("#payout")[0].innerText = 0;
                    $(parentNode).find(".button_payout")[0].style.visibility = 'hidden';
                } else {
                    const currentBetAmount = Number(e.currentTarget.id.split('-')[1]);
                    const totalBetedAmount = Number(totalAmountNode.innerText.split('$')[0]);

                    if (currentBetAmount + totalBetedAmount > this.freeBalance) {
                        return;
                    }

                    e.currentTarget.classList.add("selected");
                    $(parentNode).find("#payout")[0].innerText = currentBetAmount * ratio;
                    $(parentNode).find(".button_payout")[0].style.visibility = 'visible';
                }

                let totalBet = 0;
                for (const otherButton of elements) {
                    if (otherButton.id !== e.currentTarget.id && (otherButton.id.split('-')[0] === e.currentTarget.id.split('-')[0])) {
                        otherButton.classList.remove("selected");
                    }

                    if (otherButton.classList.contains('selected')) {
                        totalBet = totalBet + Number(otherButton.id.split('-')[1]);
                    }
                }

                let totalPayout = 0;
                for (const payout of $(".text-yellow")) {
                    totalPayout = totalPayout + Number($(payout).find("#payout")[0].innerText);
                }

                totalAmountNode.innerText = totalBet + '$';
                $('#total-payout')[0].innerText = '$' + totalPayout;
            });
        }
    }

    updateFreeBalance(balance) {
        $('#free-balance')[0].innerHTML = (getMoneyText(balance)).outerHTML;
        this.freeBalance = Number(balance);
    }

    updateSideBetHistory(res) {
        if (Number(res.totalReward) > 0) {
            const totalRewardText = getMoneyText(res.totalReward);
            $('.top_200')[0].innerHTML = totalRewardText.outerHTML;
            // $('#modal-wining-payout').modal('show');
            setTimeout(() => {
                $('#modal-wining-payout').modal('show');
            }, 3000);

            setTimeout(() => {
                $('#modal-wining-payout').modal('hide');
            }, 5000);
        }

        console.log('Winning History', res.historyLists);
        let total = 0;
        let div = '';
        for (const list of res.historyLists) {
            total = total + list.award;
            let day = new Date(list.timestamp).getDay();
            const hour = new Date(list.timestamp).getHours();
            const min = new Date(list.timestamp).getMinutes();
            div = div + `<div class="fund_prents mb-1 mt-1">
                            <div class="funds3 ">
                                <div class="top_prents">
                                    <div class="main_hittings">
                                        <div class="top px-1"><img src="images/dollar coinn.png">
                                            <div class="allmix">
                                                <p class="pair">${list.betName}
                                                <p class="today">Today | ${hour}:${min}</p>
                                                </p>
                                            </div>
                                        </div>
                                        <div class="div_in_text">
                                            <p class="amount">$${list.award}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>`;
        }

        $(".scroll_prentss").find('.fund_prents').remove();
        $(".scroll_prentss").append(div);
        $(".sidebet-total-win")[0].innerText = `$${total}`;
    }
}
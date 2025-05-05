import { showCards, sitIn, sitOut, playerLeaveTable, sitOutNextHand, tableSettings, tableSubscribe, waitForBB, doChat, acceptInsurance, round, registerTournament } from "../services/table-server";
import { ShowTipToDealer, disConnectSocket, playerLeave, submitSideBet, updatePlayerInfo } from "../socket-client";
import { toggleCheckbox } from "./checkbox";
import { getPlayerSeat, getCurrentTurn, turnAction, joinWaitingList } from '../services/table-server';
import { removeMuckedFlag, showBuyIn } from './game-ui';
import { userMode, userToken, setDetectedDoubleBrowser, defaultCurrency } from '../services/game-server';
import { getMoneyText } from "./money-display";
import { getCardImageFilePath, getPlayerCardHandGroup } from "./card-ui";
import { customTimer } from "../services/utils-server";
import { getMessage } from "./language-ui";

const tableSettingSpanDiv = $(".tableSettingsSpan")[0];
const tableNameDiv = $(".tableName")[0];

const actionUIDiv = $("#turnActionsDiv")[0];

const automaticActionsDiv = $("#automaticActionsDiv")[0];
const autoCheckOrFoldButton = $("#autoCheckOrFoldButton")[0];
const autoCheckButton = $("#autoCheckButton")[0];
const autoCheckCheckbox = $("#autoCheckButton .checkbox")[0];
const autoCheckOrFoldCheckbox = $("#autoCheckOrFoldButton .checkbox")[0];
const waitForBBButtons = $(".waitForBBButton");
const waitForBBCheckboxes = $(".waitForBBButton .checkbox");
const sitOutNextHandButtons = $(".sitOutNextHandButton")[0];
const sitOutNextHandCheckboxes = $(".sitOutNextHandButton .checkbox")[0];
const smallBlindSpan = $(".smallBlind")[0];
const bigBlindSpan = $(".bigBlind")[0];
const anteSpan = $(".ante")[0];
const levelSpan = $(".level")[0];
const nextSbBb = $(".nextSBBB")[0];
const tournamentTimers = $(".timers")[0];
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
const callText = $(".callText")[0];
console.log(callText)
const tropySpans = $(".trophyDiv span");
const openMenuButton = $("#openMenuButton")[0];
const tournamentCancelTimeDiv = $("#tournamentCancelTime")[0];
//const mobileSideBar = $("#mobileSideBar")[0];
const handResultDiv = $(".handResult")[0];
const waitListDiv = $(".waitingList")[0];
//const joinWaitingButton = $(".waitingList button")[0];
//const waitListCount = $(".waitingListSide ")[0];
//const waitList = $(".users")[0];
//const waitListDropdown = $("#usersDropdown")[0];
const waitListArrow = $("#arrow")[0]
const logDiv = $('.log_data')[0];
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
const rebuy_tournament = $(".rebuy_tournament")[0];
const insuranceNextTime = $(".insuranceNextTime")[0];
const insurancePrice = $(".insurancePrice")[0];
const allInPrice = $(".allInPrice1");
const LogHead = $(".activity-header span")[0];

const alwaysFoldCheckbox = $(".alwaysFoldButton .checkbox")[0];
const alwaysFoldButtons = $(".alwaysFoldButton");

const foldToAnyBetButtonDiv = $(".foldToAnyBetButton")[0];
const foldToAnyBetButtonCheckboxe = $(".foldToAnyBetButton .checkbox")[0];
const callButton = $(".callButtonDiv")[0];
const callButtonCheckbox = $(".callButtonDiv .checkbox")[0];
const preFlopAutoFoldDiv = $(".preFlopAutoFold")[0];

const submitButton3 = $('.round_button_2');
const shuffleVerificationButtonDiv = $(".shuffleVerificationButtonDiv")[0];
const prev_button = $(".prev-button")[0];
const next_button = $(".next-button")[0];
const progressBar = $('.progress')[0];
const progressHandle = $('.progress-handle')[0];
const uniquePlayers = new Set();

let isDragging = false;
let startX, scrollLeft;
let touchStartX = 0;

let msgData = [];
let currentIndex = msgData.length + 1;
/*
const submitButton = $('#submit-sidebet1')[0];
const submitButton2 = $('#submit-sidebet-2.s-sec');
const submitButton4 = $('.sidebet');

const sidebetUIDiv = $(".button-section")[0];
const sidebetUIWrapper = $(".wrapper")[0];
const streetsOnSideBet = new Map();
streetsOnSideBet.set('PreCards', 'Next Cards');
streetsOnSideBet.set('PreFlop', 'Flop');
streetsOnSideBet.set('Flop', 'Turn');
streetsOnSideBet.set('Turn', 'River');*/
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
        this.optionAlwaysFold = false;
        this.optionActionAutoCheck = false;
        this.optionActionAutoCheckOrFold = false;
        this.tournamentCancelTimeInterval = undefined;
        this.tournamentTimeInterval = undefined;
        this.isTurn = false;
        this.isPlaying = false;
        this.insuranceAmount = 0;
        this.insuranceWinAmount = 0;
        this.playerAutoFoldCards = [];
        this.currentStreet = '';
        this.currentHandActions = [];
        // this.showAutoCheckOrFold = false;
        this.init();

        this.handHistory = {
            preflop: [],
            flop: [],
            turn: [],
            river: []
        };
        this.potSizes = {
            preflop: 0,
            flop: 0,
            turn: 0,
            river: 0
        };
    }

    init() {

        breakCountdownDiv.style.visibility = "hidden";
        this.setActive(automaticActionsDiv, false);
        /*   this.setActive(sidebetUIDiv, false); */

        this.setActive(tipButtonDiv, false);
        this.setActive(preFlopAutoFoldDiv, false);
        /*  this.setActive(sidebetUIWrapper, false); */
        this.setElementsDisplay(leaveButtons, false);
        this.setElementsDisplay(backLobbyButtons, true);
        this.setActive(sitInBtn, false);
        this.setActive(autoCheckOrFoldButton, false);
        this.setActive(autoCheckButton, false);
        this.setActive(foldToAnyBetButtonDiv, false);
        this.setActive(callButton, false);
        this.setActiveElements(tournamentDivs, false);
        this.setActive(tableNameDiv, false);
        this.setActive(tableSettingSpanDiv, false);
        this.setActive(meDiv, false);
        this.setActive($(meDiv).find(".stars")[0], false);
        this.setActive(handResultDiv, false);
        this.setActive(uiTables, false);
        this.setActive(settingsMenu, false);
        // this.setDisplay(waitListDropdown, false);
        this.setDisplay(AutoTip, false);
        this.setDisplay(shuffleVerificationButtonDiv, false);
        // this.setActive(addTipsButtons, false);

        sitInBtn.addEventListener('click', () => {
            this.onSitInClick();
        });
        logButton.addEventListener('click', () => {
            $("#activityContainer").css("display", "block");
        });

        prev_button.addEventListener('click', () => {
            if (currentIndex > 1) {
                currentIndex--;
                this.showHandHistory(currentIndex);
                progressHandle.style.left = `${((currentIndex -1) / (msgData.length )) * 100}%`;
            }
        });
        next_button.addEventListener('click', () => {
            if (currentIndex < msgData.length + 1) {
                currentIndex++;
                this.showHandHistory(currentIndex);
                progressHandle.style.left = `${((currentIndex -1) / (msgData.length )) * 100}%`;
            }
        });
        // progressHandle.addEventListener('touchstart', (e) => {
        //     isDragging = true;
        //     touchStartX = e.touches[0].clientX - progressHandle.offsetLeft;
        // });
        // document.addEventListener('touchend', () => {
        //     isDragging = false;
        // });

        // document.addEventListener('touchmove', (e) => {
        //     if (!isDragging) return;
        //     e.preventDefault();
        //     let positionX = e.touches[0].clientX
        //     let x = positionX - startX;
        //     let progressWidth = progressBar.offsetWidth;

        //     let percentScrolled = Math.max(0, Math.min(1, x / progressWidth));
        //     let newIndex = Math.round(percentScrolled * (msgData.length)) + 1;

        //     if (newIndex < 1) newIndex = 1;
        //     if (newIndex >= msgData.length + 1) newIndex = msgData.length + 1;

        //     if (newIndex !== currentIndex) {
        //         currentIndex = newIndex;
        //         this.showHandHistory(currentIndex);
        //     }
        //     progressHandle.style.left = `${((currentIndex - 1) / msgData.length) * 100}%`;
        // });

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

        openMenuButton.addEventListener('click', () => {
            this.setActive(uiTables, true);
            $("#uiTable .modal").css("display", "block");
        })

        closeUiTable.addEventListener('click', () => {
            this.setActive(uiTables, false);
            $("#uiTable .modal").css("display", "none");
        })

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

        /*  waitListCount.addEventListener('click', () => {
             if (waitListDropdown.style.display == "block") {
                 this.setDisplay(waitListDropdown, false)
             } else {
                 this.setDisplay(waitListDropdown, true)
             }
         }) */

        for (const waitForBBCheckbox of waitForBBCheckboxes) {
            waitForBBCheckbox.addEventListener('change', () => { waitForBB(waitForBBCheckbox.checked) });
        }
        sitOutNextHandCheckboxes.addEventListener('click', () => {
            sitOutNextHand(sitOutNextHandCheckboxes.checked);
        });

        alwaysFoldCheckbox.addEventListener('change', () => {
            this.showSitIn(alwaysFoldCheckbox.checked)
            this.onOptionAlwaysFold(alwaysFoldCheckbox.checked);
        });
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
        foldToAnyBetButtonCheckboxe.addEventListener('change', () => {
            this.onOptionFoldToAnyBet(foldToAnyBetButtonCheckboxe.checked);
        });
         callButtonCheckbox.addEventListener('change', () => {
            this.onOptionCall(callButtonCheckbox.checked);
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

        /*submitButton.addEventListener('click', () => {
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

        for (const btn of submitButton4) {
            const button = btn.querySelector('.s-sec')
            const priceButton = button.querySelector('.price_button');
            const confirmButton = button.querySelector('.confirm_button');

            button.addEventListener('click', () => {
                console.log(priceButton);
                if (priceButton.style.display === 'block') {
                    this.handlePriceClick(btn, priceButton, confirmButton);
                } else if (confirmButton.style.display === 'block') {
                    this.handleConfirmClick(btn, button, priceButton, confirmButton);
                }
            })
        }*/

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

    showTournamentCancelTime(res) {
        if (!res.status) {
            tournamentCancelTimeDiv.style.visibility = "hidden";
            tournamentCancelTimeDiv.style.display = "none";
            this.cleartournamentCancelTime();
            return true;
        }
        if (res.cancelWaitingTime > 0) {
            this.tournamentCancelTimeInterval = new customTimer();
            var duration = res.cancelWaitingTime;
            tournamentCancelTimeDiv.style.visibility = "visible";
            tournamentCancelTimeDiv.style.display = "flex";
            $(tournamentCancelTimeDiv).find("div")[0].style.animationDuration = `${duration}s`;
            $(tournamentCancelTimeDiv).find("div")[0].style.animationName = "progressAnimation";
            this.tournamentCancelTimeInterval.descendingTimer(duration, (time) => {
                $(tournamentCancelTimeDiv).find(".timer")[0].textContent = `${time.minutes} : ${time.seconds}`;

                if (time.minutes == "0" && time.seconds == "0") {
                    this.cleartournamentCancelTime();
                    this.showDoubleLoginMsg(getMessage('cancelTournament'));
                }
            });
        }
    }

    cleartournamentCancelTime() {
        tournamentCancelTimeDiv.style.visibility = "hidden";
        tournamentCancelTimeDiv.style.display = "none";
        if (this.tournamentCancelTimeInterval !== undefined) {
            this.tournamentCancelTimeInterval.stopTimer();
            this.tournamentCancelTimeInterval = undefined;
        }

    }

    setHandResult(value, timeout = 0) {
        if (!value) {
            this.setActive(handResultDiv, false)
        } else {
            setTimeout(() => {
                this.setActive(handResultDiv, true)
                handResultDiv.innerText = value;
            }, timeout);

        }
    }
    setLogHead(mode, bb, sb, handId, name) {
        mode = mode.replace(/^./, c => c.toUpperCase());
        LogHead.innerHTML = `<div class="lodHeadText"><div>Nrpoker. ${mode}. </div><div>${name} </div><div>${bb}/${sb}. Hand ${handId}</div></div>`;
    }
    showTournamentTime(timeDuration) {
        if (timeDuration > 0 && this.tournamentTimeInterval === undefined) {
            this.tournamentTimeInterval = new customTimer();
            this.tournamentTimeInterval.descendingTimer(timeDuration, (time) => {
                this.setActive(tournamentTimers, true);
                /* this.setActive(tableSettingSpanDiv, false); */
                this.showLevel(false);
                tournamentTimers.querySelector('.minutes').innerText = ('0' + time.minutes).slice(-2);
                tournamentTimers.querySelector('.seconds').innerText = ('0' + time.seconds).slice(-2);
                if (time.minutes == "0" && time.seconds == "0") {
                    this.setActive(tournamentTimers, false);
                }
                console.log(`days: ${time.days}, hours: ${time.hours}, minutes: ${time.minutes}, seconds: ${time.seconds}`);
            });
        }
    }



    handlePriceClick(btn, priceButton, confirmButton) {
        btn.classList.add('hitting_pair_11');
        priceButton.style.display = 'none';
        confirmButton.style.display = 'block';
    }

    /*handleConfirmClick(btn, button, priceButton, confirmButton) {
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
    }*/

    showInsurance(data) {
        if (data.status == true) {
            this.insuranceAmount = data.data.insurancePrice;
            this.insuranceWinAmount = data.data.allInPrice;
            const insurancePriceText = getMoneyText(data.data.insurancePrice);
            insurancePrice.innerHTML = insurancePriceText.outerHTML;
            for (const price of allInPrice) {
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
        for (const alwaysFoldButton of alwaysFoldButtons) {
            this.setDisplay(alwaysFoldButton, value);
        }
    }

    onOptionAlwaysFold(value) {
        this.optionAlwaysFold = value;
        // this.showAutoCheckOptions(!value);
        // this.showAutoCheckOrFold = !value;
        this.doFoldToBet();
    }

    showAutoCheckOptions(value) {
        // if (value) {}

        // if (this.optionAlwaysFold) {
        //     this.setActive(automaticActionsDiv, false);
        //     // this.setActive(sidebetUIDiv, true);
        //     //this.setActive(tipButtonDiv, true);
        //     return;
        // }

        // if (automaticActionsDiv.style.visibility == "visible" && value) {
        //     return;
        // }

        // this.setActive(automaticActionsDiv, value);
        // // this.setActive(sidebetUIDiv, value);
        // //this.setActive(tipButtonDiv, value);
        // this.resetAutoCheckOptions();
    }
    showautoCheckButton(value){
        this.setActive(autoCheckButton, value);
    }
    showFoldToAnyBetOption(value) {
        this.setActive(foldToAnyBetButtonDiv, value);
        if(!value){
            this.setActive(autoCheckButton, false);
            this.setActive(callButton, false);
        }
        if(round.state === "PreFlop" ){
            this.setActive(autoCheckOrFoldButton, false);
        } else {
            this.setActive(autoCheckOrFoldButton, value);
        }
    }
    setCallButton(value, mainPlayerBet)
    {
        value ? this.setActive(callButton, true) : this.setActive(callButton, false);
        if(value)
            callText.innerText = value - mainPlayerBet;
    }
    setFoldToAnyBetText(value, mainPlayerBet) {
        $(foldToAnyBetButtonDiv).find('span')[0].innerHTML = value ? 'Fold' : 'Fold to any bet';
        this.setActive(autoCheckButton, !value);
    }

    resetAutoCheckOptions() {
        toggleCheckbox(autoCheckCheckbox, false);
        this.onOptionActionAutoCheck(false);
        toggleCheckbox(autoCheckOrFoldCheckbox, false);
        this.onOptionActionAutoCheckOrFold(false);
        toggleCheckbox(callButtonCheckbox, false);
        this.onOptionCall(false);
    }

    onOptionActionAutoCheck(value) {
        this.optionActionAutoCheck = value;
        this.doAutoCheck();

        if (this.optionActionAutoCheck) {
            toggleCheckbox(autoCheckOrFoldCheckbox, false);
            this.onOptionActionAutoCheckOrFold(false);
            toggleCheckbox(foldToAnyBetButtonCheckboxe, false);
            this.onOptionFoldToAnyBet(false);
            toggleCheckbox(callButtonCheckbox, false);
            this.onOptionCall(false);
        }
    }

    onOptionActionAutoCheckOrFold(value) {
        this.optionActionAutoCheckOrFold = value;
        this.doAutoCheckOrFold();

        if (this.optionActionAutoCheckOrFold) {
            toggleCheckbox(autoCheckCheckbox, false);
            this.onOptionActionAutoCheck(false);
            toggleCheckbox(foldToAnyBetButtonCheckboxe, false);
            this.onOptionFoldToAnyBet(false);
            toggleCheckbox(callButtonCheckbox, false);
            this.onOptionCall(false);
        }
    }
    onOptionFoldToAnyBet(value) {
        this.optionFoldToAnyBet = value;

        if (this.optionFoldToAnyBet) {
            toggleCheckbox(autoCheckCheckbox, false);
            this.onOptionActionAutoCheck(false);
            toggleCheckbox(autoCheckOrFoldCheckbox, false);
            this.onOptionActionAutoCheckOrFold(false);
            toggleCheckbox(callButtonCheckbox, false);
            this.onOptionCall(false);
        }
    }
    onOptionCall(value) {
        this.optionCall = value;

        if (this.optionCall) {
            toggleCheckbox(autoCheckCheckbox, false);
            this.onOptionActionAutoCheck(false);
            toggleCheckbox(autoCheckOrFoldCheckbox, false);
            this.onOptionActionAutoCheckOrFold(false);
            toggleCheckbox(foldToAnyBetButtonCheckboxe, false);
            this.onOptionFoldToAnyBet(false);
        }
    }
    doFoldToBet() {
        const isfoldToAnyBet = (foldToAnyBetButtonCheckboxe.checked && !!getCurrentTurn().call);
        if ((!this.optionAlwaysFold && !isfoldToAnyBet) || getPlayerSeat() == -1 || getPlayerSeat() != getCurrentTurn().seat)
            return false;


        this.onFoldClick();
        return true;
    }
    doCall() {

        const isCall = (callButtonCheckbox.checked );
        if ((!isCall) || getPlayerSeat() == -1 || getPlayerSeat() != getCurrentTurn().seat)
            return false;
        this.resetAutoCheckOptions();
        if (!getCurrentTurn().canCall) {
            // this.setActive(automaticActionsDiv, false);
            return false;
        }
        this.onBetClick(callText.innerHTML);
        return true;
    }
    doPreFlopAutoFold(autoFoldModeButtonCheckboxes, playerCards, activeSeats) {
        if (autoFoldModeButtonCheckboxes.checked != true || round.state != "PreFlop" || getPlayerSeat() == -1 || getPlayerSeat() != getCurrentTurn().seat)
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
        }

        if (autoFoldType == "")
            return false;

        const playerCardHandGroup = getPlayerCardHandGroup(playerCards);
        if (this.playerAutoFoldCards[autoFoldType] !== undefined) {
            if (this.playerAutoFoldCards[autoFoldType] !== undefined && this.playerAutoFoldCards[autoFoldType][playerCardHandGroup] == true) {
                this.onFoldClick();
                return true;
            }
        }

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

    /*showSidebetUI(value) {
        this.setActive(sidebetUIDiv, value);
        if (value) {
            sidebetUIWrapper.style.display = "block";
        } else {
            sidebetUIWrapper.style.display = "none";
        }
    }*/

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
        //this.setActive(sidebetUIDiv, true);
        // this.setActive(tipButtonDiv, true);
    }

    onBetClick(bet) {
        turnAction("bet", bet);
        this.setActive(actionUIDiv, false);
        this.setActive(automaticActionsDiv, false);
        // this.setActive(sidebetUIDiv, true);
        //this.setActive(tipButtonDiv, true);
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

    resetFoldToAnyBetOption() {
        toggleCheckbox(foldToAnyBetButtonCheckboxe, false);
    }

    setPlayerName(newPlayerInfo) {
        this.playerInfo.name = newPlayerInfo.name;
        $(meDiv).find("#myName")[0].innerText = this.playerInfo.name;
        this.setActive(meDiv, true);
    }

    setHandResult(value, timeout = 0) {
        if (!value) {
            this.setActive(handResultDiv, false)
        } else {
            setTimeout(() => {
                this.setActive(handResultDiv, true)
                handResultDiv.innerText = value;
            }, timeout);
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
        if (tableSettings.mode === "tournament")
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
    setAnte(ante) {
        this.tableInfo.ante = ante;
        const anteText = getMoneyText(ante);
        anteSpan.innerHTML = anteText.outerHTML;
        this.setActive(anteSpan, true);
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
            this.setDisplay(button, value);
        }
    }

    showSitIn(value) {
        this.setActive(sitInBtn, value);
    }

    setTurnFlag(value) {
        this.isTurn = value;
    }

    onSitInClick() {
        if (tableSettings.mode === "tournament")
            this.setAlwaysFold(false);
        else
            sitIn();
    }

    onSitOutClick() {
        sitOut();
    }

    onShowCardClick() {
        showCards();
        removeMuckedFlag();
        this.showShowCardsButton(false);
        const playerCard = document.querySelector(".player_wrapper:nth-child(6) .player-cards");

        if (playerCard) {
            playerCard.classList.add("show");
        }
    }

    showShowCardsButton(value) {
        showCardBtn.style.visibility = value ? "visible" : "hidden";
    }

    showSitOut(value) {
        this.setElementsDisplay(sitOutButtons, value);
    }

    showPreFlopAutoFold(value) {
        this.setActive(preFlopAutoFoldDiv, value);
    }

    showWaitForBB(value) {
        this.setElementsDisplay(waitForBBButtons, value);
    }

    setWaitForBB(value) {
        for (const waitForBBCheckbox of waitForBBCheckboxes) {
            toggleCheckbox(waitForBBCheckbox, value);
        }
    }

    setAlwaysFold(value) {
        this.showSitIn(value)
        this.optionAlwaysFold = value;
        toggleCheckbox(alwaysFoldCheckbox, value, false);
    }

    showLeaveGameButton(value) {
        this.setElementsDisplay(leaveButtons, value);
    }

    showBackLobbyButton(value) {
        this.setElementsDisplay(backLobbyButtons, value);
    }

    showTipDealer(value) {
        // this.setActive(tipButtonDiv, value);
        this.setDisplay(AutoTip, false);
    }

    showShuffleVerification(value) {
        this.setDisplay(shuffleVerificationButtonDiv, value);
    }

    showSitOutNextHand(value) {
        this.setDisplay(sitOutNextHandButtons, value);
    }

    setSitOutNextHand(value) {
        toggleCheckbox(sitOutNextHandCheckboxes, value);
    }

    showBreakTime(isBreak, breakDuration) {
        if (this.prevLevel == 0) return;
        if (!isBreak && this.interval != undefined) { this.clearBreakTime(); return; }
        if (!isBreak || this.interval != undefined) return;

        this.breakDuration = this.levelInfo.duration;
        breakCountdownDiv.style.visibility = "visible";
        breakCountdownDiv.style.display = "flex";
        $(breakCountdownDiv).find("div")[0].style.animationDuration = `${this.breakDuration}s`;
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
    roundResult() {
        const response = this.saveHandHistory();
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
    setElementsDisplay(elements, value) {
        for (const element of elements)
            element.style.display = (value == false || userMode === 1) ? "none" : "block";
    }

    setActive(element, value) {
        element.style.visibility = (value == false || userMode === 1) ? "hidden" : "visible";
    }
    setDisplay(element, value) {
        element.style.display = (value == false || userMode === 1) ? "none" : "block";
    }

    setWaitList(players) {
        //this.setDisplay(joinWaitingButton, true);

        /* waitListCount.innerText = players.length; */
        // waitList.innerHTML = '';


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

            //   waitList.append(userDiv);
        }
    }

    showWaitList(value) {
        /*  if (value) {
             waitListDiv.style.display = 'flex';
         } else {
             waitListDiv.style.display = 'none';
         } */
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

    addLog(logData) {
        const action = this.parseLogMessage(logData);

        if (action) {
            if (action.isNewRound) {

                this.handHistory = {
                    preflop: [],
                    flop: [],
                    turn: [],
                    river: []
                };
                this.currentStreet = 'preflop';
                return;

            }
            if (this.currentStreet) {

                this.handHistory[this.currentStreet].push({
                    ...action,
                });
                if (currentIndex == msgData.length + 1 || msgData.length == 0) {
                    this.displayHandHistory(this.handHistory);
                    progressHandle.style.left = `${((currentIndex -1) / (msgData.length )) * 100}%`;
                }
            }
        }
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
                    $('#msgModal').modal('show');
                } else {
                    interval = setInterval(() => {
                        Interval_time--;
                        if (Interval_time > 0) {
                            msg = "There is mandatory " + Interval_time + " seconds delay if you want to rejoin this game";
                            $('.error-message')[0].innerHTML = msg;
                            $('#msgModal').modal('show');
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
            } else {
                $('.error-message')[0].innerHTML = msg;
                $('#msgModal').modal('show');
            }
        }

        
    }

    showDoubleLoginMsg(msg) {
        setDetectedDoubleBrowser(true);

        $('.error-message')[0].innerHTML = msg;
        $('#msgModal #myModalLabel')[0].innerText = "Message"
        $('#msgModal button')[1].innerText = "Close Browser"

        $('#msgModal').modal('show');

        $("#msgModal").on('hide.bs.modal', function() {
            disConnectSocket();
            window.close();
        });
    }

    showTournamentResult(hasWin, prize, rank, isRegister, register_amount, id, tournament_id) {

        if (!hasWin) {
            $('.tournament-prize')[0].style.visibility = 'hidden';
        }

        $('#tournamentRank')[0].innerText = rank;

        if (/^[1]$/.test(rank)) {
            $('#tournament_place')[0].innerText = 'st';
        } else if (/^[2]$/.test(rank)) {
            $('#tournament_place')[0].innerText = 'nd';
        } else if (/^[3]$/.test(rank)) {
            $('#tournament_place')[0].innerText = 'rd';
        }

        $('#tournamentPrize')[0].innerText = prize;
        const currency = (defaultCurrency === "USDC") ? "USDC" : "XRP";
        $(rebuy_tournament).find('span')[0].innerText = `${register_amount} ${currency}`;
        $('.tournament-rebuy')[0].style.display = (isRegister) ? 'block' : 'none';

        rebuy_tournament.addEventListener('click', () => {
            $(".loader").show();
            registerTournament(tournament_id, id);
        });

        $('#tournamentResultModal').modal('show');

        $("#tournamentResultModal").on('hide.bs.modal', function() {
            alert('The modal is about to be hidden.');
            window.close();
        });
    }
    parseLogMessage(log) {
        const action = {
            playerName: '',
            action: '',
            amount: '',
            position: '',
            balance: '',
            cards: [],
            isNewRound: false,
            avatar: ''
        };

        if (log.isNewRound) {
            action.isNewRound = true;
            return action;
        }
        if (log.log) {
            const showCardsMatch = log.log.match(/^(.*?)\s+shows\s+([\w\d]+),([\w\d]+)/);
            if (showCardsMatch) {
                const playerName = showCardsMatch[1];

                if (uniquePlayers.has(playerName)) {
                    return null;
                }

                uniquePlayers.add(playerName);
                action.playerName = playerName;
                action.action = "Shows";
                action.amount = log.rank;
                action.avatar = log.avatar;
                action.cards = [showCardsMatch[2], showCardsMatch[3]];
                return action;
            }
            const winMatch = log.log.match(/(\w+)\s+Won\s+([\d.]+),\s+With:\s+\[([^\]]+)\]\s+(.+)/);

            if (winMatch) {
                action.playerName = winMatch[1];
                action.action = "Won";
                action.amount = parseFloat(winMatch[2]);
                action.avatar = log.avatar;
                return action;
            }
            const anteMatch = log.log.match(/ante\s*:\s*(\d+)/);

            if (anteMatch) {
                action.action = "All Ante";
                action.amount = parseFloat(anteMatch[1]);
                return action;
            }
        }

        if (log.action) {
            const actionType = log.action
            const validActions = ["SB", "BB", "call", "bet", "raise", "fold", "check", "allin"];
            if (actionType === "SB" || actionType === "BB") {
                action.position = `<div class="player-tag-bb">${log.action}</div>`;
            } else {
                action.position = '';
            }
            if (validActions.includes(actionType)) {
                if (log.amount)[
                    this.updatePotSizes(this.currentStreet, log.amount)
                ]
                action.playerName = log.name;
                action.action = log.action;
                action.amount = log.amount || '';
                action.balance = log.action == 'fold' ? '' : log.Balance || '';
                action.avatar = log.avatar;
                // action.position = this.getPlayerPosition(bettingMatch[1]);
                return action;
            }
        }
        const streetMatch = log.log.match(/(\w+): \[(.*?)\], (\d+) players/);
        if (streetMatch) {
            this.currentStreet = streetMatch[1].toLowerCase();
            if (this.currentStreet == 'showdown') {
                this.currentStreet = 'river';
            }
            if (this.currentStreet != 'preflop') {

                action.playerName = 'Dealer';
                action.action = streetMatch[1];
                action.cards = streetMatch[2].split(',');
                return action;
            }
        }
        // return action;
    }

    displayHandHistory(handHistory) {
            const logDiv = $('.logData')[0];
            logDiv.innerHTML = '';

            const table = document.createElement('table');
            table.className = 'header';

            table.innerHTML = `
            <thead>
                <tr>
                    <td>
                        <div class="header-title">Pre-Flop</div>
                        <div class="header-value">${this.potSizes.preflop}</div>
                    </td>
                    <td>
                        <div class="header-title">Flop</div>
                        <div class="header-value">${this.potSizes.flop}</div>
                    </td>
                    <td>
                        <div class="header-title">Turn</div>
                        <div class="header-value">${this.potSizes.turn}</div>
                    </td>
                    <td>
                        <div class="header-title">River</div>
                        <div class="header-value">${this.potSizes.river}</div>
                    </td>
                </tr>
            </thead>
        `;

            const tbody = document.createElement('tbody');
            tbody.className = 'poker-table';
            const row = document.createElement('tr');

            ['preflop', 'flop', 'turn', 'river'].forEach(street => {
                        const td = document.createElement('td');
                        td.className = 'scroll_td';
                        const scrollContent = document.createElement('div');
                        scrollContent.className = 'scroll-content';
                        handHistory[street].forEach(action => {
                                    const playerWrapper = document.createElement('div');
                                    playerWrapper.className = 'player-wrapper';
                                    let dealerCardsHTML = '';
                                    if (action.cards.length > 0) {

                                        for (let i = 0; i < action.cards.length; ++i) {
                                            const card = action.cards[i].toLowerCase();
                                            if (card) {

                                                const cardImgFilePath = getCardImageFilePath(card);
                                                dealerCardsHTML += `<div class="content dealer-card" 
                                value=${card}>
                                <img class="" src="${cardImgFilePath}" style="height: 40px; width: 27px;"/>
                                </div>`;
                                            }
                                        }
                                    }

                                    playerWrapper.innerHTML = `
                    <div class="player-avatar-wrapper">
                        ${action.position}
                        <div class="player-avatar">
                           ${action.avatar ? `<img src="${action.avatar}" alt="userAvatar">` : `<img src="./images/avtar.png" alt="Babar888">` }
                        </div>
                        <div class="playerBalance">
                            ${action.balance ? `<img src="./images/ChipsIcon.png" alt="userAvatar"> <div class="player-balance">${action.balance}</div>` : ``}
                        </div>
                    </div>
                    <div class="player-content">
                        <div class="player-detail">
                            <div class="player-name">${action.playerName}</div>
                            
                        </div>
                        <div class="player-container">
                            <div class="player-action">
                                <span class="bet-action">${action.action}</span>
                                ${action.amount ? `<span class="bet-action" style="">:</span><span class="bet-amount"> ${action.amount}</span>` : ''}
                            </div>
                            <div class="DealerCards ${dealerCardsHTML ? '' : 'empty'}" style="width: fit-content;display: grid;grid-template-columns: repeat(3, 27px);gap: 5px; margin-top:5px;">
                                ${dealerCardsHTML}
                            </div>
                        </div>
                    </div>
                `;

                scrollContent.appendChild(playerWrapper);
            });
            td.appendChild(scrollContent);
            row.appendChild(td);
        });

        tbody.appendChild(row);
        table.appendChild(tbody);
        logDiv.appendChild(table);
       
    }

    updatePotSizes(street, amount) {
        this.potSizes[street] = amount;
    }
    saveHandHistory() {
            msgData.push(JSON.parse(JSON.stringify(this.handHistory))); 
            if(currentIndex == msgData.length ){
                $('.hand-counter').html(`${msgData.length + 1} / <span class="totalLogs">${msgData.length + 1}</span>`);
                currentIndex = msgData.length + 1;  
                // this.displayHandHistory(this.handHistory);
            } else {
                $('.totalLogs').text(msgData.length + 1);
            }
            // this.showHandHistory(currentIndex);
            uniquePlayers.clear();
            return true;
    }
    showHandHistory(index) {
        if (index > 0 && index < msgData.length +2) {
            $('.hand-counter').html(`${index} / <span class="totalLogs">${msgData.length +1}</span>`);
            if(index == msgData.length +1){
                this.displayHandHistory(this.handHistory)
            } else {
                this.displayHandHistory(msgData[index-1]);
            }
        }
    }
    // side bet code

    /* initSideBetPanel() {
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
             for (let titleName of title) {
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
             console.log($('.f-btn .s-sec span'));
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
     }*/
}
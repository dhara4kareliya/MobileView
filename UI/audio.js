const soundCheckbox = $("#muteCheckbox")[0];
soundCheckbox.addEventListener('click', () => {
    setSoundEnable(!soundCheckbox.checked);
});

let soundEnable = true;
soundCheckbox.checked = true;

function setSoundEnable(value) {
    soundEnable = value;
}
export class Sound {
    constructor() {
        this.m_audioCardDealt = new Audio("./audio/Dealing-cards.wav");

        this.m_audioEndStreet = new Audio("./audio/EndOfStreets.wav");

        this.m_audioFlop = new Audio("./audio/Flop.wav");

        this.m_audioTurnRiver = new Audio("./audio/Turn_river.wav");

        this.m_audioWinnerTakePot = new Audio("./audio/Winner_take_the_pot.wav");

        this.m_audioCall = new Audio("./audio/Actions/call.wav");

        this.m_audioCheck = new Audio("./audio/Actions/check.wav");

        this.m_audioRaise = new Audio("./audio/Actions/Raise.wav");

        this.m_audioAllin = new Audio("./audio/Actions/Allin.wav");

        this.m_audioFold = new Audio("./audio/Actions/Fold.wav");

        this.m_audioTurnTimer = new Audio("./audio/Time_Bank_Ticking.wav");

        this.m_audioWin = new Audio("./audio/win.wav");

        this.m_audioNotification = new Audio("./audio/Notification.wav");

    }

    playCardDealt() {
        if (soundEnable == true)
        this.m_audioCardDealt.play();
    }

    playEndStreet() {
        if (soundEnable == true)
        this.m_audioEndStreet.play();
    }

    playFlop() {
        if (soundEnable == true)
        this.m_audioFlop.play();
    }

    playTurnRiver() {
        if (soundEnable == true)
        this.m_audioTurnRiver.play();
    }

    playWinnerPot() {
        if (soundEnable == true)
        this.m_audioWinnerTakePot.play();
    }

    playCall() {
        if (soundEnable == true)
        this.m_audioCall.play();
    }

    playCheck() {
        if (soundEnable == true)
        this.m_audioCheck.play();
    }

    playRaise() {
        if (soundEnable == true)
        this.m_audioRaise.play();
    }

    playAllin() {
        if (soundEnable == true)
        this.m_audioAllin.play();
    }

    playFold() {
        if (soundEnable == true)
        this.m_audioFold.play();
    }

    playTurnTime(isPlay) {
        if (soundEnable == true){
        if (isPlay) {
            this.m_audioTurnTimer.play();
        } else {
            this.m_audioTurnTimer.pause();
        }
    }

    }

    playWin() {
        if (soundEnable == true)
        this.m_audioWin.play();
    }

    playNotification() {
        if (soundEnable == true)
        this.m_audioNotification.play();
    }

}

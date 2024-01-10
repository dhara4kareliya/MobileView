import './style.css';
import "./services/game-server"
import "./UI/card-ui"
import "./UI/checkbox"
import "./UI/game-ui"
import "./UI/main-ui";
import "./UI/action-ui"
import "./UI/audio"
import "./UI/buyin-ui"
import "./UI/player-ui"
import "./UI/slider"
import "./UI/table-ui"
import "./UI/money-display"
import { getSocket, subscribe } from './socket-client';
import "./services/zoom-communicator";

subscribe("onConnect", () => {
    window.socket = getSocket();
});
var messageData = [];
(async ()=>{
	
	const msgResponse = await fetch(`./messages/msg.json`);
	messageData = await msgResponse.json();
})();

export function getMessage(msg) {
    return messageData[msg] || `Unknown error occurred.`;
}
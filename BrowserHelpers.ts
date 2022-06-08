import { ContentAPI_Socket } from "./Helpers";
import { LiveEvent } from "./Live/LiveEvent";

export class ContentAPI_Browser_Socket extends ContentAPI_Socket<WebSocket> {
	closeSocket() {
		this.socket?.close();
	}

	newSocket(): WebSocket {
		let params = new URLSearchParams();
		params.set("token", this.token);
		if (this.lastId) {
			params.set("lastId", this.lastId.toString());
		}
		const socket = new WebSocket(`${this.api.wsPath}?${params.toString()}`);

		socket.onmessage =
			(event) => {
				try {
					const res = JSON.parse(event.data) as LiveEvent;
					this.onMessage(res);
				} catch (err) {
					console.error(err);
				}
			};

		return socket;
	}

	sendMessage(data: string) {
		this.whenReady(() => {
			this.socket.send(data);
		});
	}
}

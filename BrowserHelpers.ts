import axios from "axios";
import FormData from "form-data";
import { ContentAPI_Session, ContentAPI_Socket } from "./Helpers";
import { LiveEvent } from "./Live/LiveEvent";
import { Content } from "./Views";

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
			this.socket?.send(data);
		});
	}
}

export const uploadFile = async (session: ContentAPI_Session, data: FormData, bucket?: string): Promise<string> => {
	if (bucket) {
		data.append("globalPerms", ".");
		data.append("values[bucket]", bucket);
	}
	const headers = {
		...session.headers,
		"Content-Type": "multipart/form-data",
		...data.getHeaders()
	};
	const res = await axios.post(`${session.api.path}/File`, data, { headers });
	const content = res.data as Content;
	return content.hash;
}
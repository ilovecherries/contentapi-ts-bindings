import axios from "axios";
import { ContentAPI_Session, ContentAPI_Socket } from "./Helpers";
import { LiveEvent } from "./Live/LiveEvent";
import { Content } from "./Views";

export class ContentAPI_Browser_Socket extends ContentAPI_Socket<WebSocket> {
	closeSocket() {
		this.socket?.close();
	}

	newSocket(): WebSocket {
		const params = new URLSearchParams();
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

		socket.onclose = () => { this.onClose(); };
		socket.onerror = (e) => { this.onError(e); };

		return socket;
	}

	sendMessage(data: string) {
		this.whenReady(() => {
			this.socket?.send(data);
		});
	}
}

export const uploadFile = async (session: ContentAPI_Session, imageData: Blob, bucket?: string): Promise<string> => {
	const formData = new FormData();
	formData.append("file", imageData);
	if (bucket) {
		formData.append("globalPerms", ".");
		formData.append("values[bucket]", bucket);
	}
	const headers = {
		...session.headers,
		"Content-Type": "multipart/form-data",
		"Content-Length": imageData.size,
	};
	const res = await axios.post(`${session.api.path}/File`, formData, { headers });
	const data = res.data as Content;
	return data.hash;
};
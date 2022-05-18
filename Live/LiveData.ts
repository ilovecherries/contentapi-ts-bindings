import { LiveEvent, LiveEventType } from "./LiveEvent";
import { WebsocketResponseType } from "./WebSocketResponse";

export interface LiveData {
	optimized?: boolean;
	lastId?: number;
	events?: LiveEvent[];
	objects: Record<WebsocketResponseType, Record<string, Array<object>>>;
}

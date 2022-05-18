import { LiveEvent, LiveEventType } from "./LiveEvent";
import { WebSocketResponseType } from "./WebSocketResponse";

export interface LiveData {
	optimized?: boolean;
	lastId?: number;
	events?: LiveEvent[];
	objects: Record<WebSocketResponseType, Record<string, Array<object>>>;
}

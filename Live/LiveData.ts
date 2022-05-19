import { LiveEvent } from "./LiveEvent";
import { WebSocketResponseType } from "./WebSocketResponse";

export interface LiveData<T = Record<WebSocketResponseType, Record<string, Array<object>>>> {
	optimized?: boolean;
	lastId?: number;
	events?: LiveEvent[];
	objects: T;
}

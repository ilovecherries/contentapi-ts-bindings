import { LiveEvent, LiveEventType } from "./LiveEvent";

export interface LiveData {
	optimized?: boolean;
	lastId?: number;
	events?: LiveEvent[];
	objects: Record<LiveEventType, Record<string, Array<object>>>;
}

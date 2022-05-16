import { LiveEvent } from "./LiveEvent";

export interface LiveData {
	optimized: boolean;
	lastId: number;
	events: LiveEvent[];
	// objects: Record<EventType, Record<string, 
}
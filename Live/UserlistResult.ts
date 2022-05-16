export interface UserlistResult {
	statuses: Record<number, Record<number, string>>;
	// i think this chains users?
	objects: Record<string, Record<string, object>>;
}
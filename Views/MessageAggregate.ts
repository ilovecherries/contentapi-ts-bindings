export interface MessageAggregate {
	contentId: number;
	createUserId: number;
	count: number;
	maxId: number;
	minId: number;
	maxCreateDate: string;
	minCreateDate: string;
}

export class MemeInteractionSummary {
  upvoteCount: number;
  downvoteCount: number;
  reportCount: number;
  flagCount: number;
  netScore: number;
  userInteraction?: { type: string; createdAt: Date };
}

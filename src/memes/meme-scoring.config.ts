/**
 * Meme Scoring Configuration
 *
 * This configuration defines the weights and parameters for calculating
 * sophisticated meme scores based on various interactions and time decay.
 */

export interface MemeScoringConfig {
  /**
   * Weight given to upvotes (positive engagement)
   */
  upvoteWeight: number;

  /**
   * Weight given to downvotes (negative engagement)
   */
  downvoteWeight: number;

  /**
   * Weight given to reports (strong negative signal)
   */
  reportWeight: number;

  /**
   * Weight given to flags (moderate negative signal)
   */
  flagWeight: number;

  /**
   * Time decay factor - controls how quickly old content loses relevance
   * Higher values = faster decay
   * Typical range: 0.1 to 2.0
   */
  timeDecayFactor: number;

  /**
   * Age threshold in hours - content older than this gets more decay
   */
  ageThresholdHours: number;

  /**
   * Minimum score floor - prevents scores from going too negative
   */
  minScore: number;

  /**
   * Recency bonus multiplier for very recent content
   */
  recencyBonusMultiplier: number;

  /**
   * Hours within which to apply recency bonus
   */
  recencyBonusHours: number;
}

/**
 * Default scoring configuration
 *
 * This creates a balanced scoring system where:
 * - Upvotes are highly valued
 * - Downvotes have moderate negative impact
 * - Reports are heavily penalized (spam/inappropriate content)
 * - Time decay ensures fresh content rises
 */
export const DEFAULT_MEME_SCORING_CONFIG: MemeScoringConfig = {
  // Interaction weights
  upvoteWeight: 1.0, // Base unit for positive engagement
  downvoteWeight: -0.5, // Downvotes hurt, but less than upvotes help
  reportWeight: -3.0, // Reports are serious - heavily penalize
  flagWeight: -1.5, // Flags are concerning but less severe than reports

  // Time decay parameters
  timeDecayFactor: 0.5, // Moderate decay - content stays relevant for days
  ageThresholdHours: 48, // Content older than 2 days starts significant decay

  // Score boundaries
  minScore: -100, // Floor to prevent extreme negative scores

  // Recency bonus
  recencyBonusMultiplier: 1.5, // 50% bonus for very fresh content
  recencyBonusHours: 6, // Boost content from last 6 hours
};

/**
 * Trending/Hot scoring configuration
 *
 * This configuration emphasizes recent viral content:
 * - Stronger time decay
 * - Higher recency bonus
 * - More weight on upvotes
 */
export const TRENDING_MEME_SCORING_CONFIG: MemeScoringConfig = {
  upvoteWeight: 1.2,
  downvoteWeight: -0.3,
  reportWeight: -5.0,
  flagWeight: -2.0,
  timeDecayFactor: 1.0, // Faster decay
  ageThresholdHours: 24, // Only last 24 hours matter
  minScore: -50,
  recencyBonusMultiplier: 2.0, // 100% bonus for fresh content
  recencyBonusHours: 3, // Boost ultra-recent content
};

/**
 * All-time best scoring configuration
 *
 * This configuration minimizes time decay to find truly best content:
 * - Minimal time decay
 * - No recency bonus
 * - Pure interaction-based scoring
 */
export const ALLTIME_MEME_SCORING_CONFIG: MemeScoringConfig = {
  upvoteWeight: 1.0,
  downvoteWeight: -0.4,
  reportWeight: -2.0,
  flagWeight: -1.0,
  timeDecayFactor: 0.1, // Very slow decay
  ageThresholdHours: 720, // 30 days before decay starts
  minScore: -200,
  recencyBonusMultiplier: 1.0, // No bonus
  recencyBonusHours: 0,
};

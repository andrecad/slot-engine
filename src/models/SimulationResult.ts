/**
 * SimulationResult - statistics from simulation mode
 */

export interface SimulationResult {
  /**
   * Total number of spins executed
   */
  totalSpins: number;

  /**
   * Number of winning spins
   */
  totalWins: number;

  /**
   * Total credits paid out across all wins
   */
  totalPaidOut: number;

  /**
   * Total credits wagered (spins * bet amount)
   */
  totalWagered: number;

  /**
   * Win rate as percentage (0-100)
   */
  winRate: number;

  /**
   * Return to Player percentage (0-100)
   * RTP = (totalPaidOut / totalWagered) * 100
   */
  rtp: number;

  /**
   * Histogram of payout amounts
   * Key: payout amount, Value: frequency
   */
  payoutDistribution: Map<number, number>;

  /**
   * Largest single win amount
   */
  largestWin: number;

  /**
   * Simulation duration in milliseconds
   */
  duration: number;

  /**
   * Final credit balance after simulation
   */
  finalBalance: number;

  /**
   * Configuration seed used (if deterministic)
   */
  seed?: number;
}

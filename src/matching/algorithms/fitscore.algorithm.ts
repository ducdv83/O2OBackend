import { Job } from '../../jobs/entities/job.entity';
import { CareproProfile } from '../../carepro/entities/carepro-profile.entity';
import { User } from '../../users/entities/user.entity';

export interface FitScoreResult {
  carepro: User;
  profile: CareproProfile;
  fitScore: number;
  breakdown: {
    skills: number;
    timeDistance: number;
    experience: number;
    rating: number;
    price: number;
  };
}

export class FitScoreAlgorithm {
  /**
   * Calculate FitScore for matching CarePro to Job
   * 
   * Weights:
   * - Skills match: 40%
   * - Time availability & distance: 25%
   * - Experience: 15%
   * - Rating: 10%
   * - Price: 10%
   */
  static calculate(
    job: Job,
    carepro: User,
    profile: CareproProfile,
    distanceKm: number,
  ): FitScoreResult {
    const breakdown = {
      skills: this.calculateSkillsScore(job, profile),
      timeDistance: this.calculateTimeDistanceScore(job, distanceKm),
      experience: this.calculateExperienceScore(profile),
      rating: this.calculateRatingScore(profile),
      price: this.calculatePriceScore(job, profile),
    };

    const fitScore =
      breakdown.skills * 0.4 +
      breakdown.timeDistance * 0.25 +
      breakdown.experience * 0.15 +
      breakdown.rating * 0.1 +
      breakdown.price * 0.1;

    return {
      carepro,
      profile,
      fitScore: Math.round(fitScore * 100) / 100, // Round to 2 decimal places
      breakdown,
    };
  }

  /**
   * Skills match score (0-100)
   * Based on how many required skills the CarePro has
   */
  private static calculateSkillsScore(
    job: Job,
    profile: CareproProfile,
  ): number {
    // For now, we'll use service_type matching
    // In a full implementation, you'd parse job requirements
    const hasServiceType = profile.service_types?.includes(job.service_type);
    
    if (hasServiceType) {
      // Check skills overlap (simplified)
      // In real implementation, parse job.description for required skills
      return 80; // Base score if service type matches
    }

    return 20; // Low score if service type doesn't match
  }

  /**
   * Time availability & distance score (0-100)
   * Closer distance = higher score
   * Time availability would be checked separately
   */
  private static calculateTimeDistanceScore(
    job: Job,
    distanceKm: number,
  ): number {
    // Distance scoring: 0km = 100, 10km = 50, 20km+ = 0
    if (distanceKm <= 1) return 100;
    if (distanceKm <= 5) return 90;
    if (distanceKm <= 10) return 70;
    if (distanceKm <= 15) return 50;
    if (distanceKm <= 20) return 30;
    return 10;
  }

  /**
   * Experience score (0-100)
   * More years of experience = higher score
   */
  private static calculateExperienceScore(profile: CareproProfile): number {
    const years = profile.years_exp || 0;
    
    if (years >= 10) return 100;
    if (years >= 5) return 80;
    if (years >= 3) return 60;
    if (years >= 1) return 40;
    return 20;
  }

  /**
   * Rating score (0-100)
   * Higher rating = higher score
   */
  private static calculateRatingScore(profile: CareproProfile): number {
    const rating = profile.rating_avg || 0;
    return rating * 20; // Convert 0-5 rating to 0-100 score
  }

  /**
   * Price score (0-100)
   * CarePro's rate within job budget = higher score
   */
  private static calculatePriceScore(
    job: Job,
    profile: CareproProfile,
  ): number {
    const careproRate = profile.hourly_rate_hint || 0;
    const budgetMin = job.budget_min || 0;
    const budgetMax = job.budget_max || 0;

    if (budgetMin === 0 && budgetMax === 0) {
      return 50; // Neutral score if no budget specified
    }

    if (careproRate >= budgetMin && careproRate <= budgetMax) {
      // Within budget - calculate how close to middle
      const middle = (budgetMin + budgetMax) / 2;
      const distanceFromMiddle = Math.abs(careproRate - middle);
      const range = budgetMax - budgetMin;
      return 100 - (distanceFromMiddle / range) * 50;
    }

    if (careproRate < budgetMin) {
      // Below budget - still acceptable but lower score
      const diff = budgetMin - careproRate;
      const range = budgetMin;
      return Math.max(0, 50 - (diff / range) * 50);
    }

    // Above budget - lower score
    const diff = careproRate - budgetMax;
    const range = budgetMax;
    return Math.max(0, 50 - (diff / range) * 50);
  }
}


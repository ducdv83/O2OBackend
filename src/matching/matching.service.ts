import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Job } from '../jobs/entities/job.entity';
import { CareproProfile } from '../carepro/entities/carepro-profile.entity';
import { User } from '../users/entities/user.entity';
import { FitScoreAlgorithm, FitScoreResult } from './algorithms/fitscore.algorithm';

@Injectable()
export class MatchingService {
  constructor(
    @InjectRepository(Job)
    private jobsRepository: Repository<Job>,
    @InjectRepository(CareproProfile)
    private careproRepository: Repository<CareproProfile>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Get matched CarePros for a job
   */
  async getMatchedCarePros(
    jobId: string,
    limit: number = 20,
  ): Promise<FitScoreResult[]> {
    // Check cache first
    const cacheKey = `matched_carepros:${jobId}`;
    const cached = await this.cacheManager.get<FitScoreResult[]>(cacheKey);
    if (cached) {
      return cached.slice(0, limit);
    }

    const job = await this.jobsRepository.findOne({
      where: { id: jobId },
    });

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (!job.location_point) {
      throw new Error('Job location is required for matching');
    }

    // Get all CarePro profiles
    const careproProfiles = await this.careproRepository.find({
      relations: ['user'],
    });

    // Calculate FitScore for each CarePro
    const results: FitScoreResult[] = [];

    for (const profile of careproProfiles) {
      // Calculate distance (simplified - in production use PostGIS)
      const distanceKm = await this.calculateDistance(job, profile);
      
      // Only consider CarePros within reasonable distance (50km)
      if (distanceKm > 50) continue;

      const fitScore = FitScoreAlgorithm.calculate(
        job,
        profile.user,
        profile,
        distanceKm,
      );

      results.push(fitScore);
    }

    // Sort by FitScore descending
    results.sort((a, b) => b.fitScore - a.fitScore);

    // Cache results for 5 minutes
    await this.cacheManager.set(cacheKey, results, 300);

    return results.slice(0, limit);
  }

  /**
   * Get matched Jobs for a CarePro
   */
  async getMatchedJobs(
    careproId: string,
    limit: number = 20,
  ): Promise<FitScoreResult[]> {
    const cacheKey = `matched_jobs:${careproId}`;
    const cached = await this.cacheManager.get<FitScoreResult[]>(cacheKey);
    if (cached) {
      return cached.slice(0, limit);
    }

    const carepro = await this.usersRepository.findOne({
      where: { id: careproId },
    });

    if (!carepro) {
      throw new NotFoundException('CarePro not found');
    }

    const profile = await this.careproRepository.findOne({
      where: { user_id: careproId },
    });

    if (!profile) {
      throw new NotFoundException('CarePro profile not found');
    }

    // Get open jobs
    const jobs = await this.jobsRepository.find({
      where: { status: 'OPEN' },
      relations: ['client'],
    });

    const results: FitScoreResult[] = [];

    for (const job of jobs) {
      if (!job.location_point) continue;

      const distanceKm = await this.calculateDistance(job, profile);
      
      if (distanceKm > 50) continue;

      const fitScore = FitScoreAlgorithm.calculate(
        job,
        carepro,
        profile,
        distanceKm,
      );

      results.push(fitScore);
    }

    results.sort((a, b) => b.fitScore - a.fitScore);

    await this.cacheManager.set(cacheKey, results, 300);

    return results.slice(0, limit);
  }

  /**
   * Calculate distance between job and CarePro location
   * Simplified version - in production, use PostGIS ST_Distance
   */
  private async calculateDistance(
    job: Job,
    profile: CareproProfile,
  ): Promise<number> {
    // For now, return a mock distance
    // In production, you'd need to store CarePro location and use PostGIS
    // This is a simplified version
    return Math.random() * 20; // Mock: 0-20km
  }
}

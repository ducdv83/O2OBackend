import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable PostGIS extension
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm;`);

    // Create users table
    await queryRunner.query(`
      CREATE TABLE users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        role VARCHAR(16) NOT NULL CHECK (role IN ('CLIENT','CAREPRO','ADMIN')),
        phone VARCHAR(32) UNIQUE NOT NULL,
        email VARCHAR(255),
        password_hash TEXT,
        full_name VARCHAR(255),
        dob DATE,
        gender VARCHAR(16),
        address TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Create carepro_profiles table
    await queryRunner.query(`
      CREATE TABLE carepro_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        bio TEXT,
        years_exp INT DEFAULT 0,
        skills TEXT[],
        certificates TEXT[],
        verified_level INT DEFAULT 0,
        rating_avg NUMERIC(3,2) DEFAULT 0,
        rating_count INT DEFAULT 0,
        hourly_rate_hint INT,
        service_types TEXT[]
      );
    `);

    // Create client_profiles table
    await queryRunner.query(`
      CREATE TABLE client_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        default_address TEXT,
        emergency_contact TEXT
      );
    `);

    // Create jobs table
    await queryRunner.query(`
      CREATE TABLE jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id UUID REFERENCES users(id) ON DELETE SET NULL,
        service_type VARCHAR(64) NOT NULL,
        description TEXT,
        location_point GEOGRAPHY(POINT,4326),
        address TEXT,
        start_time TIMESTAMPTZ,
        end_time TIMESTAMPTZ,
        budget_min INT,
        budget_max INT,
        status VARCHAR(16) NOT NULL CHECK (status IN ('DRAFT','OPEN','BOOKED','DONE','CANCELLED')),
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Create indexes for jobs
    await queryRunner.query(`CREATE INDEX idx_jobs_client ON jobs(client_id);`);
    await queryRunner.query(`CREATE INDEX idx_jobs_status ON jobs(status);`);
    await queryRunner.query(`CREATE INDEX idx_jobs_geo ON jobs USING GIST (location_point);`);

    // Create proposals table
    await queryRunner.query(`
      CREATE TABLE proposals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        carepro_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        proposed_rate INT NOT NULL,
        message TEXT,
        status VARCHAR(16) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACCEPTED','REJECTED')),
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Create indexes for proposals
    await queryRunner.query(`CREATE INDEX idx_proposals_job ON proposals(job_id);`);
    await queryRunner.query(`CREATE INDEX idx_proposals_carepro ON proposals(carepro_id);`);

    // Create bookings table
    await queryRunner.query(`
      CREATE TABLE bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
        carepro_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        agreed_rate INT NOT NULL,
        start_time TIMESTAMPTZ NOT NULL,
        end_time TIMESTAMPTZ NOT NULL,
        status VARCHAR(16) NOT NULL CHECK (status IN ('SCHEDULED','IN_PROGRESS','COMPLETED','DISPUTED','CANCELLED')),
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Create indexes for bookings
    await queryRunner.query(`CREATE INDEX idx_bookings_status ON bookings(status);`);
    await queryRunner.query(`CREATE INDEX idx_bookings_carepro ON bookings(carepro_id);`);

    // Create timesheets table
    await queryRunner.query(`
      CREATE TABLE timesheets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
        checkin_at TIMESTAMPTZ,
        checkout_at TIMESTAMPTZ,
        hours NUMERIC(6,2),
        gps_checkin GEOGRAPHY(POINT,4326),
        gps_checkout GEOGRAPHY(POINT,4326),
        client_confirmed BOOLEAN DEFAULT FALSE
      );
    `);

    // Create payments table
    await queryRunner.query(`
      CREATE TABLE payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        amount INT NOT NULL,
        method VARCHAR(16) NOT NULL,
        escrow_status VARCHAR(16) NOT NULL CHECK (escrow_status IN ('HELD','RELEASED','REFUNDED')),
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Create reviews table
    await queryRunner.query(`
      CREATE TABLE reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        rater_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        ratee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INT CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Create index for reviews
    await queryRunner.query(`CREATE INDEX idx_reviews_ratee ON reviews(ratee_id);`);

    // Create messages table
    await queryRunner.query(`
      CREATE TABLE messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        body TEXT NOT NULL,
        sent_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Create verifications table
    await queryRunner.query(`
      CREATE TABLE verifications (
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(8) NOT NULL CHECK (type IN ('ID','CERT')),
        status VARCHAR(16) NOT NULL CHECK (status IN ('PENDING','APPROVED','REJECTED')),
        file_url TEXT,
        verified_at TIMESTAMPTZ,
        PRIMARY KEY (user_id, type)
      );
    `);

    // Create payouts table
    await queryRunner.query(`
      CREATE TABLE payouts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INT NOT NULL,
        bank_info_id UUID,
        status VARCHAR(16) NOT NULL CHECK (status IN ('REQUESTED','PROCESSING','PAID','FAILED')),
        requested_at TIMESTAMPTZ DEFAULT now(),
        processed_at TIMESTAMPTZ
      );
    `);

    // Create disputes table
    await queryRunner.query(`
      CREATE TABLE disputes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
        opened_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reason TEXT NOT NULL,
        evidence_urls TEXT[],
        status VARCHAR(16) NOT NULL CHECK (status IN ('OPEN','RESOLVED','REJECTED')),
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `);

    // Create full-text search indexes
    await queryRunner.query(`CREATE INDEX idx_carepro_skills_gin ON carepro_profiles USING GIN (skills);`);
    await queryRunner.query(`CREATE INDEX idx_jobs_desc_gin ON jobs USING GIN (description gin_trgm_ops);`);

    // Create roles table (RBAC minimal)
    await queryRunner.query(`
      CREATE TABLE roles (
        key VARCHAR(32) PRIMARY KEY,
        desc TEXT
      );
    `);

    await queryRunner.query(`
      INSERT INTO roles(key, desc) VALUES 
        ('CLIENT','Client user'),
        ('CAREPRO','Care provider'),
        ('ADMIN','Administrator')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS disputes;`);
    await queryRunner.query(`DROP TABLE IF EXISTS payouts;`);
    await queryRunner.query(`DROP TABLE IF EXISTS verifications;`);
    await queryRunner.query(`DROP TABLE IF EXISTS messages;`);
    await queryRunner.query(`DROP TABLE IF EXISTS reviews;`);
    await queryRunner.query(`DROP TABLE IF EXISTS payments;`);
    await queryRunner.query(`DROP TABLE IF EXISTS timesheets;`);
    await queryRunner.query(`DROP TABLE IF EXISTS bookings;`);
    await queryRunner.query(`DROP TABLE IF EXISTS proposals;`);
    await queryRunner.query(`DROP TABLE IF EXISTS jobs;`);
    await queryRunner.query(`DROP TABLE IF EXISTS client_profiles;`);
    await queryRunner.query(`DROP TABLE IF EXISTS carepro_profiles;`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);
  }
}


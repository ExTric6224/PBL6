import prisma from '../db/client';

/**
 * Cleanup expired email verification records
 * Should be run periodically (e.g., cron job every hour)
 */
export async function cleanupExpiredVerifications() {
  try {
    const result = await prisma.emailVerification.deleteMany({
      where: {
        OR: [
          {
            expiresAt: {
              lt: new Date(),
            },
          },
          // Also cleanup records older than 24 hours regardless of expiry
          {
            createdAt: {
              lt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
    });

    console.log(`🧹 Cleaned up ${result.count} expired verification records`);
    return result.count;
  } catch (error) {
    console.error('Failed to cleanup expired verifications:', error);
    throw error;
  }
}

/**
 * Get verification statistics
 */
export async function getVerificationStats() {
  try {
    const stats = await prisma.emailVerification.aggregate({
      _count: {
        id: true,
      },
    });

    const expiredCount = await prisma.emailVerification.count({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return {
      total: stats._count.id,
      expired: expiredCount,
      active: stats._count.id - expiredCount,
    };
  } catch (error) {
    console.error('Failed to get verification stats:', error);
    throw error;
  }
}
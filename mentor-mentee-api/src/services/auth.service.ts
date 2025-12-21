import prisma from '../db/client';
import { hashPassword, comparePassword } from '../utils/password';
import { signToken } from '../utils/jwt';
import { RegisterDto, LoginDto } from '../schemas/auth.schema';

export class AuthService {
  async register(data: RegisterDto) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('Người dùng đã tồn tại');
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Look up the Role record by name to get roleId
    const roleRecord = await prisma.role.findUnique({
      where: { name: data.role },
    });

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        role: data.role,
        roleId: roleRecord?.id, // Set roleId from RBAC Role table
        updatedAt: new Date(),
      },
      select: {
        id: true,
        email: true,
        role: true,
        roleId: true,
        createdAt: true,
      },
    });

    // Generate JWT token for new user
    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  async login(data: LoginDto) {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new Error('Thông tin đăng nhập không đúng');
    }

    // Verify password
    const isValidPassword = await comparePassword(data.password, user.password);
    if (!isValidPassword) {
      throw new Error('Thông tin đăng nhập không đúng');
    }

    // Generate JWT token
    const token = signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const { password, ...userWithoutPassword } = user;

    return { user: userWithoutPassword, token };
  }

  async getCurrentUser(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        mentorprofile: true,
        menteeprofile: true,
        roleId: true,
      },
    });

    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    // Get user permissions from RBAC
    let permissions: string[] = [];
    if (user.roleId) {
      const rolePermissions = await prisma.rolePermission.findMany({
        where: { roleId: user.roleId },
        include: { permission: true },
      });
      permissions = rolePermissions.map(rp => rp.permission.code);
    }

    return { ...user, permissions };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Không tìm thấy người dùng');
    }

    // Verify current password
    const isValidPassword = await comparePassword(currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Mật khẩu hiện tại không đúng');
    }

    // Check if new password is different
    if (currentPassword === newPassword) {
      throw new Error('Mật khẩu mới phải khác mật khẩu hiện tại');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedPassword,
        updatedAt: new Date(),
      },
    });

    return { message: 'Password changed successfully' };
  }
}

/**
 * 个人控制台页面 - ThinkTree v3.2.2
 * 用户登录后的主工作台，使用 CreationHub 组件
 */
import DashboardClient from '../../components/DashboardClient';

// 模拟的初始数据
const mockInitialData = {
  user: {
    id: 'mock-user-id',
    display_name: '测试用户',
    email: 'test@example.com',
    credits: 100,
  },
  projects: [
    { id: '1', title: '项目一', updated_at: '2023-10-27T10:00:00.000Z' },
    { id: '2', title: '项目二', updated_at: '2023-10-26T12:30:00.000Z' },
    { id: '3', title: '项目三', updated_at: '2023-10-25T15:45:00.000Z' },
  ],
};

export default async function DashboardPage() {
  // 暂时使用模拟数据
  const initialData = mockInitialData;

  return <DashboardClient initialData={initialData} />;
}
/**
 * 个人控制台页面 - ThinkTree v3.2.2
 * 用户登录后的主工作台，使用 CreationHub 组件
 */
import DashboardClient from '../../components/DashboardClient';

export default async function DashboardPage() {
  // 不传入初始数据，让DashboardClient组件自己获取真实数据
  return <DashboardClient />;
}
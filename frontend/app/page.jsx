// frontend/app/page.jsx

// 引入我们刚刚创建的组件
import LandingPage from '../components/LandingPage';
import CreationHub from '../components/CreationHub';

export default function HomePage() {
  // --- 在这里切换你想预览的页面 ---

  // 想看“未登录”的营销首页，就用下面这行:
  return <LandingPage />;

  // 想看“已登录”的工作台页面，就注释掉上面一行，然后用下面这行:
  // return <CreationHub />;
}
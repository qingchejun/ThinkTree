'use client';
import { useRouter } from 'next/navigation';

const CreditAlert = ({ isVisible, onClose, requiredCredits = 0 }) => {
  const router = useRouter();

  if (!isVisible) return null;

  const handleNavigateToInvitations = () => {
    router.push('/settings?tab=invitations');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* 图标和标题 */}
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
            <span className="text-2xl">💰</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">积分不足</h3>
            <p className="text-sm text-gray-500">无法完成此操作</p>
          </div>
        </div>

        {/* 内容 */}
        <div className="mb-6">
          <p className="text-gray-700">
            {requiredCredits > 0 
              ? `此操作需要 ${requiredCredits.toLocaleString()} 积分，但您当前积分不足。`
              : '您当前的积分余额不足以完成此操作。'
            }
          </p>
          <p className="text-gray-600 mt-2">
            您可以通过邀请好友获得更多积分，每成功邀请一位朋友可获得额外积分奖励！
          </p>
        </div>

        {/* 按钮 */}
        <div className="flex space-x-3">
          <button
            onClick={handleNavigateToInvitations}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            邀请好友获得积分
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            稍后再说
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreditAlert;
import React, { useState, useEffect } from 'react';
import {
  Shield, UserCheck, UserX, Search, AlertCircle,
  CheckCircle, Users, XCircle
} from 'lucide-react';
import { UserStore } from '@/data/userStore';
import type { Auditor } from '@/data/userStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const AdminAuditorMgmt: React.FC = () => {
  const [users, setUsers] = useState<Array<Awaited<ReturnType<typeof UserStore.getUsers>>[0]>>([]);
  const [auditors, setAuditors] = useState<Auditor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Awaited<ReturnType<typeof UserStore.getUsers>>[0] | null>(null);
  const [action, setAction] = useState<'assign' | 'remove'>('assign');
  const [message, setMessage] = useState('');

  const isSysAdmin = UserStore.isSysAdmin();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allUsers = await UserStore.getUsers();
    setUsers(allUsers);
    setAuditors(await UserStore.getAuditors());
  };

  const handleAssign = async () => {
    if (!selectedUser) return;
    const result = await UserStore.assignAuditor(selectedUser.id);
    setMessage(result.message);
    if (result.success) {
      await loadData();
    }
    setIsConfirmOpen(false);
  };

  const handleRemove = async () => {
    if (!selectedUser) return;
    const result = await UserStore.removeAuditor(selectedUser.id);
    setMessage(result.message);
    if (result.success) {
      await loadData();
    }
    setIsConfirmOpen(false);
  };

  const openConfirm = (user: Awaited<ReturnType<typeof UserStore.getUsers>>[0], actionType: 'assign' | 'remove') => {
    setSelectedUser(user);
    setAction(actionType);
    setIsConfirmOpen(true);
  };

  const filteredUsers = searchQuery
    ? users.filter(
        (u) =>
          u.name.includes(searchQuery) ||
          u.phone.includes(searchQuery)
      )
    : users;

  const isAuditor = (userId: string) => auditors.some((a) => a.userId === userId);

  if (!isSysAdmin) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-ocean-deep mb-2">无权访问</h2>
        <p className="text-gray-500">仅系统管理者可配置审核员</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ocean-deep">审核员管理</h1>
          <p className="text-gray-500">设置用户为审核员，授权审核对公转账凭证</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-ocean-blue/10 rounded-xl">
            <Shield className="w-5 h-5 text-ocean-blue" />
            <span className="text-sm text-ocean-blue font-medium">
              当前审核员：{auditors.length} 人
            </span>
          </div>
        </div>
      </div>

      {/* Current Auditors */}
      {auditors.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="font-bold text-ocean-deep mb-4 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-ocean-blue" />
            当前审核员列表
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {auditors.map((auditor) => (
              <div key={auditor.userId} className="p-4 border rounded-xl bg-ocean-blue/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ocean-deep">{auditor.userName}</p>
                    <p className="text-sm text-gray-500">{auditor.userPhone}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      由 {auditor.assignedByName} 于 {new Date(auditor.assignedAt).toLocaleDateString('zh-CN')} 设置
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const user = users.find((u) => u.id === auditor.userId);
                      if (user) openConfirm(user, 'remove');
                    }}
                    className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                    title="移除审核员权限"
                  >
                    <UserX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User List */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-bold text-ocean-deep mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-ocean-blue" />
          用户列表
        </h2>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索用户名或手机号..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">用户</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">手机号</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">注册时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">角色</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((user) => {
                const userIsAuditor = isAuditor(user.id);
                return (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-ocean-deep">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.phone}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString('zh-CN')}
                    </td>
                    <td className="px-4 py-3">
                      {userIsAuditor ? (
                        <span className="px-2 py-1 rounded-full text-xs bg-ocean-blue/10 text-ocean-blue">
                          审核员
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-500">
                          普通用户
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {userIsAuditor ? (
                        <button
                          onClick={() => openConfirm(user, 'remove')}
                          className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1"
                        >
                          <UserX className="w-4 h-4" />
                          移除权限
                        </button>
                      ) : (
                        <button
                          onClick={() => openConfirm(user, 'assign')}
                          className="text-sm text-ocean-blue hover:text-ocean-deep flex items-center gap-1"
                        >
                          <UserCheck className="w-4 h-4" />
                          设为审核员
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            暂无用户
          </div>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className="fixed bottom-4 right-4 bg-ocean-deep text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {message}
          <button onClick={() => setMessage('')} className="ml-2 text-white/70 hover:text-white">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Confirm Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {action === 'assign' ? '设置审核员' : '移除审核员'}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {selectedUser && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="font-medium text-ocean-deep">{selectedUser.name}</p>
                <p className="text-sm text-gray-500">{selectedUser.phone}</p>
              </div>
            )}
            {action === 'assign' ? (
              <p className="mt-4 text-sm text-gray-600">
                确认将该用户设置为审核员？设置后，该用户将拥有审核对公转账凭证的权限。
              </p>
            ) : (
              <p className="mt-4 text-sm text-gray-600">
                确认移除该用户的审核员权限？移除后，该用户将无法再审核凭证。
              </p>
            )}
          </div>
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              取消
            </Button>
            <Button
              onClick={action === 'assign' ? handleAssign : handleRemove}
              className={action === 'assign' ? 'bg-ocean-blue hover:bg-ocean-deep' : 'bg-red-500 hover:bg-red-600'}
            >
              确认
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAuditorMgmt;

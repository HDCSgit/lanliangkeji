import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Edit2, Trash2, X } from 'lucide-react';
import { AddressStore } from '@/data/ecommerceStore';
import type { ShippingAddress } from '@/types/ecommerce';

interface AddressManagerProps {
  onSelect?: (address: ShippingAddress) => void;
  selectedId?: string;
}

const AddressManager: React.FC<AddressManagerProps> = ({ onSelect, selectedId }) => {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAddress, setEditingAddress] = useState<ShippingAddress | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    province: '',
    city: '',
    district: '',
    detail: '',
    isDefault: false,
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    setAddresses(await AddressStore.get());
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: false,
    });
    setEditingAddress(null);
  };

  const openCreate = () => {
    resetForm();
    setIsEditing(true);
  };

  const openEdit = (address: ShippingAddress) => {
    setEditingAddress(address);
    setFormData({
      name: address.name,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      detail: address.detail,
      isDefault: address.isDefault,
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone || !formData.detail) return;

    const address: ShippingAddress = {
      id: editingAddress?.id || Date.now().toString(),
      ...formData,
      createdAt: editingAddress?.createdAt || new Date().toISOString(),
    };

    if (editingAddress) {
      await AddressStore.update(address);
    } else {
      await AddressStore.add(address);
    }

    await loadAddresses();
    setIsEditing(false);
    resetForm();
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这个地址吗？')) {
      await AddressStore.remove(id);
      await loadAddresses();
    }
  };

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <div
          key={address.id}
          className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
            selectedId === address.id
              ? 'border-ocean-blue bg-ocean-blue/5'
              : 'border-gray-200 hover:border-ocean-blue/50'
          }`}
          onClick={() => onSelect?.(address)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-ocean-blue mt-1" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ocean-deep">{address.name}</span>
                  <span className="text-gray-500">{address.phone}</span>
                  {address.isDefault && (
                    <span className="px-2 py-0.5 bg-ocean-blue/10 text-ocean-blue text-xs rounded-full">
                      默认
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mt-1">
                  {address.province} {address.city} {address.district} {address.detail}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(address);
                }}
                className="p-2 text-gray-400 hover:text-ocean-blue hover:bg-ocean-blue/10 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(address.id);
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}

      {addresses.length === 0 && !isEditing && (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>暂无收货地址</p>
        </div>
      )}

      {!isEditing && (
        <button
          onClick={openCreate}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-ocean-blue hover:text-ocean-blue transition-colors"
        >
          <Plus className="w-5 h-5" />
          添加收货地址
        </button>
      )}

      {/* Edit Form */}
      {isEditing && (
        <div className="p-6 bg-gray-50 rounded-xl space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-ocean-deep">
              {editingAddress ? '编辑地址' : '添加地址'}
            </h3>
            <button
              onClick={() => {
                setIsEditing(false);
                resetForm();
              }}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="收件人姓名 *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
            />
            <input
              type="tel"
              placeholder="手机号码 *"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="省"
              value={formData.province}
              onChange={(e) => setFormData({ ...formData, province: e.target.value })}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
            />
            <input
              type="text"
              placeholder="市"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
            />
            <input
              type="text"
              placeholder="区/县"
              value={formData.district}
              onChange={(e) => setFormData({ ...formData, district: e.target.value })}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
            />
          </div>

          <input
            type="text"
            placeholder="详细地址 *"
            value={formData.detail}
            onChange={(e) => setFormData({ ...formData, detail: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-ocean-blue focus:outline-none"
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isDefault}
              onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
              className="w-4 h-4 text-ocean-blue rounded"
            />
            <span className="text-sm text-gray-600">设为默认地址</span>
          </label>

          <button
            onClick={handleSave}
            className="w-full py-3 bg-ocean-blue text-white rounded-lg hover:bg-ocean-deep transition-colors"
          >
            {editingAddress ? '保存修改' : '添加地址'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AddressManager;

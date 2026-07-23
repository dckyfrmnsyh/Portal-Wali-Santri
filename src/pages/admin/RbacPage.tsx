import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface Role {
  id: string;
  name: string;
  description: string;
}

interface Permission {
  id: string;
  code: string;
  description: string;
  module: string;
}

interface RolePermission {
  role_id: string;
  permission_id: string;
}

export const RbacPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: rolesData, error: rolesError } = await supabase.from('roles').select('*');
      if (rolesError) throw rolesError;
      setRoles(rolesData);

      const { data: permsData, error: permsError } = await supabase.from('permissions').select('*');
      if (permsError) throw permsError;
      setPermissions(permsData);

      const { data: rpData, error: rpError } = await supabase.from('role_permissions').select('*');
      if (rpError) throw rpError;
      setRolePermissions(rpData);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePermissionChange = async (roleId: string, permissionId: string, hasPermission: boolean) => {
    setIsLoading(true);
    try {
      if (hasPermission) {
        // Add permission
        const { error } = await supabase.from('role_permissions').insert([{ role_id: roleId, permission_id: permissionId }]);
        if (error) throw error;
      } else {
        // Remove permission
        const { error } = await supabase.from('role_permissions').delete().match({ role_id: roleId, permission_id: permissionId });
        if (error) throw error;
      }
      // Reload role_permissions to reflect changes
      const { data: rpData, error: rpError } = await supabase.from('role_permissions').select('*');
      if (rpError) throw rpError;
      setRolePermissions(rpData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModulePermissionAction = async (roleId: string, perms: Permission[], action: 'select_all' | 'deselect_all') => {
    setIsLoading(true);
    try {
      const permIds = perms.map(p => p.id);
      
      if (action === 'select_all') {
        // Find permissions not already present
        const currentRPs = rolePermissions.filter(rp => rp.role_id === roleId).map(rp => rp.permission_id);
        const toAdd = permIds.filter(id => !currentRPs.includes(id));
        
        if (toAdd.length > 0) {
          const insertData = toAdd.map(id => ({ role_id: roleId, permission_id: id }));
          const { error } = await supabase.from('role_permissions').insert(insertData);
          if (error) throw error;
        }
      } else {
        // Remove all matching permissions for this role
        const { error } = await supabase
          .from('role_permissions')
          .delete()
          .eq('role_id', roleId)
          .in('permission_id', permIds);
        if (error) throw error;
      }
      
      // Reload role_permissions
      const { data: rpData, error: rpError } = await supabase.from('role_permissions').select('*');
      if (rpError) throw rpError;
      setRolePermissions(rpData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const groupedPermissions = permissions.reduce((acc, p) => {
    if (!acc[p.module]) {
      acc[p.module] = [];
    }
    acc[p.module].push(p);
    return acc;
  }, {} as Record<string, Permission[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-green-950 font-serif">Manajemen Hak Akses (RBAC)</h2>
        <p className="text-xs text-slate-500 mt-0.5">Atur izin akses untuk setiap peran pengguna di sistem.</p>
      </div>

      {error && <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold">{error}</div>}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Daftar Peran */}
        <div className="lg:col-span-1">
          <Card title="Daftar Peran">
            {isLoading && roles.length === 0 ? <p className="text-sm text-slate-400">Memuat...</p> : (
              <div className="space-y-2">
                {roles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedRole?.id === role.id 
                        ? 'bg-brand-green-800 text-white border-brand-green-900 shadow-sm' 
                        : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-slate-100/75'
                    }`}
                  >
                    <p className={`font-bold text-sm ${selectedRole?.id === role.id ? 'text-white' : 'text-slate-800'}`}>{role.name}</p>
                    <p className={`text-xs mt-1 leading-relaxed ${selectedRole?.id === role.id ? 'text-emerald-100' : 'text-slate-500'}`}>{role.description}</p>
                  </button>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Kolom Daftar Izin */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <Card title={`Pengaturan Izin: ${selectedRole.name}`} subtitle="Centang atau gunakan aksi cepat untuk mengelola izin per modul">
              <div className="space-y-6">
                {Object.entries(groupedPermissions).map(([moduleName, perms]) => {
                  const currentRPs = rolePermissions.filter(rp => rp.role_id === selectedRole.id).map(rp => rp.permission_id);
                  const isAllSelected = perms.every(p => currentRPs.includes(p.id));
                  const isNoneSelected = perms.every(p => !currentRPs.includes(p.id));
                  
                  return (
                    <div key={moduleName} className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2.5">
                        <h4 className="font-bold text-sm text-slate-800 capitalize flex items-center gap-1.5">
                          <span className="w-1.5 h-3.5 bg-brand-green-800 rounded-xs" />
                          Modul {moduleName.replace(/_/g, ' ')}
                        </h4>
                        
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleModulePermissionAction(selectedRole.id, perms, 'select_all')}
                            disabled={isAllSelected || isLoading}
                            className="text-[10px] font-bold text-brand-green-900 hover:underline disabled:opacity-40"
                          >
                            Pilih Semua
                          </button>
                          <span className="text-slate-300 text-[10px]">•</span>
                          <button
                            type="button"
                            onClick={() => handleModulePermissionAction(selectedRole.id, perms, 'deselect_all')}
                            disabled={isNoneSelected || isLoading}
                            className="text-[10px] font-bold text-rose-600 hover:underline disabled:opacity-40"
                          >
                            Hapus Semua
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                        {perms.map(perm => {
                          const hasPermission = currentRPs.includes(perm.id);
                          return (
                            <label key={perm.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white hover:shadow-xs transition-all cursor-pointer">
                              <input
                                type="checkbox"
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-green-850 focus:ring-brand-green-800 cursor-pointer"
                                checked={hasPermission}
                                onChange={(e) => handlePermissionChange(selectedRole.id, perm.id, e.target.checked)}
                                disabled={isLoading}
                              />
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-700">{perm.description}</span>
                                <span className="text-[10px] text-slate-400 font-mono mt-0.5">{perm.code}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-16 space-y-2">
                <div className="mx-auto w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center text-slate-400">
                  🛡️
                </div>
                <p className="font-bold text-sm text-slate-700">Pilih Peran Terlebih Dahulu</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">Silakan pilih salah satu peran di panel kiri untuk mengatur izin modul keamanan.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

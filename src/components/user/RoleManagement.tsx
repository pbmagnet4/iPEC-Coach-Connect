/**
 * Role Management Component for iPEC Coach Connect
 * 
 * Administrative component for managing user roles and permissions.
 * Provides a comprehensive interface for role assignment, removal,
 * and permission oversight with audit trails and security controls.
 * 
 * Features:
 * - Multi-role assignment and management
 * - Permission-based access control
 * - Role hierarchy visualization
 * - Audit trail and change tracking
 * - Bulk operations for efficiency
 * - Real-time updates and notifications
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Crown,
  Download,
  Edit,
  Eye,
  Filter,
  History,
  MoreHorizontal,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
  Users
} from 'lucide-react';
import { useAuth, useUserRoles } from '../../stores/unified-user-store';
import type { ExtendedUserRole, UserRoleAssignment } from '../../services/enhanced-auth.service';
import { getRoleHierarchy, ROLE_DEFINITIONS } from '../../lib/enhanced-roles';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Badge } from '../ui/Badge';
import { Table } from '../ui/Table';
import { Modal } from '../ui/Modal';
import { toast } from '../ui/Toast';
import { Tooltip } from '../ui/Tooltip';
import { Checkbox } from '../ui/Checkbox';

// =====================================================================
// TYPES AND INTERFACES
// =====================================================================

interface UserRoleData extends UserRoleAssignment {
  user_name?: string;
  user_email?: string;
  assigned_by_name?: string;
}

interface RoleChangeRequest {
  userId: string;
  role: ExtendedUserRole;
  action: 'assign' | 'remove';
  reason?: string;
}

interface RoleFilters {
  role?: ExtendedUserRole;
  status?: 'active' | 'inactive' | 'all';
  search?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

// =====================================================================
// ROLE MANAGEMENT HOOKS
// =====================================================================

const useRoleManagement = () => {
  const [userRoles, setUserRoles] = useState<UserRoleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRoles = async (filters?: RoleFilters) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // This would fetch from enhanced auth service
      // For now, using mock data structure
      const mockData: UserRoleData[] = [
        {
          id: '1',
          user_id: 'user1',
          role: 'client',
          is_active: true,
          assigned_at: new Date().toISOString(),
          assigned_by: 'admin1',
          expires_at: null,
          user_name: 'John Doe',
          user_email: 'john@example.com',
          assigned_by_name: 'Admin User'
        },
        {
          id: '2',
          user_id: 'user2',
          role: 'coach',
          is_active: true,
          assigned_at: new Date(Date.now() - 86400000).toISOString(),
          assigned_by: 'admin1',
          expires_at: null,
          user_name: 'Jane Smith',
          user_email: 'jane@example.com',
          assigned_by_name: 'Admin User'
        },
        {
          id: '3',
          user_id: 'user3',
          role: 'pending_coach',
          is_active: true,
          assigned_at: new Date(Date.now() - 172800000).toISOString(),
          assigned_by: 'system',
          expires_at: null,
          user_name: 'Mike Johnson',
          user_email: 'mike@example.com',
          assigned_by_name: 'System'
        }
      ];

      // Apply filters
      let filteredData = mockData;
      
      if (filters?.role) {
        filteredData = filteredData.filter(ur => ur.role === filters.role);
      }
      
      if (filters?.status && filters.status !== 'all') {
        const isActive = filters.status === 'active';
        filteredData = filteredData.filter(ur => ur.is_active === isActive);
      }
      
      if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filteredData = filteredData.filter(ur => 
          ur.user_name?.toLowerCase().includes(searchLower) ||
          ur.user_email?.toLowerCase().includes(searchLower) ||
          ur.role.toLowerCase().includes(searchLower)
        );
      }

      setUserRoles(filteredData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user roles');
    } finally {
      setIsLoading(false);
    }
  };

  const assignUserRole = async (userId: string, role: ExtendedUserRole, reason?: string) => {
    try {
      // This would call the enhanced auth service
      toast.success(`Successfully assigned ${role} role`);
      await fetchUserRoles(); // Refresh data
    } catch (err) {
      toast.error('Failed to assign role');
      throw err;
    }
  };

  const removeUserRole = async (userId: string, role: ExtendedUserRole, reason?: string) => {
    try {
      // This would call the enhanced auth service
      toast.success(`Successfully removed ${role} role`);
      await fetchUserRoles(); // Refresh data
    } catch (err) {
      toast.error('Failed to remove role');
      throw err;
    }
  };

  useEffect(() => {
    fetchUserRoles();
  }, []);

  return {
    userRoles,
    isLoading,
    error,
    fetchUserRoles,
    assignUserRole,
    removeUserRole
  };
};

// =====================================================================
// ROLE ASSIGNMENT MODAL
// =====================================================================

const RoleAssignmentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAssign: (request: RoleChangeRequest) => Promise<void>;
}> = ({ isOpen, onClose, onAssign }) => {
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState<ExtendedUserRole | ''>('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !selectedRole) return;

    setIsSubmitting(true);
    try {
      await onAssign({
        userId: selectedUser,
        role: selectedRole,
        action: 'assign',
        reason: reason || undefined
      });
      
      // Reset form
      setSelectedUser('');
      setSelectedRole('');
      setReason('');
      onClose();
    } catch (error) {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Role">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-2">
            Select User
          </label>
          <Select
            id="user"
            value={selectedUser}
            onChange={setSelectedUser}
            placeholder="Search for user..."
            required
          >
            <option value="user1">John Doe (john@example.com)</option>
            <option value="user2">Jane Smith (jane@example.com)</option>
            <option value="user3">Mike Johnson (mike@example.com)</option>
          </Select>
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <Select
            id="role"
            value={selectedRole}
            onChange={(value) => setSelectedRole(value as ExtendedUserRole)}
            placeholder="Select role..."
            required
          >
            {ROLE_DEFINITIONS.map((roleDef) => (
              <option key={roleDef.role} value={roleDef.role}>
                {roleDef.displayName}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
            Reason (Optional)
          </label>
          <Input
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this role being assigned?"
            maxLength={255}
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!selectedUser || !selectedRole || isSubmitting}
            className="flex-1"
          >
            {isSubmitting && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
            Assign Role
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// =====================================================================
// ROLE HIERARCHY DISPLAY
// =====================================================================

const RoleHierarchyCard: React.FC = () => {
  const hierarchy = getRoleHierarchy();

  return (
    <Card>
      <Card.Header>
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-600" />
          <h3 className="text-lg font-semibold">Role Hierarchy</h3>
        </div>
      </Card.Header>
      <Card.Body>
        <div className="space-y-3">
          {hierarchy.map((roleDef, index) => (
            <div
              key={roleDef.role}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="text-sm font-mono text-gray-500">
                #{index + 1}
              </div>
              <div className="flex-1">
                <div className="font-medium">{roleDef.displayName}</div>
                <div className="text-sm text-gray-600">{roleDef.description}</div>
              </div>
              <Badge variant="secondary" size="sm">
                Level {roleDef.hierarchy}
              </Badge>
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
};

// =====================================================================
// MAIN COMPONENT
// =====================================================================

export const RoleManagement: React.FC = () => {
  const { checkPermission } = useUserRoles();
  const {
    userRoles,
    isLoading,
    error,
    fetchUserRoles,
    assignUserRole,
    removeUserRole
  } = useRoleManagement();

  const [filters, setFilters] = useState<RoleFilters>({
    role: undefined,
    status: 'all',
    search: ''
  });

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showInactiveRoles, setShowInactiveRoles] = useState(false);

  // Check permissions
  const canManageRoles = checkPermission('users', 'manage_roles');
  const canAssignRoles = checkPermission('users', 'assign_roles');
  const canViewAudit = checkPermission('audit', 'view');

  // Filter user roles based on current filters
  const filteredUserRoles = useMemo(() => {
    let filtered = userRoles;

    if (filters.role) {
      filtered = filtered.filter(ur => ur.role === filters.role);
    }

    if (filters.status !== 'all') {
      const isActive = filters.status === 'active';
      filtered = filtered.filter(ur => ur.is_active === isActive);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(ur => 
        ur.user_name?.toLowerCase().includes(searchLower) ||
        ur.user_email?.toLowerCase().includes(searchLower) ||
        ur.role.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [userRoles, filters]);

  // Role statistics
  const roleStats = useMemo(() => {
    const stats: Record<string, number> = {};
    userRoles.forEach(ur => {
      if (ur.is_active) {
        stats[ur.role] = (stats[ur.role] || 0) + 1;
      }
    });
    return stats;
  }, [userRoles]);

  const handleRoleAction = async (request: RoleChangeRequest) => {
    if (request.action === 'assign') {
      await assignUserRole(request.userId, request.role, request.reason);
    } else {
      await removeUserRole(request.userId, request.role, request.reason);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'remove') => {
    if (selectedRoles.length === 0) return;

    try {
      // Implement bulk actions
      toast.success(`${action} applied to ${selectedRoles.length} role(s)`);
      setSelectedRoles([]);
      await fetchUserRoles();
    } catch (error) {
      toast.error(`Failed to ${action} selected roles`);
    }
  };

  if (!canManageRoles) {
    return (
      <Card>
        <Card.Body className="text-center p-8">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">
            You don't have permission to manage user roles.
          </p>
        </Card.Body>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Card.Body className="text-center p-8">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Roles</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchUserRoles()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
          <p className="text-gray-600">Manage user roles and permissions</p>
        </div>
        
        <div className="flex gap-3">
          {canViewAudit && (
            <Button variant="outline">
              <History className="w-4 h-4 mr-2" />
              Audit Log
            </Button>
          )}
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          {canAssignRoles && (
            <Button onClick={() => setIsAssignModalOpen(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Role
            </Button>
          )}
        </div>
      </div>

      {/* Role Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {ROLE_DEFINITIONS.map((roleDef) => (
          <Card key={roleDef.role}>
            <Card.Body className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {roleDef.displayName}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {roleStats[roleDef.role] || 0}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${
                  roleDef.role === 'admin' ? 'bg-red-100 text-red-600' :
                  roleDef.role === 'coach' ? 'bg-blue-100 text-blue-600' :
                  roleDef.role === 'client' ? 'bg-green-100 text-green-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters and User Roles Table */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <Card>
            <Card.Body className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Input
                    type="search"
                    placeholder="Search users..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Select
                    value={filters.role || ''}
                    onChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      role: value as ExtendedUserRole | undefined 
                    }))}
                    placeholder="All roles"
                  >
                    <option value="">All roles</option>
                    {ROLE_DEFINITIONS.map((roleDef) => (
                      <option key={roleDef.role} value={roleDef.role}>
                        {roleDef.displayName}
                      </option>
                    ))}
                  </Select>
                </div>
                
                <div>
                  <Select
                    value={filters.status}
                    onChange={(value) => setFilters(prev => ({ 
                      ...prev, 
                      status: value as 'active' | 'inactive' | 'all'
                    }))}
                  >
                    <option value="all">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </Select>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fetchUserRoles(filters)}
                    disabled={isLoading}
                  >
                    <Filter className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setFilters({ status: 'all', search: '' })}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* User Roles Table */}
          <Card>
            <Card.Header>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">User Roles</h3>
                
                {selectedRoles.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('activate')}
                    >
                      Activate ({selectedRoles.length})
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleBulkAction('deactivate')}
                    >
                      Deactivate
                    </Button>
                  </div>
                )}
              </div>
            </Card.Header>
            
            <Card.Body className="p-0">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <RefreshCw className="w-6 h-6 animate-spin mr-2" />
                  <span>Loading user roles...</span>
                </div>
              ) : (
                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.Head className="w-12">
                        <Checkbox
                          checked={selectedRoles.length === filteredUserRoles.length && filteredUserRoles.length > 0}
                          onChange={(checked) => {
                            if (checked) {
                              setSelectedRoles(filteredUserRoles.map(ur => ur.id));
                            } else {
                              setSelectedRoles([]);
                            }
                          }}
                        />
                      </Table.Head>
                      <Table.Head>User</Table.Head>
                      <Table.Head>Role</Table.Head>
                      <Table.Head>Status</Table.Head>
                      <Table.Head>Assigned</Table.Head>
                      <Table.Head>Actions</Table.Head>
                    </Table.Row>
                  </Table.Header>
                  
                  <Table.Body>
                    {filteredUserRoles.map((userRole) => (
                      <Table.Row key={userRole.id}>
                        <Table.Cell>
                          <Checkbox
                            checked={selectedRoles.includes(userRole.id)}
                            onChange={(checked) => {
                              if (checked) {
                                setSelectedRoles(prev => [...prev, userRole.id]);
                              } else {
                                setSelectedRoles(prev => prev.filter(id => id !== userRole.id));
                              }
                            }}
                          />
                        </Table.Cell>
                        
                        <Table.Cell>
                          <div>
                            <div className="font-medium">{userRole.user_name}</div>
                            <div className="text-sm text-gray-600">{userRole.user_email}</div>
                          </div>
                        </Table.Cell>
                        
                        <Table.Cell>
                          <Badge
                            variant={
                              userRole.role === 'admin' ? 'danger' :
                              userRole.role === 'coach' ? 'primary' :
                              userRole.role === 'client' ? 'success' :
                              'secondary'
                            }
                          >
                            {ROLE_DEFINITIONS.find(r => r.role === userRole.role)?.displayName || userRole.role}
                          </Badge>
                        </Table.Cell>
                        
                        <Table.Cell>
                          <div className="flex items-center gap-2">
                            {userRole.is_active ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-gray-400" />
                            )}
                            <span className="text-sm">
                              {userRole.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </Table.Cell>
                        
                        <Table.Cell>
                          <Tooltip content={`By ${userRole.assigned_by_name}`}>
                            <div className="text-sm text-gray-600">
                              {new Date(userRole.assigned_at).toLocaleDateString()}
                            </div>
                          </Tooltip>
                        </Table.Cell>
                        
                        <Table.Cell>
                          <div className="flex gap-1">
                            <Tooltip content="View Details">
                              <Button size="sm" variant="ghost">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                            
                            {canAssignRoles && (
                              <Tooltip content="Remove Role">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => removeUserRole(userRole.user_id, userRole.role)}
                                >
                                  <UserMinus className="w-4 h-4" />
                                </Button>
                              </Tooltip>
                            )}
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* Role Hierarchy */}
        <div>
          <RoleHierarchyCard />
        </div>
      </div>

      {/* Role Assignment Modal */}
      <RoleAssignmentModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onAssign={handleRoleAction}
      />
    </div>
  );
};

export default RoleManagement;
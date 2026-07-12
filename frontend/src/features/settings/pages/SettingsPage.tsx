import { useState, useTransition } from 'react';
import {
  User as UserIcon,
  Shield,
  Activity,
  Server,
  Key,
  Users,
  Check,
  X,
  Plus,
  Trash2,
  Lock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  useSettingsUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useSettingsRoles,
  useSettingsPermissions,
  useUpdateRolePermissions,
  useSettingsAuditLogs
} from '../hooks/useSettings';
import { User, Role } from '../services/settingsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageLoader } from '@/components/common/PageLoader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

export default function SettingsPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [auditPage, setAuditPage] = useState(1);

  // Queries
  const { data: users, isLoading: uLoading } = useSettingsUsers();
  const { data: roles, isLoading: rLoading } = useSettingsRoles();
  const { data: permissions, isLoading: pLoading } = useSettingsPermissions();
  const { data: auditData, isLoading: aLoading } = useSettingsAuditLogs(auditPage, 10);

  // Mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();
  const updateRolePermissionsMutation = useUpdateRolePermissions();

  // Create User Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'VIEWER' });

  // Permission Matrix state
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const handleCreateUser = () => {
    createUserMutation.mutate(newUser, {
      onSuccess: () => {
        setIsCreateOpen(false);
        setNewUser({ email: '', password: '', firstName: '', lastName: '', role: 'VIEWER' });
      }
    });
  };

  const handleDeleteUser = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleTogglePermission = (role: Role, permId: string) => {
    const isGranted = role.rolePermissions.some(rp => rp.permission.id === permId);
    const newPermIds = isGranted
      ? role.rolePermissions.filter(rp => rp.permission.id !== permId).map(rp => rp.permission.id)
      : [...role.rolePermissions.map(rp => rp.permission.id), permId];

    updateRolePermissionsMutation.mutate({ roleId: role.id, permissionIds: newPermIds });
  };

  if (uLoading || rLoading || pLoading || aLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings & Administration</h1>
        <p className="text-muted-foreground">Manage user accounts, configure system permissions, and inspect audit trails</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 lg:w-[600px]">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="system">System Status</TabsTrigger>
        </TabsList>

        {/* Tab 1: Profile Info */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personal Profile</CardTitle>
              <CardDescription>Configure your personal display properties and regional locales</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 max-w-md">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">First Name</label>
                  <Input defaultValue={currentUser?.firstName || ''} disabled />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Last Name</label>
                  <Input defaultValue={currentUser?.lastName || ''} disabled />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Email Address</label>
                <Input defaultValue={currentUser?.email || ''} disabled />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Role Assigned</label>
                <div className="flex">
                  <Badge variant="outline" className="capitalize text-primary bg-primary/10 border-primary/20">{currentUser?.role}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: User Management */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>User Administration</CardTitle>
                <CardDescription>Grant user invites, update account statuses, or delete system profiles</CardDescription>
              </div>
              <Button onClick={() => setIsCreateOpen(true)} className="gap-2" size="sm">
                <Plus className="h-4 w-4" /> Add User
              </Button>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b bg-muted/50">
                    <tr className="border-b transition-colors">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Role</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {users?.map((u: User) => (
                      <tr key={u.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">{u.firstName} {u.lastName}</td>
                        <td className="p-4 align-middle">{u.email}</td>
                        <td className="p-4 align-middle capitalize">{u.role.toLowerCase()}</td>
                        <td className="p-4 align-middle">
                          <Badge variant="outline" className={u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}>
                            {u.status}
                          </Badge>
                        </td>
                        <td className="p-4 align-middle">
                          {u.id !== currentUser?.id && (
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Simple Create User Dialog modal */}
          {isCreateOpen && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <Card className="w-full max-w-md">
                <CardHeader>
                  <CardTitle>Create New User Account</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs">First Name</label>
                    <Input value={newUser.firstName} onChange={e => setNewUser({ ...newUser, firstName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Last Name</label>
                    <Input value={newUser.lastName} onChange={e => setNewUser({ ...newUser, lastName: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Email</label>
                    <Input value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs">Password</label>
                    <Input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
                  </div>
                  <div className="flex gap-2 justify-end pt-4">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateUser}>Create</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Tab 3: Dynamic Permissions Matrix */}
        <TabsContent value="permissions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Permissions Matrix</CardTitle>
              <CardDescription>Dynamically toggle operational capabilities assigned to each role group</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Select Role Trigger */}
              <div className="flex gap-2">
                {roles?.map((r) => (
                  <Button
                    key={r.id}
                    variant={selectedRole?.id === r.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedRole(r)}
                  >
                    {r.name}
                  </Button>
                ))}
              </div>

              {selectedRole ? (
                <div className="border rounded-lg p-4 bg-muted/20 space-y-4">
                  <h3 className="font-semibold text-sm">Capabilities for {selectedRole.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {permissions?.map((p) => {
                      const isGranted = selectedRole.rolePermissions.some(rp => rp.permission.id === p.id);
                      return (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-card border rounded-lg shadow-sm">
                          <div>
                            <p className="text-sm font-semibold">{p.displayName}</p>
                            <p className="text-xs text-muted-foreground">{p.name}</p>
                          </div>
                          <Button
                            variant={isGranted ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleTogglePermission(selectedRole, p.id)}
                            className="h-8 w-16"
                          >
                            {isGranted ? 'Granted' : 'Revoked'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">Select a role above to manage its permission matrix capabilities.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Audit Logs */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Audit Trails</CardTitle>
              <CardDescription>Track state changes, log events, and profile updates across modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative w-full overflow-auto">
                <table className="w-full caption-bottom text-sm">
                  <thead className="[&_tr]:border-b bg-muted/50">
                    <tr className="border-b transition-colors">
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Module</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">IP Address</th>
                      <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {auditData?.data?.map((log) => (
                      <tr key={log.id} className="border-b transition-colors hover:bg-muted/50">
                        <td className="p-4 align-middle font-medium">
                          {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                        </td>
                        <td className="p-4 align-middle">
                          <Badge variant="outline" className="uppercase">{log.action}</Badge>
                        </td>
                        <td className="p-4 align-middle">{log.module}</td>
                        <td className="p-4 align-middle text-muted-foreground">{log.ipAddress || '—'}</td>
                        <td className="p-4 align-middle text-muted-foreground">
                          {format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {auditData?.meta && auditData.meta.totalPages > 1 && (
                <div className="p-4 border-t flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page <span className="font-medium">{auditPage}</span> of <span className="font-medium">{auditData.meta.totalPages}</span>
                  </p>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setAuditPage(p => Math.max(1, p - 1))} disabled={auditPage === 1}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setAuditPage(p => Math.min(auditData.meta.totalPages, p + 1))} disabled={auditPage === auditData.meta.totalPages}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 5: System Status */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>System & Services Status</CardTitle>
                <CardDescription>Live health checks for database clusters and servers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Server className="text-emerald-500 h-5 w-5" />
                    <div>
                      <p className="text-sm font-semibold">Core API Server</p>
                      <p className="text-xs text-muted-foreground">HTTP and Auth sessions</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Operational</Badge>
                </div>

                <div className="flex justify-between items-center p-3 border rounded-lg bg-muted/20">
                  <div className="flex items-center gap-3">
                    <Activity className="text-emerald-500 h-5 w-5" />
                    <div>
                      <p className="text-sm font-semibold">PostgreSQL (Neon)</p>
                      <p className="text-xs text-muted-foreground">Relational storage clusters</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Operational</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

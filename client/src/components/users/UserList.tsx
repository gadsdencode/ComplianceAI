import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { User } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Edit, Mail, Shield, Trash2, User as UserIcon, UserCog, Users } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface UserListProps {
  users: User[];
  isLoading: boolean;
  error?: string;
}

const userEditSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'compliance_officer', 'employee'])
});

type UserEditValues = z.infer<typeof userEditSchema>;

export default function UserList({ users, isLoading, error }: UserListProps) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const { toast } = useToast();

  const form = useForm<UserEditValues>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'employee'
    }
  });

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    form.reset({
      name: user.name,
      email: user.email,
      role: user.role
    });
  };

  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditingUser(null);
  };

  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const onSubmitEdit = async (data: UserEditValues) => {
    if (!editingUser) return;

    try {
      await apiRequest('PUT', `/api/users/${editingUser.id}`, data);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'User updated',
        description: 'User information has been updated successfully',
      });
      closeEditDialog();
    } catch (error) {
      toast({
        title: 'Error updating user',
        description: error.message || 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      await apiRequest('DELETE', `/api/users/${userToDelete.id}`);
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'User deleted',
        description: 'User has been deleted successfully',
      });
      closeDeleteDialog();
    } catch (error) {
      toast({
        title: 'Error deleting user',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary-100 text-primary-800 hover:bg-primary-100">Administrator</Badge>;
      case 'compliance_officer':
        return <Badge className="bg-warning-100 text-warning-800 hover:bg-warning-100">Compliance Officer</Badge>;
      case 'employee':
        return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100">Employee</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 flex items-center">
                <Skeleton className="h-10 w-10 rounded-full mr-4" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <Skeleton className="h-8 w-24 mr-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-12 border rounded-lg bg-white">
        <div className="mx-auto h-12 w-12 text-red-500 mb-4">
          <Users size={48} />
        </div>
        <h3 className="text-lg font-medium mb-2">Error loading users</h3>
        <p className="text-slate-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center p-12 border rounded-lg bg-white">
        <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No users found</h3>
        <p className="text-slate-600 mb-6">No users match your search criteria.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {users.map((user) => (
          <Card 
            key={user.id} 
            className="overflow-hidden hover:shadow-md transition-shadow"
          >
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center mr-4">
                      <UserIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <div className="flex items-center text-sm text-slate-500 mt-1">
                        <Mail className="h-3.5 w-3.5 mr-1" />
                        {user.email}
                        <span className="mx-2">•</span>
                        <UserIcon className="h-3.5 w-3.5 mr-1" />
                        @{user.username}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {getRoleBadge(user.role)}
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEditUser(user)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteUser(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={closeEditDialog}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitEdit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="Enter full name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="email"
                          placeholder="Enter email address"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select user role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="compliance_officer">Compliance Officer</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={closeEditDialog}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete User Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete User</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-slate-600 mb-2">
              Are you sure you want to delete the following user?
            </p>
            {userToDelete && (
              <div className="p-3 bg-slate-50 rounded-md">
                <p className="font-medium">{userToDelete.name}</p>
                <p className="text-sm text-slate-500">{userToDelete.email}</p>
                <div className="mt-1">{getRoleBadge(userToDelete.role)}</div>
              </div>
            )}
            <p className="mt-4 text-sm text-red-500">
              This action cannot be undone. All data associated with this user will be permanently deleted.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={closeDeleteDialog}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive"
              onClick={confirmDelete}
            >
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

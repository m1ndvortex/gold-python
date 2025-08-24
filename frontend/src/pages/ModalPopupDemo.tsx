import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
} from '../components/ui/alert-dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '../components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '../components/ui/sheet';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from '../components/ui/use-toast';
import { Toaster } from '../components/ui/toaster';
import { 
  Settings, 
  User, 
  LogOut, 
  Edit, 
  Trash2, 
  Plus, 
  Download,
  Share,
  Info,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

const ModalPopupDemo: React.FC = () => {
  const [position, setPosition] = useState('bottom');
  const [showBookmarks, setShowBookmarks] = useState(true);
  const [showURLs, setShowURLs] = useState(false);
  const [person, setPerson] = useState('pedro');

  const showToast = (variant: 'default' | 'destructive' | 'success' | 'warning' | 'info' = 'default') => {
    const messages = {
      default: { title: 'Default Toast', description: 'This is a default toast message with gradient styling.' },
      destructive: { title: 'Error Occurred', description: 'Something went wrong. Please try again.' },
      success: { title: 'Success!', description: 'Your action was completed successfully.' },
      warning: { title: 'Warning', description: 'Please review your input before proceeding.' },
      info: { title: 'Information', description: 'Here is some important information for you.' }
    };

    toast({
      variant,
      title: messages[variant].title,
      description: messages[variant].description,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
            Modal & Popup Components
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive showcase of all modal and popup components with beautiful gradient styling, 
            smooth animations, and enhanced user experience.
          </p>
        </div>

        {/* Dialog Components */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-green-50/30 to-teal-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Settings className="h-4 w-4 text-white" />
              </div>
              Dialog Components
            </CardTitle>
            <CardDescription>
              Modal dialogs with gradient backgrounds and smooth animations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Basic Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="gradient-green" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Basic Dialog
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Settings</DialogTitle>
                    <DialogDescription>
                      Configure your application settings here.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input id="name" placeholder="Enter your name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="Enter your email" />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="gradient-green">Save Changes</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Form Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="gradient-blue" className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Form Dialog
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Item</DialogTitle>
                    <DialogDescription>
                      Fill out the form below to create a new item.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" placeholder="Enter title" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" placeholder="Enter description" />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button variant="gradient-blue">Create Item</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Confirmation Dialog */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="gradient-orange" className="w-full">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Dialog
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your
                      account and remove your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700">
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* Popover Components */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Info className="h-4 w-4 text-white" />
              </div>
              Popover Components
            </CardTitle>
            <CardDescription>
              Contextual popovers with gradient styling and smooth animations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Basic Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="gradient-blue" className="w-full">
                    <Info className="h-4 w-4 mr-2" />
                    Basic Popover
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="space-y-2">
                    <h4 className="font-medium">Information</h4>
                    <p className="text-sm text-muted-foreground">
                      This is a basic popover with gradient styling and smooth animations.
                    </p>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Form Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="gradient-purple" className="w-full">
                    <Edit className="h-4 w-4 mr-2" />
                    Form Popover
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="space-y-4">
                    <h4 className="font-medium">Quick Edit</h4>
                    <div className="space-y-2">
                      <Label htmlFor="quick-name">Name</Label>
                      <Input id="quick-name" placeholder="Enter name" />
                    </div>
                    <Button variant="gradient-purple" size="sm" className="w-full">
                      Update
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Rich Content Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="gradient-teal" className="w-full">
                    <Share className="h-4 w-4 mr-2" />
                    Rich Popover
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                        <Share className="h-4 w-4 text-white" />
                      </div>
                      <h4 className="font-medium">Share Options</h4>
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Share className="h-4 w-4 mr-2" />
                        Share Link
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        {/* Dropdown Menu Components */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-purple-50/30 to-violet-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              Dropdown Menu Components
            </CardTitle>
            <CardDescription>
              Context menus with gradient styling and interactive elements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Basic Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="gradient-purple" className="w-full">
                    <User className="h-4 w-4 mr-2" />
                    User Menu
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="h-4 w-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Checkbox Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="gradient-blue" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Preferences
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Display Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={showBookmarks}
                    onCheckedChange={setShowBookmarks}
                  >
                    Show Bookmarks
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={showURLs}
                    onCheckedChange={setShowURLs}
                  >
                    Show URLs
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Radio Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="gradient-pink" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    Position
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
                    <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>

        {/* Sheet Components */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-teal-50/30 to-blue-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                <Settings className="h-4 w-4 text-white" />
              </div>
              Sheet Components
            </CardTitle>
            <CardDescription>
              Side panels and sheets with gradient styling
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Right Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="gradient-teal" className="w-full">
                    Right Sheet
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Settings Panel</SheetTitle>
                    <SheetDescription>
                      Configure your application settings from this panel.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="sheet-name">Name</Label>
                      <Input id="sheet-name" placeholder="Enter your name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sheet-email">Email</Label>
                      <Input id="sheet-email" type="email" placeholder="Enter your email" />
                    </div>
                    <Button variant="gradient-teal" className="w-full">
                      Save Changes
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Left Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="gradient-blue" className="w-full">
                    Left Sheet
                  </Button>
                </SheetTrigger>
                <SheetContent side="left">
                  <SheetHeader>
                    <SheetTitle>Navigation</SheetTitle>
                    <SheetDescription>
                      Quick navigation panel with gradient styling.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 py-4">
                    <Button variant="outline" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Top Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="gradient-purple" className="w-full">
                    Top Sheet
                  </Button>
                </SheetTrigger>
                <SheetContent side="top">
                  <SheetHeader>
                    <SheetTitle>Notifications</SheetTitle>
                    <SheetDescription>
                      Recent notifications and updates.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-2 py-4">
                    <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50">
                      <p className="text-sm font-medium text-green-800">Success</p>
                      <p className="text-sm text-green-600">Your changes have been saved.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50">
                      <p className="text-sm font-medium text-blue-800">Info</p>
                      <p className="text-sm text-blue-600">New features are available.</p>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Bottom Sheet */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="gradient-blue" className="w-full">
                    Bottom Sheet
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom">
                  <SheetHeader>
                    <SheetTitle>Quick Actions</SheetTitle>
                    <SheetDescription>
                      Frequently used actions and shortcuts.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid grid-cols-3 gap-4 py-4">
                    <Button variant="gradient-green" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Create
                    </Button>
                    <Button variant="gradient-blue" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button variant="gradient-orange" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </CardContent>
        </Card>

        {/* Tooltip Components */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-slate-50/30 to-gray-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                <Info className="h-4 w-4 text-white" />
              </div>
              Tooltip Components
            </CardTitle>
            <CardDescription>
              Hover tooltips with gradient styling and smooth animations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="gradient-green">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Success
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>This action was completed successfully</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="gradient-orange">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Warning
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Please review before proceeding</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="gradient-blue">
                      <Info className="h-4 w-4 mr-2" />
                      Information
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Additional information is available</p>
                  </TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="gradient-orange">
                      <X className="h-4 w-4 mr-2" />
                      Error
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>An error occurred during processing</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </CardContent>
        </Card>

        {/* Toast Components */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-yellow-50/30 to-orange-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center">
                <Info className="h-4 w-4 text-white" />
              </div>
              Toast Notifications
            </CardTitle>
            <CardDescription>
              Toast notifications with gradient styling and smooth animations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Button 
                variant="gradient-green" 
                onClick={() => showToast('default')}
                className="w-full"
              >
                Default Toast
              </Button>
              <Button 
                variant="gradient-green" 
                onClick={() => showToast('success')}
                className="w-full"
              >
                Success Toast
              </Button>
              <Button 
                variant="gradient-orange" 
                onClick={() => showToast('warning')}
                className="w-full"
              >
                Warning Toast
              </Button>
              <Button 
                variant="gradient-orange" 
                onClick={() => showToast('destructive')}
                className="w-full"
              >
                Error Toast
              </Button>
              <Button 
                variant="gradient-blue" 
                onClick={() => showToast('info')}
                className="w-full"
              >
                Info Toast
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Integration Example */}
        <Card className="border-0 shadow-xl bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Settings className="h-4 w-4 text-white" />
              </div>
              Integration Example
            </CardTitle>
            <CardDescription>
              Complex interaction combining multiple modal and popup components
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-6 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border border-indigo-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-indigo-900">User Profile Settings</h3>
                  <p className="text-sm text-indigo-600">Manage your account preferences and settings</p>
                </div>
                <div className="flex items-center gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Get help with profile settings</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => showToast('info')}>
                        <User className="h-4 w-4 mr-2" />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => showToast('success')}>
                        <Settings className="h-4 w-4 mr-2" />
                        Preferences
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => showToast('warning')}>
                        <LogOut className="h-4 w-4 mr-2" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="gradient-purple" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                          Update your profile information and preferences.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="profile-name">Full Name</Label>
                          <Input id="profile-name" placeholder="Enter your full name" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-email">Email Address</Label>
                          <Input id="profile-email" type="email" placeholder="Enter your email" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profile-bio">Bio</Label>
                          <Textarea id="profile-bio" placeholder="Tell us about yourself" />
                        </div>
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button 
                          variant="gradient-purple"
                          onClick={() => {
                            showToast('success');
                          }}
                        >
                          Save Changes
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Toaster />
    </div>
  );
};

export default ModalPopupDemo;
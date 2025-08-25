import React, { useState, useEffect } from 'react';
import {
  LoadingSpinner,
  GradientSpinner,
  PulseLoader,
  Progress,
  AnimatedProgress,
  CircularProgress,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonChart,
  GradientSkeleton,
  LoadingOverlay,
  LoadingButton,
  LoadingCard,
  LoadingTable,
  LoadingChart,
  LoadingForm,
  LoadingList,
  StepProgress,
  LoadingText
} from '../components/ui/loading-states';

import {
  Alert,
  BannerAlert,
  InlineAlert,
  StatusIndicator,
  ProgressAlert,
  ActionFeedback
} from '../components/ui/alert-system';

import { ToastProvider, useToast } from '../components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const LoadingFeedbackDemo: React.FC = () => {
  return (
    <ToastProvider>
      <LoadingFeedbackDemoContent />
    </ToastProvider>
  );
};

const LoadingFeedbackDemoContent: React.FC = () => {
  const { addToast } = useToast();
  const [loadingStates, setLoadingStates] = useState({
    overlay: false,
    button: false,
    card: false,
    table: false,
    chart: false,
    form: false,
    list: false,
    text: false
  });
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);

  // Simulate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => (prev >= 100 ? 0 : prev + 10));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate step progress
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep(prev => (prev >= 5 ? 1 : prev + 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggleLoading = (key: keyof typeof loadingStates) => {
    setLoadingStates(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: 'Operation completed successfully!',
      error: 'Something went wrong. Please try again.',
      warning: 'Please check your input before proceeding.',
      info: 'Here is some helpful information.'
    };
    addToast({ type, message: messages[type], title: type.charAt(0).toUpperCase() + type.slice(1) });
  };

  const showActionFeedback = (type: 'success' | 'error' | 'loading') => {
    setShowFeedback(true);
    setTimeout(() => setShowFeedback(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gradient-green">
            Loading & Feedback States Demo
          </h1>
          <p className="text-lg text-gray-600">
            Comprehensive showcase of gradient-enhanced loading and feedback components
          </p>
        </div>

        {/* Banner Alert */}
        <BannerAlert
          type="info"
          message="This demo showcases all loading and feedback components with gradient styling."
          variant="gradient"
        />

        <Tabs defaultValue="loading" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="loading">Loading Components</TabsTrigger>
            <TabsTrigger value="feedback">Feedback & Alerts</TabsTrigger>
            <TabsTrigger value="progress">Progress Indicators</TabsTrigger>
            <TabsTrigger value="interactive">Interactive Demo</TabsTrigger>
          </TabsList>

          {/* Loading Components Tab */}
          <TabsContent value="loading" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Spinners */}
              <Card className="card-gradient-green">
                <CardHeader>
                  <CardTitle>Loading Spinners</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <LoadingSpinner size="sm" variant="green" />
                    <LoadingSpinner size="md" variant="blue" />
                    <LoadingSpinner size="lg" variant="purple" />
                  </div>
                  <div className="flex items-center space-x-4">
                    <GradientSpinner size="sm" variant="green" />
                    <GradientSpinner size="md" variant="blue" />
                    <GradientSpinner size="lg" variant="purple" />
                  </div>
                  <div className="flex items-center space-x-4">
                    <PulseLoader size="sm" variant="green" />
                    <PulseLoader size="md" variant="blue" />
                    <PulseLoader size="lg" variant="purple" />
                  </div>
                </CardContent>
              </Card>

              {/* Skeletons */}
              <Card className="card-gradient-blue">
                <CardHeader>
                  <CardTitle>Skeleton Loaders</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <SkeletonText lines={3} />
                  <div className="flex space-x-2">
                    <GradientSkeleton variant="green" className="h-8 w-20" />
                    <GradientSkeleton variant="blue" className="h-8 w-16" />
                  </div>
                </CardContent>
              </Card>

              {/* Skeleton Components */}
              <Card className="card-gradient-purple">
                <CardHeader>
                  <CardTitle>Skeleton Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SkeletonTable rows={3} columns={3} />
                </CardContent>
              </Card>
            </div>

            {/* Large Skeleton Examples */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SkeletonCard />
              <SkeletonChart />
            </div>
          </TabsContent>

          {/* Feedback & Alerts Tab */}
          <TabsContent value="feedback" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Alerts */}
              <Card className="card-gradient-green">
                <CardHeader>
                  <CardTitle>Alert Components</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert
                    type="success"
                    title="Success!"
                    message="Your changes have been saved successfully."
                    variant="gradient"
                  />
                  <Alert
                    type="error"
                    message="There was an error processing your request."
                    variant="gradient"
                  />
                  <Alert
                    type="warning"
                    message="Please review your input before continuing."
                    variant="gradient"
                  />
                  <Alert
                    type="info"
                    message="New features are available in this update."
                    variant="gradient"
                  />
                </CardContent>
              </Card>

              {/* Status Indicators */}
              <Card className="card-gradient-blue">
                <CardHeader>
                  <CardTitle>Status Indicators</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <StatusIndicator status="success" label="Completed" variant="gradient" />
                    <StatusIndicator status="error" label="Failed" variant="gradient" />
                    <StatusIndicator status="warning" label="Warning" variant="gradient" />
                    <StatusIndicator status="info" label="Info" variant="gradient" />
                    <StatusIndicator status="pending" label="Processing..." variant="gradient" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <StatusIndicator status="success" label="Small" size="sm" />
                    <StatusIndicator status="success" label="Medium" size="md" />
                    <StatusIndicator status="success" label="Large" size="lg" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Inline Alerts */}
            <Card className="card-gradient-purple">
              <CardHeader>
                <CardTitle>Inline Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter your email"
                  />
                  <InlineAlert
                    type="error"
                    message="Please enter a valid email address"
                    size="sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="Enter your password"
                  />
                  <InlineAlert
                    type="warning"
                    message="Password should be at least 8 characters"
                    size="sm"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Indicators Tab */}
          <TabsContent value="progress" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Linear Progress */}
              <Card className="card-gradient-green">
                <CardHeader>
                  <CardTitle>Linear Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={progress} variant="green" showLabel />
                  <Progress value={75} variant="blue" showLabel />
                  <AnimatedProgress value={60} variant="purple" showLabel animated />
                </CardContent>
              </Card>

              {/* Circular Progress */}
              <Card className="card-gradient-blue">
                <CardHeader>
                  <CardTitle>Circular Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-center space-x-4">
                    <CircularProgress value={progress} variant="green" showLabel />
                    <CircularProgress value={75} variant="blue" showLabel size={60} />
                    <CircularProgress value={90} variant="purple" showLabel size={50} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Step Progress */}
            <Card className="card-gradient-purple">
              <CardHeader>
                <CardTitle>Step Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <StepProgress
                  currentStep={currentStep}
                  totalSteps={5}
                  steps={[
                    'Initialize Setup',
                    'Configure Settings',
                    'Process Data',
                    'Generate Reports',
                    'Complete Installation'
                  ]}
                  variant="green"
                />
              </CardContent>
            </Card>

            {/* Progress Alert */}
            <ProgressAlert
              title="File Upload Progress"
              currentStep={3}
              totalSteps={5}
              stepName="Processing images..."
              variant="blue"
            />
          </TabsContent>

          {/* Interactive Demo Tab */}
          <TabsContent value="interactive" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Loading States Demo */}
              <Card className="card-gradient-green">
                <CardHeader>
                  <CardTitle>Loading States</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <LoadingButton
                    isLoading={loadingStates.button}
                    onClick={() => toggleLoading('button')}
                    variant="green"
                  >
                    {loadingStates.button ? 'Loading...' : 'Click to Load'}
                  </LoadingButton>
                  
                  <LoadingOverlay isLoading={loadingStates.overlay}>
                    <div className="p-4 border rounded-lg bg-white">
                      <p>Content with overlay</p>
                      <Button onClick={() => toggleLoading('overlay')}>
                        Toggle Overlay
                      </Button>
                    </div>
                  </LoadingOverlay>

                  <LoadingText isLoading={loadingStates.text} lines={2}>
                    <p>This is some text content that can be in a loading state.</p>
                  </LoadingText>
                  <Button onClick={() => toggleLoading('text')} size="sm">
                    Toggle Text Loading
                  </Button>
                </CardContent>
              </Card>

              {/* Toast Demo */}
              <Card className="card-gradient-blue">
                <CardHeader>
                  <CardTitle>Toast Notifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={() => showToast('success')} variant="outline" className="w-full">
                    Show Success Toast
                  </Button>
                  <Button onClick={() => showToast('error')} variant="outline" className="w-full">
                    Show Error Toast
                  </Button>
                  <Button onClick={() => showToast('warning')} variant="outline" className="w-full">
                    Show Warning Toast
                  </Button>
                  <Button onClick={() => showToast('info')} variant="outline" className="w-full">
                    Show Info Toast
                  </Button>
                </CardContent>
              </Card>

              {/* Action Feedback Demo */}
              <Card className="card-gradient-purple">
                <CardHeader>
                  <CardTitle>Action Feedback</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={() => showActionFeedback('success')} className="w-full">
                    Show Success Feedback
                  </Button>
                  <Button onClick={() => showActionFeedback('error')} className="w-full">
                    Show Error Feedback
                  </Button>
                  <Button onClick={() => showActionFeedback('loading')} className="w-full">
                    Show Loading Feedback
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Loading Components Demo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LoadingCard isLoading={loadingStates.card}>
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Card</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>This is a sample card that can be in a loading state.</p>
                    <Button onClick={() => toggleLoading('card')}>
                      Toggle Card Loading
                    </Button>
                  </CardContent>
                </Card>
              </LoadingCard>

              <LoadingChart isLoading={loadingStates.chart}>
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Chart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                      <p className="text-gray-600">Chart Content</p>
                    </div>
                    <Button onClick={() => toggleLoading('chart')} className="mt-4">
                      Toggle Chart Loading
                    </Button>
                  </CardContent>
                </Card>
              </LoadingChart>
            </div>

            {/* Form and Table Loading */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <LoadingForm isLoading={loadingStates.form}>
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Form</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <input type="text" className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input type="email" className="w-full px-3 py-2 border rounded-md" />
                    </div>
                    <Button onClick={() => toggleLoading('form')}>
                      Toggle Form Loading
                    </Button>
                  </CardContent>
                </Card>
              </LoadingForm>

              <LoadingTable isLoading={loadingStates.table} rows={4} columns={3}>
                <Card>
                  <CardHeader>
                    <CardTitle>Sample Table</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="p-2">John Doe</td>
                          <td className="p-2">Active</td>
                          <td className="p-2">Edit</td>
                        </tr>
                        <tr className="border-b">
                          <td className="p-2">Jane Smith</td>
                          <td className="p-2">Inactive</td>
                          <td className="p-2">Edit</td>
                        </tr>
                      </tbody>
                    </table>
                    <Button onClick={() => toggleLoading('table')} className="mt-4">
                      Toggle Table Loading
                    </Button>
                  </CardContent>
                </Card>
              </LoadingTable>
            </div>

            <LoadingList isLoading={loadingStates.list} items={3}>
              <Card>
                <CardHeader>
                  <CardTitle>Sample List</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg">
                        <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-teal-600 rounded-full" />
                        <div className="flex-1">
                          <h4 className="font-medium">Item {i}</h4>
                          <p className="text-sm text-gray-600">Description for item {i}</p>
                        </div>
                        <Button size="sm">Action</Button>
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => toggleLoading('list')} className="mt-4">
                    Toggle List Loading
                  </Button>
                </CardContent>
              </Card>
            </LoadingList>
          </TabsContent>
        </Tabs>

        {/* Action Feedback */}
        <ActionFeedback
          type="success"
          message="Action completed successfully!"
          isVisible={showFeedback}
        />
      </div>
    </div>
  );
};

export default LoadingFeedbackDemo;
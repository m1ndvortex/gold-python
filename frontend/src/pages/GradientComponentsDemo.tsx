import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  Palette, 
  Sparkles, 
  Zap,
  Heart,
  Star,
  Gem,
  Crown,
  Award,
  Search,
  Settings,
  Download,
  Share
} from 'lucide-react';

const GradientComponentsDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState('buttons');

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-500 via-teal-500 to-blue-500 flex items-center justify-center shadow-lg">
              <Palette className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Gradient Components</h1>
              <p className="text-muted-foreground text-lg">
                Updated UI components with beautiful gradient styling
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="gradient-green-light" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Updated
          </Badge>
          <Button variant="outline" size="sm" className="gap-2">
            <Settings className="h-4 w-4" />
            Configure
          </Button>
          <Button variant="gradient-green" size="sm" className="gap-2">
            <Share className="h-4 w-4" />
            Share
          </Button>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="gradient-green">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg">Buttons</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Gradient button variants with smooth hover effects
            </CardDescription>
          </CardContent>
        </Card>

        <Card variant="gradient-teal">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-500 flex items-center justify-center">
                <Heart className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg">Cards</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Professional cards with gradient backgrounds
            </CardDescription>
          </CardContent>
        </Card>

        <Card variant="gradient-blue">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center">
                <Star className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg">Badges</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Status indicators with gradient styling
            </CardDescription>
          </CardContent>
        </Card>

        <Card variant="gradient-purple">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center">
                <Gem className="h-4 w-4 text-white" />
              </div>
              <CardTitle className="text-lg">Forms</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              Input fields with gradient focus states
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Components Demo */}
      <Card variant="professional" className="border-0 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Tab Navigation */}
            <div className="bg-gradient-to-r from-green-50 via-teal-50 to-blue-50 border-b-2 border-green-200">
              <TabsList variant="gradient-green" className="grid w-full grid-cols-4 bg-transparent h-auto p-1 gap-1">
                <TabsTrigger 
                  variant="gradient-green"
                  value="buttons" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-green-300"
                >
                  <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Buttons</div>
                    <div className="text-xs text-muted-foreground">Gradient Variants</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  variant="gradient-green"
                  value="cards" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-teal-300"
                >
                  <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <Heart className="h-4 w-4 text-teal-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Cards</div>
                    <div className="text-xs text-muted-foreground">Background Styles</div>
                  </div>
                </TabsTrigger>
                
                <TabsTrigger 
                  variant="gradient-green"
                  value="badges" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-blue-300"
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Star className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Badges</div>
                    <div className="text-xs text-muted-foreground">Status Indicators</div>
                  </div>
                </TabsTrigger>

                <TabsTrigger 
                  variant="gradient-green"
                  value="forms" 
                  className="flex items-center gap-3 p-4 rounded-lg transition-all duration-300 hover:bg-white hover:shadow-sm data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border-2 data-[state=active]:border-purple-300"
                >
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                    <Gem className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Forms</div>
                    <div className="text-xs text-muted-foreground">Input Fields</div>
                  </div>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Tab Content */}
            <TabsContent variant="gradient-green" value="buttons">
              <div className="flex items-center justify-between pb-4 border-b border-green-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Button Variants</h3>
                    <p className="text-sm text-muted-foreground">Gradient buttons with smooth hover effects</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium mb-3">Primary Gradient Buttons</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="gradient-green">Green Gradient</Button>
                    <Button variant="gradient-teal">Teal Gradient</Button>
                    <Button variant="gradient-blue">Blue Gradient</Button>
                    <Button variant="gradient-purple">Purple Gradient</Button>
                    <Button variant="gradient-pink">Pink Gradient</Button>
                    <Button variant="gradient-orange">Orange Gradient</Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-3">Outline Gradient Buttons</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="outline-gradient-green">Green Outline</Button>
                    <Button variant="outline-gradient-blue">Blue Outline</Button>
                    <Button variant="outline-gradient-purple">Purple Outline</Button>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-3">Icon Gradient Buttons</h4>
                  <div className="flex flex-wrap gap-3">
                    <Button variant="icon-gradient-green"><Crown className="h-4 w-4" /></Button>
                    <Button variant="icon-gradient-teal"><Award className="h-4 w-4" /></Button>
                    <Button variant="icon-gradient-blue"><Star className="h-4 w-4" /></Button>
                    <Button variant="icon-gradient-purple"><Gem className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent variant="gradient-teal" value="cards">
              <div className="flex items-center justify-between pb-4 border-b border-teal-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
                    <Heart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Card Variants</h3>
                    <p className="text-sm text-muted-foreground">Professional cards with gradient backgrounds</p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card variant="gradient-green">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-green-500 flex items-center justify-center">
                        <Zap className="h-3 w-3 text-white" />
                      </div>
                      Green Card
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Card with green gradient background</p>
                  </CardContent>
                </Card>

                <Card variant="gradient-teal">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-teal-500 flex items-center justify-center">
                        <Heart className="h-3 w-3 text-white" />
                      </div>
                      Teal Card
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Card with teal gradient background</p>
                  </CardContent>
                </Card>

                <Card variant="gradient-blue">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-blue-500 flex items-center justify-center">
                        <Star className="h-3 w-3 text-white" />
                      </div>
                      Blue Card
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Card with blue gradient background</p>
                  </CardContent>
                </Card>

                <Card variant="gradient-purple">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-purple-500 flex items-center justify-center">
                        <Gem className="h-3 w-3 text-white" />
                      </div>
                      Purple Card
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Card with purple gradient background</p>
                  </CardContent>
                </Card>

                <Card variant="professional">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-gray-500 flex items-center justify-center">
                        <Crown className="h-3 w-3 text-white" />
                      </div>
                      Professional Card
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Professional card with enhanced shadows</p>
                  </CardContent>
                </Card>

                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded bg-indigo-500 flex items-center justify-center">
                        <Award className="h-3 w-3 text-white" />
                      </div>
                      Elevated Card
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Elevated card with stronger shadows</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent variant="gradient-blue" value="badges">
              <div className="flex items-center justify-between pb-4 border-b border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Badge Variants</h3>
                    <p className="text-sm text-muted-foreground">Status indicators with gradient styling</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium mb-3">Gradient Badges</h4>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="gradient-green">Green</Badge>
                    <Badge variant="gradient-teal">Teal</Badge>
                    <Badge variant="gradient-blue">Blue</Badge>
                    <Badge variant="gradient-purple">Purple</Badge>
                    <Badge variant="gradient-pink">Pink</Badge>
                    <Badge variant="gradient-orange">Orange</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-3">Light Gradient Badges</h4>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="gradient-green-light">Green Light</Badge>
                    <Badge variant="gradient-teal-light">Teal Light</Badge>
                    <Badge variant="gradient-blue-light">Blue Light</Badge>
                    <Badge variant="gradient-purple-light">Purple Light</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-3">Status Badges</h4>
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="error">Error</Badge>
                    <Badge variant="info">Info</Badge>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent variant="gradient-purple" value="forms">
              <div className="flex items-center justify-between pb-4 border-b border-purple-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Gem className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Form Components</h3>
                    <p className="text-sm text-muted-foreground">Input fields with gradient focus states</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium mb-3">Gradient Focus Inputs</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input variant="gradient-green" placeholder="Green focus input" />
                    <Input variant="gradient-teal" placeholder="Teal focus input" />
                    <Input variant="gradient-blue" placeholder="Blue focus input" />
                    <Input variant="gradient-purple" placeholder="Purple focus input" />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-3">Input with Icons</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input 
                      variant="gradient-green" 
                      placeholder="Search..." 
                      leftIcon={<Search className="h-4 w-4" />}
                    />
                    <Input 
                      variant="gradient-blue" 
                      placeholder="Settings..." 
                      rightIcon={<Settings className="h-4 w-4" />}
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-medium mb-3">Form Example</h4>
                  <Card variant="gradient-purple">
                    <CardHeader>
                      <CardTitle>Contact Form</CardTitle>
                      <CardDescription>Example form with gradient styling</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input variant="gradient-purple" placeholder="Your name" />
                      <Input variant="gradient-purple" placeholder="Email address" type="email" />
                      <Input variant="gradient-purple" placeholder="Subject" />
                      <div className="flex gap-2">
                        <Button variant="gradient-purple" className="flex-1">Send Message</Button>
                        <Button variant="outline">Cancel</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default GradientComponentsDemo;
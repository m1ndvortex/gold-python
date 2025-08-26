import React, { useState, useRef, useEffect } from 'react';
import { 
  Scan, 
  Camera, 
  X, 
  Check, 
  AlertCircle, 
  RefreshCw,
  Settings,
  Zap,
  Search,
  Package,
  Hash,
  QrCode,
  Upload,
  Download,
  History,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '../ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../ui/select';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useLanguage } from '../../hooks/useLanguage';
import { cn } from '../../lib/utils';
import { barcodeApi, universalInventoryApi } from '../../services/universalInventoryApi';
import type { 
  UniversalInventoryItemWithCategory,
  BarcodeGenerationRequest,
  BarcodeGenerationResponse
} from '../../types/universalInventory';

interface BarcodeScannerProps {
  onItemFound?: (item: UniversalInventoryItemWithCategory) => void;
  onItemNotFound?: (barcode: string) => void;
  onClose?: () => void;
  autoClose?: boolean;
  showHistory?: boolean;
  className?: string;
}

interface ScanResult {
  id: string;
  barcode: string;
  item?: UniversalInventoryItemWithCategory;
  timestamp: Date;
  success: boolean;
}

interface ScannerSettings {
  enableSound: boolean;
  enableVibration: boolean;
  autoFocus: boolean;
  continuousMode: boolean;
  showOverlay: boolean;
  scanDelay: number; // milliseconds
}

const defaultSettings: ScannerSettings = {
  enableSound: true,
  enableVibration: true,
  autoFocus: true,
  continuousMode: false,
  showOverlay: true,
  scanDelay: 1000,
};

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({
  onItemFound,
  onItemNotFound,
  onClose,
  autoClose = false,
  showHistory = true,
  className
}) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanHistory, setScanHistory] = useState<ScanResult[]>([]);
  const [settings, setSettings] = useState<ScannerSettings>(defaultSettings);
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'scanner' | 'manual' | 'generate' | 'history'>('scanner');

  // Barcode generation state
  const [generateItems, setGenerateItems] = useState<string[]>([]);
  const [barcodeType, setBarcodeType] = useState<'CODE128' | 'EAN13' | 'QR'>('CODE128');
  const [barcodeSize, setBarcodeSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [includeText, setIncludeText] = useState(true);
  const [generatedBarcodes, setGeneratedBarcodes] = useState<BarcodeGenerationResponse | null>(null);

  // Initialize camera
  useEffect(() => {
    checkCameraAvailability();
    return () => {
      stopCamera();
    };
  }, []);

  const checkCameraAvailability = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasCamera(videoDevices.length > 0);
    } catch (error) {
      console.error('Error checking camera availability:', error);
      setHasCamera(false);
    }
  };

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsScanning(true);
        
        // Start scanning loop
        if (settings.continuousMode) {
          startScanningLoop();
        }
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const startScanningLoop = () => {
    const scanFrame = () => {
      if (isScanning && videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (context && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);

          // Here you would integrate with a barcode scanning library like ZXing or QuaggaJS
          // For now, we'll simulate the scanning process
          simulateBarcodeScan(canvas);
        }

        if (settings.continuousMode) {
          requestAnimationFrame(scanFrame);
        }
      }
    };

    requestAnimationFrame(scanFrame);
  };

  const simulateBarcodeScan = (canvas: HTMLCanvasElement) => {
    // This is a placeholder for actual barcode scanning logic
    // In a real implementation, you would use a library like ZXing-js or QuaggaJS
    // to decode barcodes from the canvas image data
    
    // For demonstration, we'll randomly "detect" a barcode
    if (Math.random() < 0.01) { // 1% chance per frame
      const mockBarcode = '1234567890123';
      handleBarcodeDetected(mockBarcode);
    }
  };

  const handleBarcodeDetected = async (barcode: string) => {
    const now = Date.now();
    if (now - lastScanTime < settings.scanDelay) {
      return; // Prevent rapid successive scans
    }
    setLastScanTime(now);

    // Play sound if enabled
    if (settings.enableSound) {
      playBeepSound();
    }

    // Vibrate if enabled and supported
    if (settings.enableVibration && navigator.vibrate) {
      navigator.vibrate(100);
    }

    await processBarcode(barcode);
  };

  const processBarcode = async (barcode: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const item = await barcodeApi.scanBarcode(barcode);
      
      const scanResult: ScanResult = {
        id: Date.now().toString(),
        barcode,
        item: item || undefined,
        timestamp: new Date(),
        success: !!item,
      };

      setScanHistory(prev => [scanResult, ...prev.slice(0, 49)]); // Keep last 50 scans

      if (item) {
        onItemFound?.(item);
        if (autoClose) {
          onClose?.();
        }
      } else {
        onItemNotFound?.(barcode);
        setError(`No item found with barcode: ${barcode}`);
      }
    } catch (error) {
      console.error('Error processing barcode:', error);
      setError('Failed to process barcode. Please try again.');
      
      const scanResult: ScanResult = {
        id: Date.now().toString(),
        barcode,
        timestamp: new Date(),
        success: false,
      };
      setScanHistory(prev => [scanResult, ...prev.slice(0, 49)]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualBarcode.trim()) return;
    
    await processBarcode(manualBarcode.trim());
    setManualBarcode('');
  };

  const playBeepSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const generateBarcodes = async () => {
    if (generateItems.length === 0) return;

    try {
      const request: BarcodeGenerationRequest = {
        item_ids: generateItems,
        barcode_type: barcodeType,
        include_text: includeText,
        size: barcodeSize,
      };

      const response = await barcodeApi.generateBarcodes(request);
      setGeneratedBarcodes(response);
    } catch (error) {
      console.error('Error generating barcodes:', error);
      setError('Failed to generate barcodes. Please try again.');
    }
  };

  const clearHistory = () => {
    setScanHistory([]);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Scan className="h-4 w-4 text-white" />
            </div>
            Barcode Scanner & Generator
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList variant="gradient-blue" className="grid w-full grid-cols-4">
            <TabsTrigger variant="gradient-blue" value="scanner" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Scanner
            </TabsTrigger>
            <TabsTrigger variant="gradient-blue" value="manual" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Manual
            </TabsTrigger>
            <TabsTrigger variant="gradient-blue" value="generate" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Generate
            </TabsTrigger>
            <TabsTrigger variant="gradient-blue" value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
              {scanHistory.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {scanHistory.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Scanner Tab */}
          <TabsContent variant="gradient-blue" value="scanner" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant={isScanning ? "destructive" : "gradient-blue"}
                  onClick={isScanning ? stopCamera : startCamera}
                  disabled={!hasCamera}
                  className="flex items-center gap-2"
                >
                  {isScanning ? (
                    <>
                      <X className="h-4 w-4" />
                      Stop Camera
                    </>
                  ) : (
                    <>
                      <Camera className="h-4 w-4" />
                      Start Camera
                    </>
                  )}
                </Button>

                {isProcessing && (
                  <div className="flex items-center gap-2 text-blue-600">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing...
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </div>

            {/* Settings Panel */}
            <AnimatePresence>
              {showSettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card variant="professional">
                    <CardContent className="p-4 space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={settings.enableSound}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, enableSound: checked }))
                            }
                          />
                          <Label>Sound</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={settings.enableVibration}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, enableVibration: checked }))
                            }
                          />
                          <Label>Vibration</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={settings.continuousMode}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, continuousMode: checked }))
                            }
                          />
                          <Label>Continuous</Label>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={settings.showOverlay}
                            onCheckedChange={(checked) => 
                              setSettings(prev => ({ ...prev, showOverlay: checked }))
                            }
                          />
                          <Label>Overlay</Label>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Camera View */}
            <Card variant="professional">
              <CardContent className="p-4">
                {!hasCamera ? (
                  <div className="text-center py-12">
                    <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg font-semibold">No Camera Available</p>
                    <p className="text-muted-foreground">
                      Please check camera permissions or use manual entry.
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <video
                      ref={videoRef}
                      className="w-full h-64 bg-black rounded-lg object-cover"
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      className="hidden"
                    />
                    
                    {settings.showOverlay && isScanning && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="border-2 border-blue-500 bg-blue-500/20 rounded-lg w-64 h-32 flex items-center justify-center">
                          <Scan className="h-8 w-8 text-blue-500 animate-pulse" />
                        </div>
                      </div>
                    )}

                    {!isScanning && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <div className="text-center text-white">
                          <Camera className="h-12 w-12 mx-auto mb-2" />
                          <p>Click "Start Camera" to begin scanning</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Entry Tab */}
          <TabsContent variant="gradient-blue" value="manual" className="space-y-4">
            <Card variant="professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Manual Barcode Entry
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter barcode manually..."
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleManualSubmit}
                    disabled={!manualBarcode.trim() || isProcessing}
                    className="flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    Search
                  </Button>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Enter a barcode number manually to search for the corresponding item.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Generate Tab */}
          <TabsContent variant="gradient-blue" value="generate" className="space-y-4">
            <Card variant="professional">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  Generate Barcodes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Barcode Type</Label>
                    <Select value={barcodeType} onValueChange={(value) => setBarcodeType(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CODE128">Code 128</SelectItem>
                        <SelectItem value="EAN13">EAN-13</SelectItem>
                        <SelectItem value="QR">QR Code</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Size</Label>
                    <Select value={barcodeSize} onValueChange={(value) => setBarcodeSize(value as any)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Options</Label>
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={includeText}
                        onCheckedChange={setIncludeText}
                      />
                      <Label>Include Text</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Item IDs (comma-separated)</Label>
                  <Input
                    placeholder="Enter item IDs to generate barcodes for..."
                    value={generateItems.join(', ')}
                    onChange={(e) => setGenerateItems(
                      e.target.value.split(',').map(id => id.trim()).filter(id => id)
                    )}
                  />
                </div>

                <Button
                  onClick={generateBarcodes}
                  disabled={generateItems.length === 0}
                  className="w-full flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  Generate Barcodes
                </Button>

                {generatedBarcodes && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold">Generated Barcodes</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {generatedBarcodes.barcodes.map((barcode) => (
                        <Card key={barcode.item_id} variant="professional">
                          <CardContent className="p-4 text-center">
                            <img
                              src={barcode.barcode_url}
                              alt={`Barcode for ${barcode.item_id}`}
                              className="mx-auto mb-2"
                            />
                            <p className="text-sm font-mono">{barcode.barcode_data}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent variant="gradient-blue" value="history" className="space-y-4">
            <Card variant="professional">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Scan History
                    <Badge variant="secondary">{scanHistory.length}</Badge>
                  </CardTitle>
                  
                  {scanHistory.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearHistory}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {scanHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4" />
                    <p>No scan history yet</p>
                  </div>
                ) : (
                  <ScrollArea className="h-64">
                    <div className="space-y-2">
                      {scanHistory.map((scan) => (
                        <div
                          key={scan.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg border",
                            scan.success ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {scan.success ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-red-600" />
                            )}
                            <div>
                              <p className="font-mono text-sm">{scan.barcode}</p>
                              {scan.item && (
                                <p className="text-sm text-muted-foreground">{scan.item.name}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {scan.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
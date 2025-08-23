import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface ExportOptions {
  format?: 'png' | 'svg' | 'pdf' | 'csv';
  filename?: string;
  quality?: number;
  width?: number;
  height?: number;
  backgroundColor?: string;
  includeMetadata?: boolean;
}

export interface ChartData {
  [key: string]: any;
}

export interface ExportResult {
  success: boolean;
  data?: string | Blob;
  filename: string;
  error?: string;
}

export interface EmbedOptions {
  width?: number;
  height?: number;
  theme?: 'light' | 'dark';
  interactive?: boolean;
  showControls?: boolean;
}

export interface ShareOptions {
  title?: string;
  description?: string;
  tags?: string[];
  isPublic?: boolean;
  allowComments?: boolean;
  expiresAt?: Date;
}

export class ChartExportService {
  private static instance: ChartExportService;

  public static getInstance(): ChartExportService {
    if (!ChartExportService.instance) {
      ChartExportService.instance = new ChartExportService();
    }
    return ChartExportService.instance;
  }

  /**
   * Export chart as PNG image
   */
  async exportToPNG(
    element: HTMLElement,
    options: ExportOptions = { format: 'png' }
  ): Promise<ExportResult> {
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: options.backgroundColor || '#ffffff',
        width: options.width,
        height: options.height,
        scale: options.quality || 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            const filename = options.filename || `chart-${Date.now()}.png`;
            this.downloadBlob(blob, filename);
            resolve({
              success: true,
              data: blob,
              filename
            });
          } else {
            resolve({
              success: false,
              filename: '',
              error: 'Failed to create PNG blob'
            });
          }
        }, 'image/png', options.quality || 0.9);
      });
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Export chart as SVG
   */
  async exportToSVG(
    element: HTMLElement,
    options: ExportOptions = { format: 'svg' }
  ): Promise<ExportResult> {
    try {
      const svgElement = element.querySelector('svg');
      if (!svgElement) {
        return {
          success: false,
          filename: '',
          error: 'No SVG element found in the chart'
        };
      }

      // Clone the SVG to avoid modifying the original
      const clonedSvg = svgElement.cloneNode(true) as SVGElement;
      
      // Set dimensions if provided
      if (options.width) {
        clonedSvg.setAttribute('width', options.width.toString());
      }
      if (options.height) {
        clonedSvg.setAttribute('height', options.height.toString());
      }

      // Add background if specified
      if (options.backgroundColor) {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('width', '100%');
        rect.setAttribute('height', '100%');
        rect.setAttribute('fill', options.backgroundColor);
        clonedSvg.insertBefore(rect, clonedSvg.firstChild);
      }

      // Add metadata if requested
      if (options.includeMetadata) {
        const metadata = document.createElementNS('http://www.w3.org/2000/svg', 'metadata');
        metadata.textContent = JSON.stringify({
          exportedAt: new Date().toISOString(),
          exportedBy: 'Advanced Analytics System',
          format: 'SVG'
        });
        clonedSvg.appendChild(metadata);
      }

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(clonedSvg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml' });
      
      const filename = options.filename || `chart-${Date.now()}.svg`;
      this.downloadBlob(svgBlob, filename);

      return {
        success: true,
        data: svgBlob,
        filename
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Export chart as PDF
   */
  async exportToPDF(
    element: HTMLElement,
    options: ExportOptions = { format: 'pdf' }
  ): Promise<ExportResult> {
    try {
      const canvas = await html2canvas(element, {
        backgroundColor: options.backgroundColor || '#ffffff',
        scale: options.quality || 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

      // Add metadata if requested
      if (options.includeMetadata) {
        pdf.setProperties({
          title: 'Analytics Chart Export',
          subject: 'Chart exported from Advanced Analytics System',
          author: 'Advanced Analytics System',
          creator: 'Chart Export Service'
        });
      }

      const filename = options.filename || `chart-${Date.now()}.pdf`;
      pdf.save(filename);

      return {
        success: true,
        filename
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Export chart data as CSV
   */
  async exportToCSV(
    data: ChartData[],
    options: ExportOptions = { format: 'csv' }
  ): Promise<ExportResult> {
    try {
      if (!data || data.length === 0) {
        return {
          success: false,
          filename: '',
          error: 'No data to export'
        };
      }

      // Get all unique keys from the data
      const keys = Array.from(new Set(data.flatMap(Object.keys)));
      
      // Create CSV header
      let csvContent = keys.join(',') + '\n';
      
      // Add data rows
      data.forEach(row => {
        const values = keys.map(key => {
          const value = row[key];
          // Handle values that might contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value ?? '';
        });
        csvContent += values.join(',') + '\n';
      });

      // Add metadata as comments if requested
      if (options.includeMetadata) {
        const metadata = [
          `# Exported at: ${new Date().toISOString()}`,
          `# Exported by: Advanced Analytics System`,
          `# Total records: ${data.length}`,
          `# Columns: ${keys.join(', ')}`,
          ''
        ].join('\n');
        csvContent = metadata + csvContent;
      }

      const csvBlob = new Blob([csvContent], { type: 'text/csv' });
      const filename = options.filename || `chart-data-${Date.now()}.csv`;
      
      this.downloadBlob(csvBlob, filename);

      return {
        success: true,
        data: csvBlob,
        filename
      };
    } catch (error) {
      return {
        success: false,
        filename: '',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate embed code for chart sharing
   */
  generateEmbedCode(
    chartId: string,
    options: EmbedOptions = {}
  ): string {
    const {
      width = 800,
      height = 600,
      theme = 'light',
      interactive = true,
      showControls = true
    } = options;

    const baseUrl = window.location.origin;
    const embedUrl = `${baseUrl}/embed/chart/${chartId}`;
    
    const params = new URLSearchParams({
      theme,
      interactive: interactive.toString(),
      controls: showControls.toString()
    });

    return `<iframe 
  src="${embedUrl}?${params.toString()}" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  allowfullscreen
  title="Analytics Chart">
</iframe>`;
  }

  /**
   * Generate shareable link
   */
  async generateShareLink(
    chartConfig: any,
    options: ShareOptions = {}
  ): Promise<string> {
    try {
      // In a real implementation, this would make an API call to save the chart configuration
      const shareData = {
        config: chartConfig,
        metadata: {
          title: options.title || 'Shared Chart',
          description: options.description || '',
          tags: options.tags || [],
          isPublic: options.isPublic ?? true,
          allowComments: options.allowComments ?? false,
          expiresAt: options.expiresAt?.toISOString(),
          createdAt: new Date().toISOString()
        }
      };

      // Simulate API call - in real implementation, replace with actual API call
      const shareId = this.generateShareId();
      
      // Store in localStorage for demo purposes
      localStorage.setItem(`shared-chart-${shareId}`, JSON.stringify(shareData));
      
      const baseUrl = window.location.origin;
      return `${baseUrl}/shared/chart/${shareId}`;
    } catch (error) {
      throw new Error(`Failed to generate share link: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create chart annotation
   */
  createAnnotation(
    chartId: string,
    annotation: {
      x: number;
      y: number;
      text: string;
      author: string;
      type: 'note' | 'highlight' | 'question';
      color?: string;
    }
  ): string {
    const annotationId = this.generateAnnotationId();
    const annotationData = {
      ...annotation,
      id: annotationId,
      chartId,
      createdAt: new Date().toISOString()
    };

    // Store annotation - in real implementation, this would be an API call
    const existingAnnotations = this.getAnnotations(chartId);
    existingAnnotations.push(annotationData);
    localStorage.setItem(`chart-annotations-${chartId}`, JSON.stringify(existingAnnotations));

    return annotationId;
  }

  /**
   * Get chart annotations
   */
  getAnnotations(chartId: string): any[] {
    try {
      const stored = localStorage.getItem(`chart-annotations-${chartId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Delete annotation
   */
  deleteAnnotation(chartId: string, annotationId: string): boolean {
    try {
      const annotations = this.getAnnotations(chartId);
      const filtered = annotations.filter(a => a.id !== annotationId);
      localStorage.setItem(`chart-annotations-${chartId}`, JSON.stringify(filtered));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Batch export multiple charts
   */
  async batchExport(
    charts: Array<{
      element: HTMLElement;
      data?: ChartData[];
      filename: string;
    }>,
    format: 'png' | 'svg' | 'pdf' | 'csv',
    options: ExportOptions = { format: 'png' }
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];
    
    for (const chart of charts) {
      let result: ExportResult;
      
      switch (format) {
        case 'png':
          result = await this.exportToPNG(chart.element, {
            ...options,
            filename: chart.filename
          });
          break;
        case 'svg':
          result = await this.exportToSVG(chart.element, {
            ...options,
            filename: chart.filename
          });
          break;
        case 'pdf':
          result = await this.exportToPDF(chart.element, {
            ...options,
            filename: chart.filename
          });
          break;
        case 'csv':
          result = await this.exportToCSV(chart.data || [], {
            ...options,
            filename: chart.filename
          });
          break;
        default:
          result = {
            success: false,
            filename: chart.filename,
            error: `Unsupported format: ${format}`
          };
      }
      
      results.push(result);
    }
    
    return results;
  }

  /**
   * Helper method to download blob
   */
  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate unique share ID
   */
  private generateShareId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  /**
   * Generate unique annotation ID
   */
  private generateAnnotationId(): string {
    return 'ann_' + Math.random().toString(36).substr(2, 9);
  }
}

export const chartExportService = ChartExportService.getInstance();
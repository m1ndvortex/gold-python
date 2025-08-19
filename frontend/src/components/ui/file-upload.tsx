import * as React from "react"
import { Upload, X, File, Image, FileText, AlertCircle, CheckCircle2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const fileUploadVariants = cva(
  "relative border-2 border-dashed rounded-lg transition-all duration-300 cursor-pointer",
  {
    variants: {
      variant: {
        default: "border-border hover:border-primary-300 hover:bg-primary-50/50",
        success: "border-success-300 bg-success-50/50",
        error: "border-error-300 bg-error-50/50",
        warning: "border-warning-300 bg-warning-50/50",
      },
      size: {
        default: "p-6",
        sm: "p-4",
        lg: "p-8",
      },
      state: {
        idle: "",
        dragOver: "border-primary-500 bg-primary-100/50 scale-[1.02]",
        uploading: "border-primary-500 bg-primary-50/50",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "idle",
    },
  }
)

export interface FileUploadFile {
  file: File
  id: string
  progress?: number
  error?: string
  preview?: string
}

export interface FileUploadProps extends VariantProps<typeof fileUploadVariants> {
  onFilesChange?: (files: FileUploadFile[]) => void
  onFileRemove?: (fileId: string) => void
  accept?: string
  multiple?: boolean
  maxSize?: number // in bytes
  maxFiles?: number
  disabled?: boolean
  className?: string
  label?: string
  description?: string
  error?: string
  success?: string
  warning?: string
  helpText?: string
  showPreview?: boolean
  allowedTypes?: string[]
  uploadProgress?: Record<string, number>
}

const FileUpload = React.forwardRef<HTMLDivElement, FileUploadProps>(
  ({
    onFilesChange,
    onFileRemove,
    accept,
    multiple = false,
    maxSize = 10 * 1024 * 1024, // 10MB default
    maxFiles = multiple ? 10 : 1,
    disabled = false,
    className,
    variant,
    size,
    label,
    description,
    error,
    success,
    warning,
    helpText,
    showPreview = true,
    allowedTypes = [],
    uploadProgress = {},
    ...props
  }, ref) => {
    const [files, setFiles] = React.useState<FileUploadFile[]>([])
    const [dragState, setDragState] = React.useState<"idle" | "dragOver" | "uploading">("idle")
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const dropZoneRef = React.useRef<HTMLDivElement>(null)
    
    React.useImperativeHandle(ref, () => dropZoneRef.current!)
    
    // Determine variant based on validation state
    const actualVariant = error ? "error" : success ? "success" : warning ? "warning" : variant
    
    // Validate file
    const validateFile = (file: File): string | null => {
      if (maxSize && file.size > maxSize) {
        return `File size must be less than ${formatFileSize(maxSize)}`
      }
      
      if (allowedTypes.length > 0) {
        const fileType = file.type || getFileTypeFromName(file.name)
        if (!allowedTypes.some(type => fileType.includes(type))) {
          return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        }
      }
      
      return null
    }
    
    // Process files
    const processFiles = (fileList: FileList) => {
      const newFiles: FileUploadFile[] = []
      const currentFileCount = files.length
      
      Array.from(fileList).forEach((file, index) => {
        if (currentFileCount + newFiles.length >= maxFiles) {
          return // Skip if max files reached
        }
        
        const fileId = `${Date.now()}-${index}`
        const error = validateFile(file)
        
        const fileUpload: FileUploadFile = {
          file,
          id: fileId,
          error: error || undefined,
        }
        
        // Generate preview for images
        if (showPreview && file.type.startsWith('image/')) {
          const reader = new FileReader()
          reader.onload = (e) => {
            setFiles(prev => prev.map(f => 
              f.id === fileId ? { ...f, preview: e.target?.result as string } : f
            ))
          }
          reader.readAsDataURL(file)
        }
        
        newFiles.push(fileUpload)
      })
      
      const updatedFiles = multiple ? [...files, ...newFiles] : newFiles
      setFiles(updatedFiles)
      onFilesChange?.(updatedFiles)
    }
    
    // Handle file input change
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files)
      }
    }
    
    // Handle drag events
    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) {
        setDragState("dragOver")
      }
    }
    
    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
        setDragState("idle")
      }
    }
    
    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setDragState("idle")
      
      if (disabled) return
      
      const droppedFiles = e.dataTransfer.files
      if (droppedFiles.length > 0) {
        processFiles(droppedFiles)
      }
    }
    
    // Handle file removal
    const handleFileRemove = (fileId: string) => {
      const updatedFiles = files.filter(f => f.id !== fileId)
      setFiles(updatedFiles)
      onFilesChange?.(updatedFiles)
      onFileRemove?.(fileId)
    }
    
    // Handle click to open file dialog
    const handleClick = () => {
      if (!disabled && fileInputRef.current) {
        fileInputRef.current.click()
      }
    }
    
    // Get file icon
    const getFileIcon = (file: File) => {
      if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />
      if (file.type.includes('pdf') || file.type.includes('document')) return <FileText className="h-4 w-4" />
      return <File className="h-4 w-4" />
    }
    
    // Format file size
    const formatFileSize = (bytes: number): string => {
      if (bytes === 0) return '0 Bytes'
      const k = 1024
      const sizes = ['Bytes', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    // Get file type from name
    const getFileTypeFromName = (fileName: string): string => {
      const extension = fileName.split('.').pop()?.toLowerCase()
      const typeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }
      return typeMap[extension || ''] || 'application/octet-stream'
    }
    
    const uploadZone = (
      <div className="space-y-4">
        {/* Drop Zone */}
        <div
          ref={dropZoneRef}
          className={cn(
            fileUploadVariants({ variant: actualVariant, size, state: dragState, className }),
            disabled && "opacity-50 cursor-not-allowed"
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          {...props}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileInputChange}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className={cn(
              "h-8 w-8 mb-2 text-muted-foreground",
              dragState === "dragOver" && "text-primary-500"
            )} />
            
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {dragState === "dragOver" 
                  ? "Drop files here" 
                  : "Click to upload or drag and drop"
                }
              </p>
              
              {description && (
                <p className="text-xs text-muted-foreground">
                  {description}
                </p>
              )}
              
              <p className="text-xs text-muted-foreground">
                {accept && `Accepted formats: ${accept}`}
                {maxSize && ` • Max size: ${formatFileSize(maxSize)}`}
                {multiple && ` • Max files: ${maxFiles}`}
              </p>
            </div>
          </div>
        </div>
        
        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((fileUpload) => (
              <div
                key={fileUpload.id}
                className={cn(
                  "flex items-center p-3 bg-background border rounded-lg",
                  fileUpload.error && "border-error-300 bg-error-50/50"
                )}
              >
                {/* File Preview/Icon */}
                <div className="flex-shrink-0 mr-3">
                  {fileUpload.preview ? (
                    <img
                      src={fileUpload.preview}
                      alt={fileUpload.file.name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                      {getFileIcon(fileUpload.file)}
                    </div>
                  )}
                </div>
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {fileUpload.file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(fileUpload.file.size)}
                  </p>
                  
                  {/* Progress Bar */}
                  {uploadProgress[fileUpload.id] !== undefined && (
                    <div className="mt-1">
                      <div className="w-full bg-muted rounded-full h-1">
                        <div
                          className="bg-primary h-1 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress[fileUpload.id]}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Error Message */}
                  {fileUpload.error && (
                    <p className="text-xs text-error-600 mt-1">
                      {fileUpload.error}
                    </p>
                  )}
                </div>
                
                {/* Status Icon */}
                <div className="flex-shrink-0 ml-3">
                  {fileUpload.error ? (
                    <AlertCircle className="h-4 w-4 text-error-500" />
                  ) : uploadProgress[fileUpload.id] === 100 ? (
                    <CheckCircle2 className="h-4 w-4 text-success-500" />
                  ) : null}
                </div>
                
                {/* Remove Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleFileRemove(fileUpload.id)
                  }}
                  className="flex-shrink-0 ml-2 p-1 text-muted-foreground hover:text-error-500 transition-colors"
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
    
    // Wrap with label and validation messages if needed
    if (label || error || success || warning || helpText) {
      return (
        <div className="space-y-2">
          {label && (
            <label className="text-sm font-medium leading-none">
              {label}
            </label>
          )}
          
          {uploadZone}
          
          {/* Help Text and Validation Messages */}
          {(error || success || warning || helpText) && (
            <div className="text-xs">
              {error && <p className="text-error-600">{error}</p>}
              {success && <p className="text-success-600">{success}</p>}
              {warning && <p className="text-warning-600">{warning}</p>}
              {helpText && !error && !success && !warning && (
                <p className="text-muted-foreground">{helpText}</p>
              )}
            </div>
          )}
        </div>
      )
    }
    
    return uploadZone
  }
)

FileUpload.displayName = "FileUpload"

export { FileUpload, fileUploadVariants }
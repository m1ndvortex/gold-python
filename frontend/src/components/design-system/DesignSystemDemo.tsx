import React from 'react';
import { cn, getButtonClasses, getCardClasses, getStatusClasses } from '../../utils/design-system';

/**
 * Design System Demo Component
 * This component showcases the new design system elements
 */
export function DesignSystemDemo() {
  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-gradient-gold font-display text-4xl font-bold">
          Gold Shop Design System
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Professional, modern design system with gold accents for luxury business applications
        </p>
      </div>

      {/* Color Palette */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Color Palette</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Primary Colors */}
          <div className={getCardClasses('default')}>
            <h3 className="font-semibold mb-3">Primary Gold</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-primary-100"></div>
                <span className="text-sm">100</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-primary-300"></div>
                <span className="text-sm">300</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-primary-500"></div>
                <span className="text-sm">500</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-primary-700"></div>
                <span className="text-sm">700</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-primary-900"></div>
                <span className="text-sm">900</span>
              </div>
            </div>
          </div>

          {/* Neutral Colors */}
          <div className={getCardClasses('default')}>
            <h3 className="font-semibold mb-3">Neutral</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-neutral-100 border"></div>
                <span className="text-sm">100</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-neutral-300"></div>
                <span className="text-sm">300</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-neutral-500"></div>
                <span className="text-sm">500</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-neutral-700"></div>
                <span className="text-sm">700</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-neutral-900"></div>
                <span className="text-sm">900</span>
              </div>
            </div>
          </div>

          {/* Semantic Colors */}
          <div className={getCardClasses('default')}>
            <h3 className="font-semibold mb-3">Success</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-success-100"></div>
                <span className="text-sm">100</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-success-500"></div>
                <span className="text-sm">500</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-success-700"></div>
                <span className="text-sm">700</span>
              </div>
            </div>
          </div>

          <div className={getCardClasses('default')}>
            <h3 className="font-semibold mb-3">Error</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-error-100"></div>
                <span className="text-sm">100</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-error-500"></div>
                <span className="text-sm">500</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-error-700"></div>
                <span className="text-sm">700</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Typography</h2>
        <div className={getCardClasses('default')}>
          <div className="space-y-4">
            <div>
              <h1 className="font-display text-4xl font-bold text-foreground">Heading 1 - Display Font</h1>
              <p className="text-sm text-muted-foreground">font-display text-4xl font-bold</p>
            </div>
            <div>
              <h2 className="font-display text-3xl font-semibold text-foreground">Heading 2 - Display Font</h2>
              <p className="text-sm text-muted-foreground">font-display text-3xl font-semibold</p>
            </div>
            <div>
              <h3 className="font-sans text-xl font-semibold text-foreground">Heading 3 - Sans Font</h3>
              <p className="text-sm text-muted-foreground">font-sans text-xl font-semibold</p>
            </div>
            <div>
              <p className="font-sans text-base text-foreground">
                Body text using Inter font family. This is the primary font for all body content, 
                providing excellent readability and professional appearance.
              </p>
              <p className="text-sm text-muted-foreground">font-sans text-base</p>
            </div>
            <div>
              <p className="font-mono text-sm text-muted-foreground bg-neutral-100 p-2 rounded">
                Monospace font for code: const goldPrice = 2150.50;
              </p>
              <p className="text-sm text-muted-foreground">font-mono text-sm</p>
            </div>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Buttons</h2>
        <div className={getCardClasses('default')}>
          <div className="flex flex-wrap gap-4">
            <button className={getButtonClasses('primary')}>
              Primary Gold
            </button>
            <button className={getButtonClasses('outline')}>
              Outline
            </button>
            <button className={cn(getButtonClasses('primary'), 'btn-gold-ghost')}>
              Ghost
            </button>
            <button className={getButtonClasses('primary')} disabled>
              Disabled
            </button>
          </div>
          <div className="flex flex-wrap gap-4 mt-4">
            <button className={cn(getButtonClasses('primary'), 'bg-success hover:bg-success/90')}>
              Success
            </button>
            <button className={cn(getButtonClasses('primary'), 'bg-warning hover:bg-warning/90')}>
              Warning
            </button>
            <button className={cn(getButtonClasses('primary'), 'bg-error hover:bg-error/90')}>
              Error
            </button>
            <button className={cn(getButtonClasses('primary'), 'bg-info hover:bg-info/90')}>
              Info
            </button>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={getCardClasses('default')}>
            <h3 className="font-semibold mb-2">Default Card</h3>
            <p className="text-muted-foreground">Standard card with professional shadow</p>
          </div>
          <div className={getCardClasses('elevated')}>
            <h3 className="font-semibold mb-2">Elevated Card</h3>
            <p className="text-muted-foreground">Card with elegant shadow for emphasis</p>
          </div>
          <div className={getCardClasses('gold')}>
            <h3 className="font-semibold mb-2">Gold Card</h3>
            <p className="text-muted-foreground">Premium card with gold gradient background</p>
          </div>
        </div>
      </section>

      {/* Status Indicators */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Status Indicators</h2>
        <div className={getCardClasses('default')}>
          <div className="flex flex-wrap gap-4">
            <span className={getStatusClasses('success')}>Success</span>
            <span className={getStatusClasses('warning')}>Warning</span>
            <span className={getStatusClasses('error')}>Error</span>
            <span className={getStatusClasses('info')}>Info</span>
            <span className={getStatusClasses('neutral')}>Neutral</span>
          </div>
        </div>
      </section>

      {/* Form Elements */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Form Elements</h2>
        <div className={getCardClasses('default')}>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Professional Input
              </label>
              <input
                type="text"
                placeholder="Enter text here..."
                className="input-professional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Select Dropdown
              </label>
              <select className="input-professional">
                <option>Choose an option</option>
                <option>Gold 24K</option>
                <option>Gold 22K</option>
                <option>Gold 18K</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Textarea
              </label>
              <textarea
                placeholder="Enter description..."
                rows={3}
                className="input-professional resize-none"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Table */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Professional Table</h2>
        <div className={getCardClasses('default')}>
          <table className="table-professional">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Gold Ring 24K</td>
                <td>Jewelry</td>
                <td>$2,150.00</td>
                <td><span className={getStatusClasses('success')}>In Stock</span></td>
              </tr>
              <tr>
                <td>Gold Necklace 22K</td>
                <td>Jewelry</td>
                <td>$3,200.00</td>
                <td><span className={getStatusClasses('warning')}>Low Stock</span></td>
              </tr>
              <tr>
                <td>Gold Bracelet 18K</td>
                <td>Jewelry</td>
                <td>$1,800.00</td>
                <td><span className={getStatusClasses('error')}>Out of Stock</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Animations */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Animations</h2>
        <div className={getCardClasses('default')}>
          <div className="space-y-4">
            <div className="animate-fade-in-up">
              <p>Fade in up animation</p>
            </div>
            <div className="animate-scale-in">
              <p>Scale in animation</p>
            </div>
            <div className="loading-shimmer h-4 w-32 rounded">
              {/* Shimmer loading effect */}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DesignSystemDemo;
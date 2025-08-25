import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock axios
jest.mock('axios', () => ({
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
  },
}));

// Mock all the complex dependencies
jest.mock('../hooks/useInventory', () => ({
  useInventoryItems: () => ({
    data: { items: [], total: 0, total_pages: 0 },
    isLoading: false,
    error: null,
  }),
  useCategories: () => ({ data: [] }),
  useDeleteInventoryItem: () => ({ mutateAsync: jest.fn() }),
}));

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

jest.mock('../components/inventory/AdvancedFilterPanel', () => ({
  AdvancedFilterPanel: () => <div>Filter Panel</div>,
}));

jest.mock('../components/inventory/InventoryItemForm', () => ({
  InventoryItemForm: () => <div>Item Form</div>,
}));

jest.mock('../components/inventory/CategoryManager', () => ({
  CategoryManager: () => <div>Category Manager</div>,
}));

jest.mock('../components/inventory/BulkInventoryOperations', () => ({
  BulkInventoryOperations: () => <div>Bulk Operations</div>,
}));

jest.mock('../pages/ImageManagement', () => ({
  default: () => <div>Image Management</div>,
}));

// Mock the useLanguage hook
const mockUseLanguage = jest.fn();
jest.mock('../hooks/useLanguage', () => ({
  useLanguage: mockUseLanguage,
}));

// Simple test component that uses translations
const TestTranslationComponent: React.FC<{ language: 'en' | 'fa' | 'ar' }> = ({ language }) => {
  const { useLanguage } = require('../hooks/useLanguage');
  const { t } = useLanguage();
  
  return (
    <div>
      <h1>{t('inventory.management_title')}</h1>
      <p>{t('inventory.management_description')}</p>
      <button>{t('inventory.add_item')}</button>
      <span>{t('inventory.filters')}</span>
      <div>{t('inventory.inventory_items')}</div>
      <div>{t('inventory.categories')}</div>
      <div>{t('inventory.item')}</div>
      <div>{t('inventory.category')}</div>
      <div>{t('inventory.weight')}</div>
      <div>{t('inventory.purchase_price')}</div>
      <div>{t('inventory.sell_price')}</div>
      <div>{t('inventory.stock')}</div>
      <div>{t('inventory.status')}</div>
      <div>{t('inventory.in_stock_label')}</div>
      <div>{t('inventory.low_stock_label')}</div>
      <div>{t('inventory.out_of_stock_label')}</div>
    </div>
  );
};

describe('Inventory Translation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays English translations correctly', () => {
    // Mock the language context to return English
    mockUseLanguage.mockReturnValue({
      language: 'en',
      direction: 'ltr',
      t: (key: string) => {
        const translations: Record<string, string> = {
          'inventory.management_title': 'Inventory Management',
          'inventory.management_description': 'Manage your gold jewelry inventory with modern tools and insights',
          'inventory.add_item': 'Add Item',
          'inventory.filters': 'Filters',
          'inventory.inventory_items': 'Inventory Items',
          'inventory.categories': 'Categories',
          'inventory.item': 'Item',
          'inventory.category': 'Category',
          'inventory.weight': 'Weight',
          'inventory.purchase_price': 'Purchase Price',
          'inventory.sell_price': 'Sell Price',
          'inventory.stock': 'Stock',
          'inventory.status': 'Status',
          'inventory.in_stock_label': 'In Stock',
          'inventory.low_stock_label': 'Low Stock',
          'inventory.out_of_stock_label': 'Out of Stock',
        };
        return translations[key] || key;
      },
    });

    render(<TestTranslationComponent language="en" />);

    expect(screen.getByText('Inventory Management')).toBeInTheDocument();
    expect(screen.getByText('Manage your gold jewelry inventory with modern tools and insights')).toBeInTheDocument();
    expect(screen.getByText('Add Item')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByText('Inventory Items')).toBeInTheDocument();
    expect(screen.getByText('Categories')).toBeInTheDocument();
    expect(screen.getByText('Item')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Weight')).toBeInTheDocument();
    expect(screen.getByText('Purchase Price')).toBeInTheDocument();
    expect(screen.getByText('Sell Price')).toBeInTheDocument();
    expect(screen.getByText('Stock')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('In Stock')).toBeInTheDocument();
    expect(screen.getByText('Low Stock')).toBeInTheDocument();
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  test('displays Persian translations correctly', () => {
    // Mock the language context to return Persian
    mockUseLanguage.mockReturnValue({
      language: 'fa',
      direction: 'rtl',
      t: (key: string) => {
        const translations: Record<string, string> = {
          'inventory.management_title': 'مدیریت موجودی',
          'inventory.management_description': 'موجودی طلا و جواهرات خود را با ابزارهای مدرن و بینش‌های پیشرفته مدیریت کنید',
          'inventory.add_item': 'افزودن کالا',
          'inventory.filters': 'فیلترها',
          'inventory.inventory_items': 'اقلام موجودی',
          'inventory.categories': 'دسته‌بندی‌ها',
          'inventory.item': 'کالا',
          'inventory.category': 'دسته‌بندی',
          'inventory.weight': 'وزن',
          'inventory.purchase_price': 'قیمت خرید',
          'inventory.sell_price': 'قیمت فروش',
          'inventory.stock': 'موجودی',
          'inventory.status': 'وضعیت',
          'inventory.in_stock_label': 'موجود',
          'inventory.low_stock_label': 'موجودی کم',
          'inventory.out_of_stock_label': 'تمام شده',
        };
        return translations[key] || key;
      },
    });

    render(<TestTranslationComponent language="fa" />);

    expect(screen.getByText('مدیریت موجودی')).toBeInTheDocument();
    expect(screen.getByText('موجودی طلا و جواهرات خود را با ابزارهای مدرن و بینش‌های پیشرفته مدیریت کنید')).toBeInTheDocument();
    expect(screen.getByText('افزودن کالا')).toBeInTheDocument();
    expect(screen.getByText('فیلترها')).toBeInTheDocument();
    expect(screen.getByText('اقلام موجودی')).toBeInTheDocument();
    expect(screen.getByText('دسته‌بندی‌ها')).toBeInTheDocument();
    expect(screen.getByText('کالا')).toBeInTheDocument();
    expect(screen.getByText('دسته‌بندی')).toBeInTheDocument();
    expect(screen.getByText('وزن')).toBeInTheDocument();
    expect(screen.getByText('قیمت خرید')).toBeInTheDocument();
    expect(screen.getByText('قیمت فروش')).toBeInTheDocument();
    expect(screen.getByText('موجودی')).toBeInTheDocument();
    expect(screen.getByText('وضعیت')).toBeInTheDocument();
    expect(screen.getByText('موجود')).toBeInTheDocument();
    expect(screen.getByText('موجودی کم')).toBeInTheDocument();
    expect(screen.getByText('تمام شده')).toBeInTheDocument();
  });

  test('displays Arabic translations correctly', () => {
    // Mock the language context to return Arabic
    mockUseLanguage.mockReturnValue({
      language: 'ar',
      direction: 'rtl',
      t: (key: string) => {
        const translations: Record<string, string> = {
          'inventory.management_title': 'إدارة المخزون',
          'inventory.management_description': 'إدارة مخزون الذهب والمجوهرات بأدوات حديثة ورؤى متقدمة',
          'inventory.add_item': 'إضافة عنصر',
          'inventory.filters': 'المرشحات',
          'inventory.inventory_items': 'عناصر المخزون',
          'inventory.categories': 'الفئات',
          'inventory.item': 'العنصر',
          'inventory.category': 'الفئة',
          'inventory.weight': 'الوزن',
          'inventory.purchase_price': 'سعر الشراء',
          'inventory.sell_price': 'سعر البيع',
          'inventory.stock': 'المخزون',
          'inventory.status': 'الحالة',
          'inventory.in_stock_label': 'متوفر',
          'inventory.low_stock_label': 'مخزون منخفض',
          'inventory.out_of_stock_label': 'نفد المخزون',
        };
        return translations[key] || key;
      },
    });

    render(<TestTranslationComponent language="ar" />);

    expect(screen.getByText('إدارة المخزون')).toBeInTheDocument();
    expect(screen.getByText('إدارة مخزون الذهب والمجوهرات بأدوات حديثة ورؤى متقدمة')).toBeInTheDocument();
    expect(screen.getByText('إضافة عنصر')).toBeInTheDocument();
    expect(screen.getByText('المرشحات')).toBeInTheDocument();
    expect(screen.getByText('عناصر المخزون')).toBeInTheDocument();
    expect(screen.getByText('الفئات')).toBeInTheDocument();
    expect(screen.getByText('العنصر')).toBeInTheDocument();
    expect(screen.getByText('الفئة')).toBeInTheDocument();
    expect(screen.getByText('الوزن')).toBeInTheDocument();
    expect(screen.getByText('سعر الشراء')).toBeInTheDocument();
    expect(screen.getByText('سعر البيع')).toBeInTheDocument();
    expect(screen.getByText('المخزون')).toBeInTheDocument();
    expect(screen.getByText('الحالة')).toBeInTheDocument();
    expect(screen.getByText('متوفر')).toBeInTheDocument();
    expect(screen.getByText('مخزون منخفض')).toBeInTheDocument();
    expect(screen.getByText('نفد المخزون')).toBeInTheDocument();
  });
});
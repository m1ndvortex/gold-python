/**
 * RTL Framework Demo Component
 * Demonstrates the usage of the RTL/LTR CSS framework and direction adapter
 */

import React from 'react';
import { useLanguage } from '../hooks/useLanguage';

const RTLDemo: React.FC = () => {
  const { 
    language, 
    direction, 
    isRTL, 
    t, 
    setLanguage,
    getLayoutClassesEnhanced,
    getFlexDirectionEnhanced,
    getTextAlignEnhanced,
    getDirectionalClasses,
    getIconClasses,
    adaptChartConfig
  } = useLanguage();

  const handleLanguageSwitch = () => {
    setLanguage(language === 'en' ? 'fa' : 'en');
  };

  // Demo chart configuration
  const demoChartConfig = {
    type: 'bar',
    options: {
      plugins: {
        legend: {
          align: 'start',
          position: 'top'
        },
        tooltip: {
          titleAlign: 'start',
          bodyAlign: 'start'
        }
      },
      scales: {
        x: {
          position: 'bottom'
        },
        y: {
          position: 'left'
        }
      }
    }
  };

  const adaptedChartConfig = adaptChartConfig(demoChartConfig);

  return (
    <div className={getLayoutClassesEnhanced('min-h-screen bg-gray-50 p-6')}>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className={getDirectionalClasses('card') + ' p-6'}>
          <div className={getFlexDirectionEnhanced('row') + ' items-center justify-between'}>
            <div>
              <h1 className={getTextAlignEnhanced('left') + ' text-3xl font-bold text-gray-900'}>
                {t('RTL Framework Demo')}
              </h1>
              <p className={getTextAlignEnhanced('left') + ' text-gray-600 mt-2'}>
                Current Language: {language.toUpperCase()} | Direction: {direction.toUpperCase()}
              </p>
            </div>
            <button
              onClick={handleLanguageSwitch}
              className="btn-gradient-blue px-4 py-2 rounded-lg text-white font-medium"
            >
              Switch to {language === 'en' ? 'Persian' : 'English'}
            </button>
          </div>
        </div>

        {/* Layout Demo */}
        <div className={getDirectionalClasses('card') + ' p-6'}>
          <h2 className={getTextAlignEnhanced('left') + ' text-xl font-semibold mb-4'}>
            Layout Direction Demo
          </h2>
          <div className="space-y-4">
            {/* Flex Row Demo */}
            <div className={getFlexDirectionEnhanced('row') + ' items-center space-x-4 p-4 bg-blue-50 rounded-lg'}>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                1
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                2
              </div>
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                3
              </div>
              <div className="flex-1">
                <p className={getTextAlignEnhanced('left')}>
                  This flex row adapts to {direction} direction automatically
                </p>
              </div>
            </div>

            {/* Text Alignment Demo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className={getTextAlignEnhanced('left') + ' font-semibold text-green-800'}>
                  Start Aligned
                </h3>
                <p className={getTextAlignEnhanced('left') + ' text-green-600 mt-2'}>
                  This text is aligned to the start of the container based on direction.
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h3 className={getTextAlignEnhanced('center') + ' font-semibold text-purple-800'}>
                  Center Aligned
                </h3>
                <p className={getTextAlignEnhanced('center') + ' text-purple-600 mt-2'}>
                  This text is always center aligned regardless of direction.
                </p>
              </div>
              <div className="p-4 bg-pink-50 rounded-lg">
                <h3 className={getTextAlignEnhanced('right') + ' font-semibold text-pink-800'}>
                  End Aligned
                </h3>
                <p className={getTextAlignEnhanced('right') + ' text-pink-600 mt-2'}>
                  This text is aligned to the end of the container based on direction.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Component Direction Demo */}
        <div className={getDirectionalClasses('card') + ' p-6'}>
          <h2 className={getTextAlignEnhanced('left') + ' text-xl font-semibold mb-4'}>
            Component Direction Classes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Sidebar Demo */}
            <div className="relative h-32 bg-gray-100 rounded-lg overflow-hidden">
              <div className={getDirectionalClasses('sidebar') + ' absolute top-0 bottom-0 w-16 bg-blue-600'}>
                <div className="p-2">
                  <div className="w-8 h-8 bg-white rounded-lg mx-auto"></div>
                </div>
              </div>
              <div className={isRTL ? 'pr-20' : 'pl-20'}>
                <div className="p-4">
                  <p className="text-sm text-gray-600">Sidebar appears on the {isRTL ? 'right' : 'left'}</p>
                </div>
              </div>
            </div>

            {/* Dropdown Demo */}
            <div className="relative h-32 bg-gray-100 rounded-lg">
              <div className="p-4">
                <div className="relative inline-block">
                  <button className="px-4 py-2 bg-green-500 text-white rounded-lg">
                    Dropdown
                  </button>
                  <div className={getDirectionalClasses('dropdown') + ' absolute top-full mt-2 w-48 bg-white border rounded-lg shadow-lg p-2'}>
                    <div className="text-sm text-gray-600">
                      Dropdown positioned for {direction}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Demo */}
            <div className={getDirectionalClasses('form') + ' p-4 bg-gray-100 rounded-lg'}>
              <div className="space-y-3">
                <div>
                  <label className={getDirectionalClasses('form') + ' block text-sm font-medium text-gray-700 mb-1'}>
                    Name
                  </label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Enter name"
                  />
                </div>
                <div className={getFlexDirectionEnhanced('row') + ' items-center space-x-2'}>
                  <input type="checkbox" className={getDirectionalClasses('form')} />
                  <label className="text-sm text-gray-700">
                    Checkbox with proper spacing
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Icon Position Demo */}
        <div className={getDirectionalClasses('card') + ' p-6'}>
          <h2 className={getTextAlignEnhanced('left') + ' text-xl font-semibold mb-4'}>
            Icon Position Demo
          </h2>
          <div className={getFlexDirectionEnhanced('row') + ' items-center space-x-4'}>
            <button className={`btn-gradient-green px-4 py-2 rounded-lg text-white font-medium flex items-center ${getIconClasses('start')}`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Start Icon
            </button>
            <button className={`btn-gradient-purple px-4 py-2 rounded-lg text-white font-medium flex items-center ${getIconClasses('end')}`}>
              End Icon
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Table Demo */}
        <div className={getDirectionalClasses('card') + ' p-6'}>
          <h2 className={getTextAlignEnhanced('left') + ' text-xl font-semibold mb-4'}>
            Table Direction Demo
          </h2>
          <div className="overflow-x-auto">
            <table className={getDirectionalClasses('table') + ' w-full'}>
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-sm font-semibold">Role</th>
                  <th className="px-4 py-3 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-3 text-sm">John Doe</td>
                  <td className="px-4 py-3 text-sm">john@example.com</td>
                  <td className="px-4 py-3 text-sm">Admin</td>
                  <td className="px-4 py-3 text-sm">
                    <button className="text-blue-600 hover:text-blue-800">Edit</button>
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-3 text-sm">Jane Smith</td>
                  <td className="px-4 py-3 text-sm">jane@example.com</td>
                  <td className="px-4 py-3 text-sm">User</td>
                  <td className="px-4 py-3 text-sm">
                    <button className="text-blue-600 hover:text-blue-800">Edit</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart Configuration Demo */}
        <div className={getDirectionalClasses('card') + ' p-6'}>
          <h2 className={getTextAlignEnhanced('left') + ' text-xl font-semibold mb-4'}>
            Chart Configuration Adaptation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Original Config</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(demoChartConfig, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Adapted Config ({direction})</h3>
              <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(adaptedChartConfig, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* CSS Custom Properties Demo */}
        <div className={getDirectionalClasses('card') + ' p-6'}>
          <h2 className={getTextAlignEnhanced('left') + ' text-xl font-semibold mb-4'}>
            CSS Custom Properties Demo
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg" style={{ 
              marginInlineStart: '2rem',
              paddingInlineStart: '1rem',
              borderInlineStart: '4px solid #3b82f6'
            }}>
              <p>This element uses CSS logical properties that adapt to direction automatically.</p>
              <p className="text-sm text-gray-600 mt-2">
                margin-inline-start, padding-inline-start, border-inline-start
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-lg transform flip-rtl transition-transform">
                <svg className="w-6 h-6 text-white m-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <p>This arrow icon flips automatically in RTL mode using the flip-rtl class.</p>
            </div>
          </div>
        </div>

        {/* Spacing Utilities Demo */}
        <div className={getDirectionalClasses('card') + ' p-6'}>
          <h2 className={getTextAlignEnhanced('left') + ' text-xl font-semibold mb-4'}>
            Directional Spacing Utilities
          </h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-500 rounded ms-4"></div>
              <p className="ms-4">Using ms-4 (margin-inline-start)</p>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded me-4"></div>
              <p className="me-4">Using me-4 (margin-inline-end)</p>
            </div>
            <div className="ps-6 pe-2 bg-gray-100 rounded-lg py-4">
              <p>This container uses ps-6 (padding-inline-start) and pe-2 (padding-inline-end)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RTLDemo;
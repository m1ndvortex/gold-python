import React from 'react';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Sidebar } from './Sidebar';
import { useLanguage } from '../../hooks/useLanguage';
import { useDirectionAdapter } from '../../utils/directionAdapter';
import { cn } from '../../lib/utils';

interface MobileSidebarProps {
  className?: string;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ className }) => {
  const { t, direction, language } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);
  const directionAdapter = useDirectionAdapter(language, direction);
  
  const isRTL = direction === 'rtl';

  return (
    <div className={cn('md:hidden', className)}>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-10 w-10 p-0 hover:bg-gradient-to-r hover:from-green-100 hover:to-teal-100 hover:text-green-700 transition-all duration-200',
              'border border-transparent hover:border-green/20 rounded-lg',
              'shadow-sm hover:shadow-md'
            )}
            aria-label="Open navigation menu"
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Menu className="h-5 w-5" />
            </motion.div>
          </Button>
        </SheetTrigger>
        
        <SheetContent 
          side={isRTL ? "right" : "left"}
          className={cn(
            'p-0 w-80 bg-gradient-to-b from-slate-50 to-slate-100',
            isRTL ? 'border-s border-border/50' : 'border-e border-border/50'
          )}
        >
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                'flex items-center',
                isRTL ? 'space-x-reverse' : '',
                'space-x-3'
              )}
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-green/25">
                  <span className="text-white font-bold text-lg">G</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-teal-400 rounded-full animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-foreground text-lg leading-tight">
                  {t('common.gold_shop_management')}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  Mobile Menu
                </span>
              </div>
            </motion.div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-green-100 hover:to-teal-100 hover:text-green-700"
              aria-label="Close navigation menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-hidden">
            <Sidebar 
              isCollapsed={false} 
              onToggle={() => {}} 
              className="border-0 shadow-none bg-transparent h-full"
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
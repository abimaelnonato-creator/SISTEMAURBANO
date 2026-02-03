// ============================================
// THEME TOGGLE COMPONENT
// Sistema de Gestão Urbana Parnamirim
// ============================================

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ThemeToggleProps {
  variant?: 'buttons' | 'dropdown' | 'icon';
  className?: string;
}

export default function ThemeToggle({ variant = 'buttons', className }: ThemeToggleProps) {
  const { theme, setTheme, toggleTheme } = useTheme();

  const options = [
    { value: 'light' as const, icon: Sun, label: 'Claro' },
    { value: 'dark' as const, icon: Moon, label: 'Escuro' },
    { value: 'system' as const, icon: Monitor, label: 'Sistema' },
  ];

  if (variant === 'icon') {
    const currentIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;
    const CurrentIcon = currentIcon;
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={toggleTheme}
            className={cn(
              'p-2 rounded-lg transition-all',
              'hover:bg-muted text-muted-foreground hover:text-foreground',
              className
            )}
          >
            <CurrentIcon className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            Tema: {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Sistema'}
          </p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center bg-muted rounded-lg p-1',
        className
      )}
    >
      {options.map(({ value, icon: Icon, label }) => (
        <Tooltip key={value}>
          <TooltipTrigger asChild>
            <button
              onClick={() => setTheme(value)}
              className={cn(
                'p-2 rounded-md transition-all',
                theme === value
                  ? 'bg-background shadow-sm text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

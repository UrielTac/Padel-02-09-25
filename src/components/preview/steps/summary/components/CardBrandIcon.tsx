import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CardBrandIconProps {
  brand: string;
  className?: string;
}

export function CardBrandIcon({ brand, className }: CardBrandIconProps) {
  return <CreditCard className={cn('h-4 w-4', className)} />;
} 
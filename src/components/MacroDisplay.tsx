import React from "react";
import { Flame, Beef, Cookie, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";

interface MacroDisplayProps {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

// Primary colors matching the pie chart
const MACRO_COLORS = {
  calories: {
    text: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  protein: {
    text: 'text-red-600',
    bg: 'bg-red-600/10',
  },
  carbs: {
    text: 'text-blue-600',
    bg: 'bg-blue-600/10',
  },
  fat: {
    text: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
  },
} as const;

export const MacroDisplay = ({ 
  calories = 0, 
  protein = 0, 
  carbs = 0, 
  fat = 0 
}: MacroDisplayProps) => {
  const formatNumber = (value: number | null) => {
    if (value === null || isNaN(value)) return '0';
    return value.toLocaleString();
  };

  const macros = [
    {
      label: "Calories",
      value: formatNumber(calories),
      unit: "kcal",
      icon: Flame,
      color: MACRO_COLORS.calories.text,
      bgColor: MACRO_COLORS.calories.bg,
    },
    {
      label: "Protein",
      value: formatNumber(protein),
      unit: "g",
      icon: Beef,
      color: MACRO_COLORS.protein.text,
      bgColor: MACRO_COLORS.protein.bg,
    },
    {
      label: "Carbs",
      value: formatNumber(carbs),
      unit: "g",
      icon: Cookie,
      color: MACRO_COLORS.carbs.text,
      bgColor: MACRO_COLORS.carbs.bg,
    },
    {
      label: "Fat",
      value: formatNumber(fat),
      unit: "g",
      icon: Droplets,
      color: MACRO_COLORS.fat.text,
      bgColor: MACRO_COLORS.fat.bg,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-up">
      {macros.map((macro) => (
        <div
          key={macro.label}
          className={cn(
            "p-4 rounded-lg flex flex-col items-center justify-center gap-2",
            "border border-border/50 hover:border-primary/50 transition-colors",
            macro.bgColor
          )}
        >
          <macro.icon className={cn("w-8 h-8", macro.color)} />
          <div className="text-center">
            <div className={cn("font-semibold text-lg", macro.color)}>
              {macro.value}
              <span className="text-sm font-normal ml-1 text-foreground/70">{macro.unit}</span>
            </div>
            <div className="text-sm text-muted-foreground">{macro.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};
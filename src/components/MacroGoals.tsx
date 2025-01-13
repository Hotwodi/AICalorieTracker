import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFoodLog } from "@/context/FoodLogContext";
import { Progress } from "@/components/ui/progress";
import { Flame, Beef, Droplets, Cookie } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const MacroGoals = () => {
  const { 
    dailyMacroGoals, 
    setDailyMacroGoals, 
    getTodaysMacroTotals 
  } = useFoodLog();

  const [editingMacro, setEditingMacro] = useState<'calories' | 'protein' | 'carbs' | 'fat' | null>(null);
  const [editValue, setEditValue] = useState('');

  const todaysMacros = getTodaysMacroTotals();

  const macroItems = [
    {
      label: "Calories",
      icon: Flame,
      current: todaysMacros.calories,
      goal: dailyMacroGoals.calories,
      color: "bg-orange-500",
      inputKey: 'calories'
    },
    {
      label: "Protein",
      icon: Beef,
      current: todaysMacros.protein,
      goal: dailyMacroGoals.protein,
      color: "bg-red-600",
      inputKey: 'protein'
    },
    {
      label: "Carbs",
      icon: Cookie,
      current: todaysMacros.carbs,
      goal: dailyMacroGoals.carbs,
      color: "bg-blue-600",
      inputKey: 'carbs'
    },
    {
      label: "Fat",
      icon: Droplets,
      current: todaysMacros.fat,
      goal: dailyMacroGoals.fat,
      color: "bg-yellow-500",
      inputKey: 'fat'
    }
  ];

  const handleEditStart = (macro: 'calories' | 'protein' | 'carbs' | 'fat') => {
    setEditingMacro(macro);
    setEditValue(dailyMacroGoals[macro].toString());
  };

  const handleEditSave = () => {
    if (editingMacro) {
      const numValue = Number(editValue);
      if (!isNaN(numValue) && numValue >= 0) {
        setDailyMacroGoals({
          ...dailyMacroGoals,
          [editingMacro]: numValue
        });
      }
      setEditingMacro(null);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Daily Macro Goals</h2>
      
      <div className="space-y-4">
        {macroItems.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${item.color}`} />
                <span className="font-medium">{item.label}</span>
              </div>
              
              {editingMacro === item.inputKey ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="w-20"
                    autoFocus
                  />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleEditSave}
                  >
                    Save
                  </Button>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded-md p-1"
                  onClick={() => handleEditStart(item.inputKey as 'calories' | 'protein' | 'carbs' | 'fat')}
                >
                  <span className="font-semibold">
                    {todaysMacros[item.inputKey as keyof typeof todaysMacros]} / {item.goal}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    ✏️
                  </Button>
                </div>
              )}
            </div>
            <Progress 
              value={Math.min(100, (todaysMacros[item.inputKey as keyof typeof todaysMacros] / item.goal) * 100)} 
              className={`${item.color}/20`}
            />
          </div>
        ))}
      </div>

      <div className="text-sm text-muted-foreground text-center">
        Click on a macro to edit your daily goal
      </div>
    </Card>
  );
};

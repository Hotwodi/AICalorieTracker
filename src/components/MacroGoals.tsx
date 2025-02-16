import React, { useState, useEffect } from 'react';
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
    getTodaysMacroTotals,
    foodLog 
  } = useFoodLog();

  const [editingMacro, setEditingMacro] = useState<'calories' | 'protein' | 'carbs' | 'fat' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [todaysMacros, setTodaysMacros] = useState(getTodaysMacroTotals());

  useEffect(() => {
    setTodaysMacros(getTodaysMacroTotals());
  }, [foodLog, getTodaysMacroTotals]);

  const macroItems = [
    {
      label: "Calories",
      icon: Flame,
      current: todaysMacros.calories,
      goal: dailyMacroGoals.calories,
      color: "text-orange-500",
      bgColor: "bg-orange-500",
      unit: "kcal",
      inputKey: 'calories'
    },
    {
      label: "Protein",
      icon: Beef,
      current: todaysMacros.protein,
      goal: dailyMacroGoals.protein,
      color: "text-red-600",
      bgColor: "bg-red-600",
      unit: "g",
      inputKey: 'protein'
    },
    {
      label: "Carbs",
      icon: Cookie,
      current: todaysMacros.carbs,
      goal: dailyMacroGoals.carbs,
      color: "text-blue-600",
      bgColor: "bg-blue-600",
      unit: "g",
      inputKey: 'carbs'
    },
    {
      label: "Fat",
      icon: Droplets,
      current: todaysMacros.fat,
      goal: dailyMacroGoals.fat,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500",
      unit: "g",
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
      
      <div className="space-y-6">
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
                    min="0"
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
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {item.current.toLocaleString()} / {item.goal.toLocaleString()} {item.unit}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditStart(item.inputKey as any)}
                  >
                    Edit
                  </Button>
                </div>
              )}
            </div>
            
            <Progress 
              value={(item.current / item.goal) * 100} 
              className={`h-2 ${item.bgColor}`}
            />
          </div>
        ))}
      </div>
    </Card>
  );
};

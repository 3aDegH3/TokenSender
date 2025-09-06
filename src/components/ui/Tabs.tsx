"use client";
import React, { createContext, useContext, useState } from 'react';

type TabsContextType = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextType | undefined>(undefined);

interface TabsProps {
  defaultValue: string;
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  className?: string; // <-- اضافه شد
}

export function Tabs({ defaultValue, children, onValueChange, className = "" }: TabsProps) {
  const [value, setValue] = useState(defaultValue);
  
  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    onValueChange?.(newValue);
  };
  
  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={`w-full ${className}`.trim()}>{children}</div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

export function TabsList({ children, className = "" }: TabsListProps) {
  return (
    <div className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full ${className}`}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className = "" }: TabsTriggerProps) {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("TabsTrigger must be used within a Tabs component");
  }
  
  const { value: currentValue, onValueChange } = context;
  const isActive = value === currentValue;
  
  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={`
        inline-flex items-center justify-center 
        whitespace-nowrap 
        rounded-sm 
        px-3 py-1.5 
        text-sm font-medium 
        ring-offset-background 
        transition-all 
        focus-visible:outline-none 
        focus-visible:ring-2 
        focus-visible:ring-ring 
        focus-visible:ring-offset-2 
        disabled:pointer-events-none 
        disabled:opacity-50
        ${isActive 
          ? "bg-background text-foreground shadow-sm" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"}
        ${className}
      `}
    >
      {children}
    </button>
  );
}

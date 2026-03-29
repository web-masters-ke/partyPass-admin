"use client";

import { ReactNode, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TimeRangeOption {
  label: string;
  value: string;
}

interface ChartCardProps {
  title: string;
  children: ReactNode;
  timeRanges?: TimeRangeOption[];
  onTimeRangeChange?: (value: string) => void;
  className?: string;
  height?: number;
}

export function ChartCard({
  title,
  children,
  timeRanges,
  onTimeRangeChange,
  className = "",
}: ChartCardProps) {
  const [activeRange, setActiveRange] = useState(timeRanges?.[0]?.value ?? "");

  const handleRangeChange = (value: string) => {
    setActiveRange(value);
    onTimeRangeChange?.(value);
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {title}
        </CardTitle>
        {timeRanges && timeRanges.length > 0 && (
          <div className="flex gap-1">
            {timeRanges.map((r) => (
              <button
                key={r.value}
                onClick={() => handleRangeChange(r.value)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeRange === r.value
                    ? "bg-[#D93B2F] text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

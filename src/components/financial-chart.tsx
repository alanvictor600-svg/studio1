
"use client"

import { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import type { AdminHistoryEntry } from "@/types"
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface FinancialChartProps {
  data: AdminHistoryEntry[]
}

const chartConfig = {
  totalRevenue: {
    label: "Receita Total",
    color: "hsl(var(--chart-2))",
  },
  totalPrizePool: {
    label: "Prêmio",
    color: "hsl(var(--chart-1))",
  },
  totalOwnerCommission: {
    label: "Comissão (Bolão)",
    color: "hsl(var(--chart-3))",
  },
  totalSellerCommission: {
    label: "Comissão (Vendedores)",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export function FinancialChart({ data }: FinancialChartProps) {
  const chartData = useMemo(() => {
    // Reverse the data to show oldest to newest, which is better for a time-series chart
    return data.slice().reverse().map(entry => ({
      ...entry,
      endDateFormatted: format(parseISO(entry.endDate), "dd/MM", { locale: ptBR }),
    }))
  }, [data])

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer>
        <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="endDateFormatted"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value}
          />
           <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => `R$${value}`}
          />
          <Tooltip
            cursor={false}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const tooltipData = payload.map(p => ({
                  name: chartConfig[p.dataKey as keyof typeof chartConfig]?.label || p.name,
                  value: p.value,
                  color: p.color
                }));

                return (
                  <div className="z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
                    <p className="font-bold">{payload[0].payload.endDateFormatted}</p>
                    {tooltipData.map((p, i) => (
                      <div key={i} className="flex justify-between gap-4">
                        <span style={{ color: p.color }}>{p.name}:</span>
                        <span>R$ {typeof p.value === 'number' ? p.value.toFixed(2).replace('.', ',') : p.value}</span>
                      </div>
                    ))}
                  </div>
                )
              }
              return null;
            }}
          />
          <Legend content={({ payload }) => {
            if (!payload) return null;
            return (
              <div className="flex items-center justify-center gap-4 pt-4">
                {payload.map((entry, index) => {
                  const configKey = entry.dataKey as keyof typeof chartConfig;
                  if (!chartConfig[configKey]) return null;
                  return (
                    <div key={`item-${index}`} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                       <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                       {chartConfig[configKey].label}
                    </div>
                  );
                })}
              </div>
            );
          }}/>
          <Bar dataKey="totalRevenue" fill="var(--color-totalRevenue)" radius={4} />
          <Bar dataKey="totalPrizePool" fill="var(--color-totalPrizePool)" radius={4} />
          <Bar dataKey="totalOwnerCommission" fill="var(--color-totalOwnerCommission)" radius={4} />
          <Bar dataKey="totalSellerCommission" fill="var(--color-totalSellerCommission)" radius={4} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

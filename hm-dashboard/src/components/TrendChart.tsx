import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface DataPoint {
  date: string
  value: number
  volume?: number
}

interface TrendSeries {
  name: string
  data: DataPoint[]
  color?: string
}

interface TrendChartProps {
  title: string
  description?: string
  series: TrendSeries[]
  showVolume?: boolean
  height?: number
  dateFormat?: 'month' | 'quarter' | 'year'
  enablePeriodComparison?: boolean
}

const PERIOD_OPTIONS = [
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: 'YTD', months: 9 }, // From Jan to Sep 2025
  { label: '12M', months: 12 }
]

export function TrendChart({ 
  title, 
  description, 
  series, 
  showVolume = false, 
  height = 300,
  dateFormat = 'month',
  enablePeriodComparison = false 
}: TrendChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('6M')
  const [comparisonMode, setComparisonMode] = useState(false)

  const calculateInsights = (data: DataPoint[]) => {
    if (data.length < 2) return null

    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const latest = sortedData[sortedData.length - 1]
    const previous = sortedData[sortedData.length - 2]
    const oldest = sortedData[0]
    
    const monthlyChange = latest.value - previous.value
    const totalChange = latest.value - oldest.value
    const trend = totalChange > 0 ? 'improving' : totalChange < 0 ? 'declining' : 'stable'
    
    const avgValue = data.reduce((sum, d) => sum + d.value, 0) / data.length
    const volatility = Math.sqrt(data.reduce((sum, d) => sum + Math.pow(d.value - avgValue, 2), 0) / data.length)

    return {
      monthlyChange: Math.round(monthlyChange * 100) / 100,
      totalChange: Math.round(totalChange * 100) / 100,
      trend,
      avgValue: Math.round(avgValue * 100) / 100,
      volatility: Math.round(volatility * 100) / 100,
      isVolatile: volatility > 5
    }
  }

  const { chartData, insights } = useMemo(() => {
    if (series.length === 0) return { chartData: null, insights: null }

    const selectedMonths = PERIOD_OPTIONS.find(p => p.label === selectedPeriod)?.months || 6
    
    // Filter data based on selected period
    const now = new Date('2025-09-01') // Current date in our mock data
    const startDate = new Date(now.getFullYear(), now.getMonth() - selectedMonths + 1, 1)
    
    const filteredSeries = series.map(s => ({
      ...s,
      data: s.data.filter(d => new Date(d.date) >= startDate).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }))

    // Prepare chart options
    const dates = [...new Set(filteredSeries.flatMap(s => s.data.map(d => d.date)))].sort()
    
    const chartSeries = filteredSeries.map((s, index) => ({
      name: s.name,
      type: 'line',
      data: dates.map(date => {
        const point = s.data.find(d => d.date === date)
        return point ? point.value : null as number | null
      }),
      smooth: true,
      lineStyle: { width: 3 },
      itemStyle: { color: s.color || ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'][index % 5] },
      emphasis: { focus: 'series' }
    }))

    // Add volume series if requested
    if (showVolume && filteredSeries[0]) {
      chartSeries.push({
        name: 'Volume',
        type: 'bar',
        yAxisIndex: 1,
        data: dates.map(date => {
          const point = filteredSeries[0].data.find(d => d.date === date)
          return point ? (point.volume || 0) : 0
        }),
        itemStyle: { color: 'rgba(156, 163, 175, 0.3)' }
      } as any)
    }

    const chartOptions = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: (params: any) => {
          let content = `<strong>${params[0].axisValue}</strong><br/>`
          params.forEach((param: any) => {
            if (param.seriesName !== 'Volume') {
              content += `${param.marker} ${param.seriesName}: <strong>${param.value}</strong><br/>`
            } else {
              content += `${param.marker} ${param.seriesName}: ${param.value} reviews<br/>`
            }
          })
          return content
        }
      },
      legend: {
        data: chartSeries.map(s => s.name),
        top: 10
      },
      xAxis: {
        type: 'category',
        data: dates.map(date => {
          const d = new Date(date)
          if (dateFormat === 'quarter') {
            return `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`
          } else if (dateFormat === 'year') {
            return d.getFullYear().toString()
          } else {
            return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          }
        }),
        axisLine: { lineStyle: { color: '#e5e7eb' } },
        axisTick: { lineStyle: { color: '#e5e7eb' } },
        axisLabel: { 
          color: '#6b7280',
          rotate: dates.length > 6 ? 45 : 0
        }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Score',
          min: Math.min(...filteredSeries.flatMap(s => s.data.map(d => d.value))) - 5,
          max: Math.max(...filteredSeries.flatMap(s => s.data.map(d => d.value))) + 5,
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisTick: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280' },
          splitLine: { lineStyle: { color: '#f3f4f6' } }
        },
        ...(showVolume ? [{
          type: 'value',
          name: 'Volume',
          position: 'right',
          axisLine: { lineStyle: { color: '#e5e7eb' } },
          axisTick: { lineStyle: { color: '#e5e7eb' } },
          axisLabel: { color: '#6b7280' },
          splitLine: { show: false }
        }] : [])
      ],
      series: chartSeries,
      grid: {
        left: '3%',
        right: showVolume ? '8%' : '4%',
        bottom: dates.length > 6 ? '15%' : '3%',
        top: '20%',
        containLabel: true
      },
      dataZoom: dates.length > 12 ? [{
        type: 'slider',
        start: 70,
        end: 100
      }] : undefined
    }

    // Calculate insights
    const insights = filteredSeries.length > 0 ? calculateInsights(filteredSeries[0].data) : null

    return { chartData: chartOptions, insights }
  }, [series, selectedPeriod, showVolume, dateFormat])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center space-x-2">
            {enablePeriodComparison && (
              <Button
                variant={comparisonMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setComparisonMode(!comparisonMode)}
              >
                Compare
              </Button>
            )}
            {PERIOD_OPTIONS.map(period => (
              <Button
                key={period.label}
                variant={selectedPeriod === period.label ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod(period.label)}
              >
                {period.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {chartData && (
          <div style={{ height: `${height}px` }}>
            <ReactECharts option={chartData} style={{ height: '100%', width: '100%' }} />
          </div>
        )}
        
        {insights && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Monthly Change</p>
              <p className={`text-lg font-bold ${insights.monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {insights.monthlyChange >= 0 ? '+' : ''}{insights.monthlyChange}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Period Change</p>
              <p className={`text-lg font-bold ${insights.totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {insights.totalChange >= 0 ? '+' : ''}{insights.totalChange}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Average</p>
              <p className="text-lg font-bold">{insights.avgValue}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Trend</p>
              <p className={`text-lg font-bold capitalize ${
                insights.trend === 'improving' ? 'text-green-600' : 
                insights.trend === 'declining' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {insights.trend}
                {insights.isVolatile && ' (Volatile)'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
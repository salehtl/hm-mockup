import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendChart } from './TrendChart'
import { useAssetTrendData } from '@/hooks/useAssetTrendData'
import { BarChart3 } from 'lucide-react'

export function AssetTrendChart() {
  const [selectedAssetId, setSelectedAssetId] = useState<string>('')
  const { trendData, availableAssets, isLoading } = useAssetTrendData(selectedAssetId || null)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 size={20} />
            Asset Performance Trends
          </CardTitle>
          <CardDescription>Select a channel asset to view its performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 size={20} />
              Asset Performance Trends
            </CardTitle>
            <CardDescription>
              {selectedAssetId 
                ? `Performance trends for ${trendData?.assetName || 'selected asset'} (${trendData?.assetType || 'unknown'})` 
                : 'Select a channel asset to view its performance over time'
              }
            </CardDescription>
          </div>
          <div className="w-80">
            <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an asset" />
              </SelectTrigger>
              <SelectContent>
                {availableAssets.map(asset => (
                  <SelectItem key={asset.id} value={asset.id}>
                    <div className="flex items-center gap-2">
                      <span>{asset.typeIcon}</span>
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{asset.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {asset.typeLabel} • {asset.entityName}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!selectedAssetId ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Select a channel asset to view trends</p>
              <p className="text-sm">Choose from {availableAssets.length} available assets</p>
              <div className="flex justify-center gap-4 mt-3 text-xs">
                <span>📱 {availableAssets.filter(a => a.type === 'app').length} Apps</span>
                <span>🌐 {availableAssets.filter(a => a.type === 'web').length} Web</span>
                <span>🏢 {availableAssets.filter(a => a.type === 'service_center').length} Centers</span>
                <span>🔗 {availableAssets.filter(a => a.type === 'shared_platform').length} Shared</span>
              </div>
            </div>
          </div>
        ) : trendData ? (
          <div className="mt-4">
            <TrendChart
              title=""
              series={[{
                name: `${trendData.assetName} Score`,
                data: trendData.data.map(point => ({
                  date: point.date,
                  value: point.score,
                  volume: point.volume
                })),
                color: trendData.assetType === 'app' ? '#3b82f6' : 
                       trendData.assetType === 'web' ? '#10b981' : 
                       trendData.assetType === 'service_center' ? '#f59e0b' : '#8b5cf6'
              }]}
              showVolume={true}
              height={350}
              enablePeriodComparison={true}
            />

            {/* Asset-specific insights */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Current Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {trendData.data[trendData.data.length - 1]?.score.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">Latest rating • {trendData.assetType}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(trendData.data.reduce((sum, d) => sum + d.score, 0) / trendData.data.length).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-500">6-month average</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {trendData.data.reduce((sum, d) => sum + d.volume, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">6-month total</div>
                </CardContent>
              </Card>
            </div>

            {/* Performance indicators */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-3">Performance Analysis - {trendData.assetType.replace('_', ' ').toUpperCase()}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Trend Direction: </span>
                  {(() => {
                    const first = trendData.data[0].score
                    const last = trendData.data[trendData.data.length - 1].score
                    const change = last - first
                    if (change > 2) return <span className="text-green-600 font-medium">Improving ↗</span>
                    if (change < -2) return <span className="text-red-600 font-medium">Declining ↘</span>
                    return <span className="text-gray-600 font-medium">Stable →</span>
                  })()}
                </div>
                <div>
                  <span className="font-medium">Score Range: </span>
                  <span>
                    {Math.min(...trendData.data.map(d => d.score)).toFixed(1)} - {Math.max(...trendData.data.map(d => d.score)).toFixed(1)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Performance Level: </span>
                  {(() => {
                    const avg = trendData.data.reduce((sum, d) => sum + d.score, 0) / trendData.data.length
                    if (avg >= 85) return <span className="text-green-600 font-medium">Excellent</span>
                    if (avg >= 70) return <span className="text-blue-600 font-medium">Good</span>
                    if (avg >= 60) return <span className="text-yellow-600 font-medium">Fair</span>
                    return <span className="text-red-600 font-medium">Needs Improvement</span>
                  })()}
                </div>
                <div>
                  <span className="font-medium">Review Volume: </span>
                  {(() => {
                    const avgVolume = trendData.data.reduce((sum, d) => sum + d.volume, 0) / trendData.data.length
                    const threshold = trendData.assetType === 'service_center' ? 200 : 
                                    trendData.assetType === 'app' ? 150 : 
                                    trendData.assetType === 'shared_platform' ? 120 : 100
                    if (avgVolume >= threshold) return <span className="text-green-600 font-medium">High</span>
                    if (avgVolume >= threshold * 0.6) return <span className="text-blue-600 font-medium">Medium</span>
                    return <span className="text-yellow-600 font-medium">Low</span>
                  })()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No trend data available for the selected asset</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
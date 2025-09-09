import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApiData } from '@/hooks/useApiData'
import { useEntity } from '@/contexts/EntityContext'
import { useTrendData } from '@/hooks/useTrendData'
import { TrendChart } from '@/components/TrendChart'
import { useMemo, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { apiEndpoints } from '@/lib/api'

interface DCXJourney {
  id: string
  name: string
  description: string
  steps: string[]
}

export function DCX() {
  const { selectedEntity } = useEntity()
  const { services, dcxReviews, serviceReviews, isLoading } = useApiData()
  const { dcxTrendData } = useTrendData()
  const [dcxJourneys, setDcxJourneys] = useState<DCXJourney[]>([])
  const [allServices, setAllServices] = useState<any[]>([])
  const [allEntities, setAllEntities] = useState<any[]>([])
  const [selectedDcxId, setSelectedDcxId] = useState<string | null>(null)
  const [journeyTypeFilter, setJourneyTypeFilter] = useState<'all' | 'single-entity' | 'cross-entity'>('all')
  const [performanceFilter, setPerformanceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all')

  // Fetch DCX journeys, all services, and all entities
  useMemo(() => {
    async function fetchDcxData() {
      try {
        const [dcxResponse, servicesResponse, entitiesResponse] = await Promise.all([
          fetch(apiEndpoints.dcx),
          fetch(apiEndpoints.services),
          fetch(apiEndpoints.entities)
        ])
        const [dcxData, allServicesData, entitiesData] = await Promise.all([
          dcxResponse.json(),
          servicesResponse.json(),
          entitiesResponse.json()
        ])
        setDcxJourneys(dcxData)
        setAllServices(allServicesData)
        setAllEntities(entitiesData)
      } catch (error) {
        console.error('Failed to fetch DCX data:', error)
      }
    }
    fetchDcxData()
  }, [])

  const dcxData = useMemo(() => {
    if (isLoading || dcxJourneys.length === 0 || allServices.length === 0) return null

    const entityServiceIds = services.map(s => s.id)
    const relevantDcxJourneys = selectedEntity 
      ? dcxJourneys.filter(dcx => dcx.steps.some(step => entityServiceIds.includes(step)))
      : dcxJourneys

    // Enhanced DCX analysis with service performance correlation
    const dcxWithAnalysis = relevantDcxJourneys.map(dcx => {
      const dcxReview = dcxReviews.find(r => r.dcxId === dcx.id)
      const score = dcxReview ? dcxReview.score : 0
      const reviewCount = dcxReview ? dcxReview.n : 0

      // Resolve steps with detailed service analysis
      const steps = dcx.steps.map((stepServiceId, index) => {
        const service = allServices.find(s => s.id === stepServiceId)
        if (service) {
          const entity = allEntities.find(e => e.id === service.entityId)
          
          // Get service reviews for performance analysis
          const serviceReviewsForService = serviceReviews.filter(r => r.serviceId === service.id)
          const servicePerformance = serviceReviewsForService.length > 0
            ? serviceReviewsForService.reduce((sum, r) => sum + (r.score * r.n), 0) / 
              serviceReviewsForService.reduce((sum, r) => sum + r.n, 0)
            : 0
          
          const serviceReviewCount = serviceReviewsForService.reduce((sum, r) => sum + r.n, 0)
          
          return {
            id: service.id,
            name: service.name,
            owner: service.owner,
            entityId: service.entityId,
            entityName: entity ? entity.name : 'Unknown Entity',
            type: service.type,
            stepIndex: index + 1,
            servicePerformance: Math.round(servicePerformance * 100) / 100,
            serviceReviewCount,
            isBottleneck: servicePerformance < score - 10, // Service performing significantly below journey average
            isDcxEnabled: service.dcxIds && service.dcxIds.length > 0
          }
        } else {
          return {
            id: stepServiceId,
            name: `Unknown Service (${stepServiceId})`,
            owner: 'Unknown',
            entityId: 'unknown',
            entityName: 'Unknown Entity',
            type: 1,
            stepIndex: index + 1,
            servicePerformance: 0,
            serviceReviewCount: 0,
            isBottleneck: false,
            isDcxEnabled: false
          }
        }
      })

      // Journey analysis
      const involvedEntities = [...new Set(steps.map(s => s.entityId))].filter(e => e !== 'unknown')
      const isCrossEntity = involvedEntities.length > 1
      const journeyComplexity = steps.reduce((sum, step) => sum + (step.type === 2 ? 2 : 1), 0)
      const bottleneckCount = steps.filter(s => s.isBottleneck).length
      const averageStepPerformance = steps.length > 0 
        ? steps.reduce((sum, s) => sum + s.servicePerformance, 0) / steps.length 
        : 0
      
      // Calculate journey efficiency (DCX score vs average step performance)
      const journeyEfficiency = averageStepPerformance > 0 ? (score / averageStepPerformance) * 100 : 100
      
      // Determine performance category
      let performanceCategory: 'high' | 'medium' | 'low'
      if (score >= 85) performanceCategory = 'high'
      else if (score >= 70) performanceCategory = 'medium'
      else performanceCategory = 'low'

      return {
        ...dcx,
        score,
        reviewCount,
        steps,
        involvedEntities,
        isCrossEntity,
        journeyComplexity,
        bottleneckCount,
        averageStepPerformance: Math.round(averageStepPerformance * 100) / 100,
        journeyEfficiency: Math.round(journeyEfficiency * 100) / 100,
        performanceCategory,
        entityBreakdown: involvedEntities.map(entityId => ({
          entityId,
          entityName: allEntities.find(e => e.id === entityId)?.name || 'Unknown',
          stepCount: steps.filter(s => s.entityId === entityId).length
        }))
      }
    })

    // Apply filters
    let filteredJourneys = dcxWithAnalysis
    
    if (journeyTypeFilter === 'single-entity') {
      filteredJourneys = filteredJourneys.filter(dcx => !dcx.isCrossEntity)
    } else if (journeyTypeFilter === 'cross-entity') {
      filteredJourneys = filteredJourneys.filter(dcx => dcx.isCrossEntity)
    }
    
    if (performanceFilter !== 'all') {
      filteredJourneys = filteredJourneys.filter(dcx => dcx.performanceCategory === performanceFilter)
    }

    // Analytics calculations
    const analytics = {
      totalJourneys: filteredJourneys.length,
      crossEntityCount: filteredJourneys.filter(dcx => dcx.isCrossEntity).length,
      averageScore: filteredJourneys.length > 0 
        ? filteredJourneys.reduce((sum, dcx) => sum + (dcx.score * dcx.reviewCount), 0) / 
          filteredJourneys.reduce((sum, dcx) => sum + dcx.reviewCount, 0)
        : 0,
      averageComplexity: filteredJourneys.length > 0
        ? filteredJourneys.reduce((sum, dcx) => sum + dcx.journeyComplexity, 0) / filteredJourneys.length
        : 0,
      totalBottlenecks: filteredJourneys.reduce((sum, dcx) => sum + dcx.bottleneckCount, 0),
      performanceDistribution: {
        high: filteredJourneys.filter(dcx => dcx.performanceCategory === 'high').length,
        medium: filteredJourneys.filter(dcx => dcx.performanceCategory === 'medium').length,
        low: filteredJourneys.filter(dcx => dcx.performanceCategory === 'low').length
      }
    }

    return {
      journeys: filteredJourneys.sort((a, b) => b.score - a.score),
      analytics,
      crossEntityJourneys: dcxWithAnalysis.filter(dcx => dcx.isCrossEntity)
    }
  }, [dcxJourneys, services, dcxReviews, serviceReviews, isLoading, allServices, allEntities, journeyTypeFilter, performanceFilter])

  // Journey Performance vs Complexity scatter plot
  const performanceComplexityChart = useMemo(() => {
    if (!dcxData) return null
    
    const scatterData = dcxData.journeys
      .filter(dcx => dcx.reviewCount > 0)
      .map(dcx => ({
        value: [dcx.journeyComplexity, dcx.score],
        name: dcx.name,
        isCrossEntity: dcx.isCrossEntity,
        bottlenecks: dcx.bottleneckCount,
        itemStyle: {
          color: dcx.isCrossEntity ? '#8b5cf6' : 
                dcx.performanceCategory === 'high' ? '#10b981' :
                dcx.performanceCategory === 'medium' ? '#f59e0b' : '#ef4444'
        }
      }))
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          return (
            '<div><strong>' + params.data.name + '</strong></div>' +
            '<div>Score: ' + params.data.value[1] + '</div>' +
            '<div>Complexity: ' + params.data.value[0] + '</div>' +
            '<div>Bottlenecks: ' + params.data.bottlenecks + '</div>' +
            '<div>' + (params.data.isCrossEntity ? 'Cross-Entity Journey' : 'Single-Entity Journey') + '</div>'
          )
        }
      },
      legend: {
        data: ['High Performance', 'Medium Performance', 'Low Performance', 'Cross-Entity']
      },
      xAxis: {
        type: 'value',
        name: 'Journey Complexity',
        nameLocation: 'middle',
        nameGap: 30
      },
      yAxis: {
        type: 'value',
        name: 'Performance Score',
        nameLocation: 'middle',
        nameGap: 40,
        min: 60,
        max: 100
      },
      series: [
        {
          type: 'scatter',
          data: scatterData,
          symbolSize: function (data: number[]) {
            return Math.max(8, Math.min(20, data[0] * 2))
          }
        }
      ]
    }
  }, [dcxData])

  // Journey efficiency analysis
  const journeyEfficiencyChart = useMemo(() => {
    if (!dcxData) return null
    
    const topJourneys = dcxData.journeys.slice(0, 10)
    
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
        formatter: function(params: any) {
          const journey = topJourneys[params[0].dataIndex]
          return (
            '<div><strong>' + journey.name + '</strong></div>' +
            '<div>DCX Score: ' + params[0].value + '</div>' +
            '<div>Avg Step Performance: ' + params[1].value + '</div>' +
            '<div>Efficiency: ' + journey.journeyEfficiency + '%</div>' +
            '<div>Bottlenecks: ' + journey.bottleneckCount + '</div>'
          )
        }
      },
      legend: {
        data: ['DCX Score', 'Average Step Performance']
      },
      xAxis: {
        type: 'category',
        data: topJourneys.map(dcx => dcx.name.length > 16 ? dcx.name.substring(0, 16) + '...' : dcx.name),
        axisLabel: {
          rotate: 30,
          fontSize: 10
        }
      },
      yAxis: {
        type: 'value',
        min: 60,
        max: 100
      },
      series: [
        {
          name: 'DCX Score',
          type: 'bar',
          data: topJourneys.map(dcx => dcx.score),
          itemStyle: { 
            color: function(params: any) {
              const journey = topJourneys[params.dataIndex]
              if (journey.bottleneckCount > 0) return '#ef4444'
              if (journey.isCrossEntity) return '#8b5cf6'
              if (journey.score >= 85) return '#10b981'
              if (journey.score >= 70) return '#f59e0b'
              return '#ef4444'
            }
          }
        },
        {
          name: 'Average Step Performance',
          type: 'line',
          data: topJourneys.map(dcx => dcx.averageStepPerformance),
          itemStyle: { color: '#06b6d4' },
          lineStyle: { width: 3 }
        }
      ]
    }
  }, [dcxData])

  // Performance distribution donut
  const performanceDistributionChart = useMemo(() => {
    if (!dcxData) return null
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} journeys ({d}%)'
      },
      series: [
        {
          name: 'Performance Distribution',
          type: 'pie',
          radius: ['40%', '70%'],
          data: [
            { 
              value: dcxData.analytics.performanceDistribution.high, 
              name: 'High Performance (85+)', 
              itemStyle: { color: '#10b981' } 
            },
            { 
              value: dcxData.analytics.performanceDistribution.medium, 
              name: 'Medium Performance (70-84)', 
              itemStyle: { color: '#f59e0b' } 
            },
            { 
              value: dcxData.analytics.performanceDistribution.low, 
              name: 'Low Performance (<70)', 
              itemStyle: { color: '#ef4444' } 
            }
          ],
          label: {
            formatter: '{b}\n{c} journeys'
          }
        }
      ]
    }
  }, [dcxData])

  // Entity collaboration network
  const entityCollaborationChart = useMemo(() => {
    if (!dcxData) return null
    
    const entityConnections = new Map()
    const entityNodes = new Map()
    
    dcxData.journeys
      .filter(dcx => dcx.isCrossEntity)
      .forEach(dcx => {
        dcx.involvedEntities.forEach((entityId, index) => {
          const entityName = allEntities.find(e => e.id === entityId)?.name || 'Unknown'
          entityNodes.set(entityId, { id: entityId, name: entityName, symbolSize: 0 })
          
          // Connect to next entity in journey
          if (index < dcx.involvedEntities.length - 1) {
            const nextEntityId = dcx.involvedEntities[index + 1]
            const connectionKey = `${entityId}-${nextEntityId}`
            const reverseKey = `${nextEntityId}-${entityId}`
            
            if (!entityConnections.has(connectionKey) && !entityConnections.has(reverseKey)) {
              entityConnections.set(connectionKey, {
                source: entityId,
                target: nextEntityId,
                value: 1
              })
            } else {
              const existing = entityConnections.get(connectionKey) || entityConnections.get(reverseKey)
              if (existing) existing.value++
            }
          }
        })
      })
    
    // Update node sizes based on connections
    entityNodes.forEach((node, entityId) => {
      const connectionCount = Array.from(entityConnections.values())
        .filter(conn => conn.source === entityId || conn.target === entityId).length
      node.symbolSize = Math.max(20, Math.min(60, connectionCount * 10))
    })
    
    return {
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          if (params.dataType === 'node') {
            return '<div><strong>' + params.data.name + '</strong></div><div>Cross-entity connections</div>'
          } else {
            return '<div>Journey connections: ' + params.data.value + '</div>'
          }
        }
      },
      series: [
        {
          type: 'graph',
          layout: 'force',
          data: Array.from(entityNodes.values()),
          links: Array.from(entityConnections.values()),
          roam: true,
          force: {
            repulsion: 200,
            edgeLength: 100
          },
          itemStyle: {
            color: '#8b5cf6'
          },
          lineStyle: {
            color: '#94a3b8',
            width: 2
          }
        }
      ]
    }
  }, [dcxData, allEntities])

  const selectedDcxData = useMemo(() => {
    if (!selectedDcxId || !dcxData) return null
    return dcxData.journeys.find(dcx => dcx.id === selectedDcxId)
  }, [selectedDcxId, dcxData])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DCX Journey Intelligence</h1>
          <p className="text-muted-foreground">Loading comprehensive journey analytics...</p>
        </div>
      </div>
    )
  }

  if (!dcxData) return null

  const entityName = selectedEntity?.name || 'All Entities'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DCX Journey Intelligence</h1>
        <p className="text-muted-foreground">
          Advanced Digital Customer Experience analytics for {entityName} - Journey optimization and performance insights.
        </p>
      </div>

      {/* Journey Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="flex gap-2">
              <Button 
                variant={journeyTypeFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setJourneyTypeFilter('all')}
              >
                All Journeys ({dcxData.analytics.totalJourneys})
              </Button>
              <Button 
                variant={journeyTypeFilter === 'single-entity' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setJourneyTypeFilter('single-entity')}
              >
                🏢 Single-Entity ({dcxData.analytics.totalJourneys - dcxData.analytics.crossEntityCount})
              </Button>
              <Button 
                variant={journeyTypeFilter === 'cross-entity' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setJourneyTypeFilter('cross-entity')}
              >
                🔗 Cross-Entity ({dcxData.analytics.crossEntityCount})
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={performanceFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPerformanceFilter('all')}
            >
              All Performance
            </Button>
            <Button 
              variant={performanceFilter === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPerformanceFilter('high')}
            >
              🟢 High (85+) ({dcxData.analytics.performanceDistribution.high})
            </Button>
            <Button 
              variant={performanceFilter === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPerformanceFilter('medium')}
            >
              🟡 Medium (70-84) ({dcxData.analytics.performanceDistribution.medium})
            </Button>
            <Button 
              variant={performanceFilter === 'low' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPerformanceFilter('low')}
            >
              🔴 Low (&lt;70) ({dcxData.analytics.performanceDistribution.low})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Journeys</CardTitle>
            <div className="text-2xl">🗺️</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dcxData.analytics.totalJourneys}</div>
            <p className="text-xs text-muted-foreground">
              {journeyTypeFilter !== 'all' ? `${journeyTypeFilter} filtered` : 'total customer journeys'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average DCX Score</CardTitle>
            <div className="text-2xl">⭐</div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              dcxData.analytics.averageScore >= 85 ? 'text-green-600' : 
              dcxData.analytics.averageScore >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {Math.round(dcxData.analytics.averageScore * 100) / 100}
            </div>
            <p className="text-xs text-muted-foreground">
              Volume-weighted performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cross-Entity</CardTitle>
            <div className="text-2xl">🔗</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{dcxData.analytics.crossEntityCount}</div>
            <p className="text-xs text-muted-foreground">
              Multi-organization journeys
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Complexity</CardTitle>
            <div className="text-2xl">⚙️</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(dcxData.analytics.averageComplexity * 100) / 100}</div>
            <p className="text-xs text-muted-foreground">
              Journey complexity score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bottlenecks</CardTitle>
            <div className="text-2xl">⚠️</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{dcxData.analytics.totalBottlenecks}</div>
            <p className="text-xs text-muted-foreground">
              Underperforming steps
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Section */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Journey Efficiency Analysis */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Journey Performance vs Step Analysis</CardTitle>
            <CardDescription>
              DCX scores compared to individual step performance - Red bars indicate bottlenecks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ReactECharts option={journeyEfficiencyChart} style={{ height: '100%', width: '100%' }} />
            </div>
          </CardContent>
        </Card>

        {/* Performance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Distribution</CardTitle>
            <CardDescription>Journey quality breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ReactECharts option={performanceDistributionChart} style={{ height: '100%', width: '100%' }} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance vs Complexity Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Performance vs Complexity Matrix</CardTitle>
          <CardDescription>
            Journey performance plotted against complexity - Bubble size indicates complexity level
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ReactECharts option={performanceComplexityChart} style={{ height: '100%', width: '100%' }} />
          </div>
        </CardContent>
      </Card>

      {/* Entity Collaboration Network */}
      {dcxData.analytics.crossEntityCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Entity Collaboration Network</CardTitle>
            <CardDescription>
              Visual representation of cross-entity journey connections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ReactECharts option={entityCollaborationChart} style={{ height: '100%', width: '100%' }} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>DCX Performance Trends</CardTitle>
          <CardDescription>Historical journey performance evolution</CardDescription>
        </CardHeader>
        <CardContent>
          <TrendChart
            title=""
            description=""
            series={dcxTrendData.slice(0, 5)}
            showVolume={true}
            height={350}
            enablePeriodComparison={true}
          />
        </CardContent>
      </Card>

      {/* Journey Portfolio & Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Journey Portfolio */}
        <Card>
          <CardHeader>
            <CardTitle>Journey Portfolio</CardTitle>
            <CardDescription>
              Select journeys to inspect detailed step analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {dcxData.journeys.map((dcx) => (
                <div 
                  key={dcx.id} 
                  className={`p-3 border rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
                    selectedDcxId === dcx.id ? 'bg-accent border-primary' : ''
                  }`}
                  onClick={() => setSelectedDcxId(dcx.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm">{dcx.name}</p>
                        {dcx.isCrossEntity && (
                          <Badge variant="secondary" className="text-xs">🔗 Cross-Entity</Badge>
                        )}
                        {dcx.bottleneckCount > 0 && (
                          <Badge variant="destructive" className="text-xs">⚠️ {dcx.bottleneckCount}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{dcx.description}</p>
                      <div className="flex gap-1 text-xs text-muted-foreground">
                        <span>{dcx.steps.length} steps</span>
                        <span>•</span>
                        <span>{dcx.reviewCount} reviews</span>
                        <span>•</span>
                        <span>Complexity: {dcx.journeyComplexity}</span>
                        <span>•</span>
                        <span>Efficiency: {dcx.journeyEfficiency}%</span>
                      </div>
                      {dcx.entityBreakdown.length > 1 && (
                        <div className="flex gap-1 mt-1">
                          {dcx.entityBreakdown.map(entity => (
                            <Badge key={entity.entityId} variant="outline" className="text-xs">
                              {entity.entityName} ({entity.stepCount})
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${
                        dcx.score >= 85 ? 'text-green-600' : 
                        dcx.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {dcx.score}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Avg: {dcx.averageStepPerformance}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Journey Details */}
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDcxData ? '🔍 Journey Deep Dive' : '📋 Journey Analysis'}
            </CardTitle>
            <CardDescription>
              {selectedDcxData ? selectedDcxData.name : 'Select a journey to view comprehensive step analysis'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedDcxData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">DCX Score</p>
                    <p className={`text-2xl font-bold ${
                      selectedDcxData.score >= 85 ? 'text-green-600' : 
                      selectedDcxData.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {selectedDcxData.score}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Efficiency</p>
                    <p className="text-2xl font-bold">{selectedDcxData.journeyEfficiency}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Complexity</p>
                    <p className="text-2xl font-bold">{selectedDcxData.journeyComplexity}</p>
                  </div>
                </div>

                <div className="p-3 bg-accent/20 rounded-lg">
                  <p className="text-sm font-medium mb-1">Journey Insights</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>📊 Average Step Performance: {selectedDcxData.averageStepPerformance}</p>
                    <p>🔄 Total Steps: {selectedDcxData.steps.length}</p>
                    <p>📈 Customer Reviews: {selectedDcxData.reviewCount}</p>
                    {selectedDcxData.bottleneckCount > 0 && (
                      <p className="text-orange-600">⚠️ {selectedDcxData.bottleneckCount} bottleneck step(s) identified</p>
                    )}
                    {selectedDcxData.isCrossEntity && (
                      <p className="text-purple-600">🔗 Cross-entity journey spanning {selectedDcxData.involvedEntities.length} organizations</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium mb-2">📋 Journey Step Analysis</p>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {selectedDcxData.steps.map((step, index) => (
                      <div key={step?.id} className={`flex items-center justify-between p-3 rounded-lg border ${
                        step.isBottleneck ? 'border-red-200 bg-red-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <span className={`rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold ${
                            step.isBottleneck ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground'
                          }`}>
                            {index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{step?.name}</p>
                              {step.isBottleneck && <Badge variant="destructive" className="text-xs">Bottleneck</Badge>}
                              {step.isDcxEnabled && <Badge variant="secondary" className="text-xs">DCX</Badge>}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {step?.owner} • {step?.entityName}
                              {step?.type === 2 && ' • Type-2 Complex'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {step.serviceReviewCount} reviews
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold text-sm ${
                            step.servicePerformance >= 85 ? 'text-green-600' : 
                            step.servicePerformance >= 70 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {step.servicePerformance || '--'}
                          </p>
                          <p className="text-xs text-muted-foreground">Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <div className="text-4xl mb-2">🗺️</div>
                  <p>Select a DCX journey to view comprehensive step analysis and performance insights</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
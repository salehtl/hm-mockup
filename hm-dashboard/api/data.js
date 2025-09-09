// Mock data for the Happiness Meter Dashboard
export const data = {
  "dcx": [
    {
      "id": "dcx-property",
      "name": "Property Registration Journey", 
      "description": "Complete property registration and title transfer process",
      "steps": ["srv-001", "srv-002", "srv-003", "srv-004"],
      "category": "Business Services",
      "estimatedDuration": "Multiple sessions",
      "complexity": 1,
      "customerSegment": "Tourist",
      "priority": "standard", 
      "version": "2.3",
      "lastReviewed": "2025-08-29"
    },
    {
      "id": "dcx-business",
      "name": "Business License Application",
      "description": "End-to-end business license application and approval", 
      "steps": ["srv-010", "srv-011", "srv-012", "srv-013", "srv-014"],
      "category": "Business Services",
      "estimatedDuration": "2-4 hours",
      "complexity": 2,
      "customerSegment": "Corporate",
      "priority": "standard",
      "version": "1.4", 
      "lastReviewed": "2025-08-19"
    },
    {
      "id": "dcx-banking",
      "name": "Digital Banking Setup",
      "description": "New account opening and digital banking activation",
      "steps": ["srv-030", "srv-031", "srv-032"],
      "category": "General Services", 
      "estimatedDuration": "15-30 minutes",
      "complexity": 1,
      "customerSegment": "Citizen",
      "priority": "standard",
      "version": "3.1",
      "lastReviewed": "2025-09-05"
    }
  ],
  "entities": [
    {
      "id": "ent-001",
      "name": "Digital Dubai Municipality",
      "sector": "Government",
      "location": "Dubai"
    }
  ],
  "services": [
    {
      "id": "srv-001",
      "entityId": "ent-001", 
      "name": "Property Title Verification",
      "type": 1,
      "dcxIds": ["dcx-property"],
      "owner": "Land Department"
    },
    {
      "id": "srv-002",
      "entityId": "ent-001",
      "name": "Building Permit Application", 
      "type": 2,
      "dcxIds": ["dcx-property"],
      "owner": "Building Control"
    },
    {
      "id": "srv-010", 
      "entityId": "ent-001",
      "name": "Business License Registration",
      "type": 1,
      "dcxIds": ["dcx-business"],
      "owner": "Economic Development"
    }
  ],
  "channels": [
    {
      "id": "ch-001",
      "entityId": "ent-001",
      "type": "app",
      "name": "DubaiNow App"
    },
    {
      "id": "ch-002", 
      "entityId": "ent-001",
      "type": "web",
      "name": "Dubai Municipality Portal"
    },
    {
      "id": "ch-003",
      "entityId": "ent-001", 
      "type": "service_center",
      "name": "Deira Customer Service Center"
    }
  ],
  "serviceReviews": [
    {
      "id": "sr-001",
      "serviceId": "srv-001",
      "ts": "2025-09-01",
      "channelOfReview": "app",
      "score": 85,
      "n": 120
    },
    {
      "id": "sr-002",
      "serviceId": "srv-002", 
      "ts": "2025-09-01",
      "channelOfReview": "web",
      "phase": "process",
      "score": 72,
      "n": 45
    },
    {
      "id": "sr-003",
      "serviceId": "srv-002",
      "ts": "2025-09-01", 
      "channelOfReview": "web",
      "phase": "deliverable", 
      "score": 88,
      "n": 45
    }
  ],
  "channelRatings": [
    {
      "id": "cr-001",
      "channelId": "ch-001",
      "ts": "2025-09-01",
      "score": 78,
      "n": 200
    },
    {
      "id": "cr-002",
      "channelId": "ch-002", 
      "ts": "2025-09-01",
      "score": 65,
      "n": 150
    },
    {
      "id": "cr-003",
      "channelId": "ch-003",
      "ts": "2025-09-01", 
      "score": 45,
      "n": 80
    }
  ],
  "dcxReviews": [
    {
      "id": "dr-001",
      "dcxId": "dcx-property",
      "ts": "2025-09-01",
      "score": 75,
      "n": 25
    },
    {
      "id": "dr-002", 
      "dcxId": "dcx-business",
      "ts": "2025-09-01",
      "score": 82,
      "n": 18
    }
  ],
  "booths": [
    {
      "id": "booth-001",
      "centerId": "ch-003",
      "name": "Service Booth A"
    },
    {
      "id": "booth-002",
      "centerId": "ch-003", 
      "name": "Service Booth B"
    }
  ],
  "serviceChannels": [
    {
      "serviceId": "srv-001",
      "channelId": "ch-001",
      "isAvailableVia": true
    },
    {
      "serviceId": "srv-001",
      "channelId": "ch-002", 
      "isAvailableVia": true
    },
    {
      "serviceId": "srv-002",
      "channelId": "ch-002",
      "isAvailableVia": true
    }
  ]
};
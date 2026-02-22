export function simplifyAnomalyScore(score) {
  if (score > 100) return 'Very High \u2014 Unusual spike detected'
  if (score > 50) return 'High \u2014 Above normal levels'
  if (score > 10) return 'Moderate \u2014 Slightly elevated'
  return 'Normal \u2014 Within expected range'
}

export function simplifyAgentName(agent) {
  const map = {
    intake: 'Report Processor',
    analyst: 'Pattern Finder',
    research: 'Health Investigator',
    response: 'Alert Generator',
    accessibility: 'Communication Helper',
  }
  return map[agent] || agent
}

export function simplifyEventMessage(message) {
  return message
    .replace(/DBSCAN/gi, 'pattern detection')
    .replace(/spatiotemporal/gi, 'location and time')
    .replace(/anomaly score/gi, 'risk level')
    .replace(/cluster/gi, 'disease group')
    .replace(/epidemiological/gi, 'disease tracking')
    .replace(/SitRep/g, 'Status Report')
    .replace(/NLP extraction/gi, 'text analysis')
    .replace(/CHW/g, 'health worker')
    .replace(/IVR/g, 'phone system')
}

export function simplifyAlertCard(cluster) {
  const disease = cluster.probable_disease || 'Unknown illness'
  const cases = cluster.case_count
  if (cluster.anomaly_score > 100) {
    return `Many people sick with ${disease} in this area (${cases} cases). Send help now.`
  }
  return `${cases} people may have ${disease} in this area. Monitor closely.`
}

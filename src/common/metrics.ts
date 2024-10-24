import { Counter, Histogram, register } from "prom-client"

export const successNotificationMetricsCounter = new Counter({
    name: 'successfulNotifications',
    help: 'Number of successful notifications',
})

export const failedNotificationMetricsCounter = new Counter({
    name: 'failedNotifications',
    help: 'Number of failed notifications',
})

export const httpRequestMetricsCounter = new Counter({
    name: 'httpRequestsCounter',
    help: 'Number of requests on http endpoints',
    labelNames: ['method', 'endpoint', 'statusCode']
})

export const natsHistogram = new Histogram({
    name: 'natsConsumerHistogram',
    help: 'nats consumer duration histogram',
    labelNames: ['streamName', 'consumerName']
})

register.registerMetric(successNotificationMetricsCounter)
register.registerMetric(failedNotificationMetricsCounter)
register.registerMetric(httpRequestMetricsCounter)
register.registerMetric(natsHistogram)

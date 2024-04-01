 const
NOTIFICATION_EVENT_TOPIC            :string = "NOTIFICATION_EVENT_TOPIC",
NOTIFICATION_EVENT_GROUP            :string = "NOTIFICATION_EVENT_GROUP",
NOTIFICATION_EVENT_DURABLE          :string = "NOTIFICATION_EVENT_DURABLE",
ORCHESTRATOR_STREAM                 :string ="ORCHESTRATOR"

type NatsTopic={
    topicName:string
    streamName:string
    queueName:string
    consumerName:string
}

const natsTopicMapping = new Map<string,NatsTopic>([
    [NOTIFICATION_EVENT_TOPIC,{
    topicName:NOTIFICATION_EVENT_TOPIC,
        streamName:ORCHESTRATOR_STREAM,
        queueName:NOTIFICATION_EVENT_GROUP,
        consumerName:NOTIFICATION_EVENT_DURABLE
    }]
])

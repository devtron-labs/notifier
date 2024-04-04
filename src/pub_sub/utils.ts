
export const NOTIFICATION_EVENT_TOPIC            :string = "NOTIFICATION_EVENT_TOPIC"
export const NOTIFICATION_EVENT_GROUP            :string = "NOTIFICATION_EVENT_GROUP"
export const NOTIFICATION_EVENT_DURABLE          :string = "NOTIFICATION_EVENT_DURABLE"
export const ORCHESTRATOR_STREAM                 :string ="ORCHESTRATOR"
const ackWait:number =parseInt(process.env.ACK_WAIT)
const numReplicas:number =parseInt(process.env.REPLICAS)

export interface NatsTopic  {
    topicName:string
    streamName:string
    queueName:string
    consumerName:string
}
export interface NatsConsumerConfig{
    ack_wait:number
    num_replicas:number
}

export const NatsTopicMapping = new Map<string,NatsTopic>([
    [NOTIFICATION_EVENT_TOPIC,{
        topicName:NOTIFICATION_EVENT_TOPIC,
        streamName:ORCHESTRATOR_STREAM,
        queueName:NOTIFICATION_EVENT_GROUP,
        consumerName:NOTIFICATION_EVENT_DURABLE
    }]
])


export const NatsConsumerWiseConfigMapping = new Map<string, NatsConsumerConfig>(
    [[NOTIFICATION_EVENT_DURABLE, {

        ack_wait:!isNaN(ackWait)?ackWait:2*1e9,
        num_replicas:!isNaN(numReplicas)?numReplicas:0,

    }]
]);

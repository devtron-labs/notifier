import * as process from "process";

export const NOTIFICATION_EVENT_TOPIC: string = "NOTIFICATION_EVENT_TOPIC"
export const NOTIFICATION_EVENT_GROUP: string = "NOTIFICATION_EVENT_GROUP"
export const NOTIFICATION_EVENT_DURABLE: string = "NOTIFICATION_EVENT_DURABLE"
export const ORCHESTRATOR_STREAM: string = "ORCHESTRATOR"
const ackWait: number = parseInt(process.env.ACK_WAIT)
const consumerReplica: number = parseInt(process.env.CONSUMER_REPLICAS)
const maxAge: number = parseInt(process.env.MAX_AGE)
const streamReplica: number = parseInt(process.env.STREAM_REPLICA)

export interface NatsTopic {
    topicName: string
    streamName: string
    queueName: string
    consumerName: string
}

export interface NatsConsumerConfig {
    ack_wait: number
}

export interface NatsStreamConfig {
    max_age: number
}

export let NatsTopicMapping = new Map<string, NatsTopic>([
    [NOTIFICATION_EVENT_TOPIC, {
        topicName: NOTIFICATION_EVENT_TOPIC,
        streamName: ORCHESTRATOR_STREAM,
        queueName: NOTIFICATION_EVENT_GROUP,
        consumerName: NOTIFICATION_EVENT_DURABLE
    }]
])


export const NatsConsumerWiseConfigMapping = new Map<string, NatsConsumerConfig>(
    [[NOTIFICATION_EVENT_DURABLE, {

        ack_wait: !isNaN(ackWait) ? ackWait * 1e9 : 120 * 1e9,

    }]
    ]);

export const NatsStreamWiseConfigMapping = new Map<string, NatsStreamConfig>(
    [[ORCHESTRATOR_STREAM, {

        max_age: !isNaN(maxAge) ? maxAge * 1e9 : 86400 * 1e9,

    }]
    ]);

export function GetStreamSubjects(streamName: string): string[] {
    let subjArr: string[] = [];
    for (const [_, natsTopic] of NatsTopicMapping) {
        if (natsTopic.streamName === streamName) {
            subjArr.push(natsTopic.topicName);
        }
    }

    return subjArr;

}
